<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\AI\Contracts\DynamicPricingServiceInterface;
use Modules\Rental\AI\DTO\DynamicPricingRecommendationResult;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\RentalGeneralSettings;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalAiPricingTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_ai_pricing_endpoints(): void
    {
        $this->postJson(route('module.rental.ai_pricing_analyze'))
            ->assertUnauthorized();

        $this->postJson(route('module.rental.ai_pricing_apply'))
            ->assertUnauthorized();
    }

    public function test_unauthorized_users_cannot_access_ai_pricing_endpoints(): void
    {
        $this->actingAs($this->createUserWithRole())
            ->postJson(route('module.rental.ai_pricing_apply'), [
                'action_payload' => ['action' => 'update_rate', 'new_rate_per_period' => 400000],
            ])
            ->assertForbidden();
    }

    public function test_disabled_setting_blocks_ai_pricing_analysis(): void
    {
        RentalGeneralSettings::update(array_merge(RentalGeneralSettings::all(), [
            'ai_pricing_optimizer_enabled' => false,
        ]));

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.rental.ai_pricing_analyze'))
            ->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_generate_pricing_recommendations_returns_metrics_and_recommendations(): void
    {
        $mockResult = new DynamicPricingRecommendationResult(
            fleetUtilizationPercent: 78.5,
            estimatedRevenueUpliftPercent: 16.0,
            summary: 'Okupansi kelas MPV sangat tinggi di akhir pekan (88%). Disarankan penyesuaian tarif surge.',
            metrics: [
                'total_vehicles' => 10,
                'active_fleet_count' => 10,
                'booked_vehicles_count' => 8,
                'overall_utilization_percent' => 78.5,
                'weekday_utilization_percent' => 65.0,
                'weekend_utilization_percent' => 92.0,
                'class_breakdown' => [
                    'mpv' => [
                        'label' => 'MPV',
                        'total_units' => 6,
                        'utilization_percent' => 85.0,
                        'avg_daily_rate' => 350000,
                    ],
                ],
            ],
            recommendations: [
                [
                    'id' => 'rec_surge_mpv',
                    'type' => 'surge',
                    'target_type' => 'rental_class',
                    'target_identifier' => 'mpv',
                    'target_label' => 'Kelas MPV',
                    'current_rate' => 350000.0,
                    'suggested_rate' => 400000.0,
                    'adjustment_percent' => 14.3,
                    'confidence' => 0.94,
                    'title' => 'Kenaikan Tarif Weekend Kelas MPV',
                    'reason' => 'Okupansi akhir pekan 92%.',
                    'action_payload' => [
                        'action' => 'update_class_rate',
                        'rental_class' => 'mpv',
                        'new_rate_per_period' => 400000.0,
                    ],
                ],
            ],
            idleVehicles: [],
            rawResponse: ['status' => 'mocked'],
            generatedAt: '2026-08-19T11:00:00Z',
        );

        $this->mock(DynamicPricingServiceInterface::class, function (MockInterface $mock) use ($mockResult): void {
            $mock->shouldReceive('generatePricingRecommendations')
                ->once()
                ->with(30, 30)
                ->andReturn($mockResult);
        });

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.rental.ai_pricing_analyze'), [
                'lookback_days' => 30,
                'forecast_days' => 30,
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('result.fleet_utilization_percent', 78.5)
            ->assertJsonPath('result.estimated_revenue_uplift_percent', 16)
            ->assertJsonPath('result.recommendations.0.id', 'rec_surge_mpv')
            ->assertJsonPath('result.recommendations.0.suggested_rate', 400000);
    }

    public function test_apply_recommendation_updates_existing_rental_rate(): void
    {
        $rate = RentalRate::factory()->create([
            'name' => 'Tarif Dasar Avanza',
            'period_type' => RentalRate::PERIOD_DAILY,
            'rate_per_period' => 350000,
            'is_active' => true,
        ]);

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.rental.ai_pricing_apply'), [
                'action_payload' => [
                    'action' => 'update_rate',
                    'rental_rate_id' => $rate->id,
                    'new_rate_per_period' => 420000,
                ],
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('rate_id', $rate->id);

        $rate->refresh();
        $this->assertEquals(420000, (float) $rate->rate_per_period);
    }

    public function test_apply_recommendation_creates_or_updates_class_rate(): void
    {
        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.rental.ai_pricing_apply'), [
                'action_payload' => [
                    'action' => 'update_class_rate',
                    'rental_class' => 'suv',
                    'new_rate_per_period' => 600000,
                ],
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('rental_rates', [
            'rental_class' => 'suv',
            'period_type' => RentalRate::PERIOD_DAILY,
            'rate_per_period' => 600000,
        ]);
    }

    public function test_apply_recommendation_updates_specific_vehicle_rate(): void
    {
        $vehicle = Vehicle::factory()->create([
            'name' => 'Innova Zenix Q Hybrid',
            'status' => Vehicle::STATUS_ACTIVE,
        ]);

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.rental.ai_pricing_apply'), [
                'action_payload' => [
                    'action' => 'update_vehicle_rate',
                    'vehicle_id' => $vehicle->id,
                    'new_rate_per_period' => 850000,
                ],
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('rental_rates', [
            'vehicle_id' => $vehicle->id,
            'period_type' => RentalRate::PERIOD_DAILY,
            'rate_per_period' => 850000,
        ]);
    }
}
