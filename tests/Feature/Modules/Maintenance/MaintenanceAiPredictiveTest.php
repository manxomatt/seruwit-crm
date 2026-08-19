<?php

namespace Tests\Feature\Modules\Maintenance;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\AI\Contracts\PredictiveMaintenanceServiceInterface;
use Modules\Maintenance\AI\DTO\PredictiveMaintenanceResult;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Maintenance\Support\MaintenanceSettings;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class MaintenanceAiPredictiveTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_predictive_maintenance_endpoints(): void
    {
        $vehicle = Vehicle::factory()->create();

        $this->postJson(route('module.maintenance.ai_predictive_analyze'))
            ->assertUnauthorized();

        $this->postJson(route('module.maintenance.ai_predictive_vehicle', $vehicle))
            ->assertUnauthorized();

        $this->postJson(route('module.maintenance.ai_predictive_create_wo'))
            ->assertUnauthorized();
    }

    public function test_unauthorized_users_cannot_access_predictive_maintenance(): void
    {
        $this->actingAs($this->createUserWithRole())
            ->postJson(route('module.maintenance.ai_predictive_create_wo'), [
                'action_payload' => ['vehicle_id' => 1, 'title' => 'Test', 'scheduled_date' => '2026-09-01'],
            ])
            ->assertForbidden();
    }

    public function test_disabled_setting_blocks_predictive_maintenance_analysis(): void
    {
        MaintenanceSettings::update(array_merge(MaintenanceSettings::all(), [
            'ai_predictive_maintenance_enabled' => false,
        ]));

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.maintenance.ai_predictive_analyze'))
            ->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_analyze_fleet_health_returns_scores_and_service_forecasts(): void
    {
        $mockResult = new PredictiveMaintenanceResult(
            fleetHealthScore: 88.5,
            fleetRiskLevel: 'low',
            summary: 'Armada dalam kondisi sangat sehat dengan pemakaian wajar.',
            vehiclesAnalyzedCount: 5,
            criticalVehiclesCount: 1,
            serviceForecasts: [
                [
                    'vehicle_id' => 1,
                    'vehicle_name' => 'Avanza G 2023',
                    'plate_number' => 'B 1234 CD',
                    'rental_class' => 'mpv',
                    'current_odometer_km' => 42100,
                    'km_per_day_run_rate' => 55.0,
                    'next_service_type' => 'Ganti Oli Mesin & Filter',
                    'target_odometer_km' => 45000,
                    'predicted_due_date' => '2026-09-05',
                    'days_remaining' => 17,
                    'urgency' => 'due_soon',
                    'reason' => 'Berdasarkan laju 55 KM/hari, unit akan mencapai batas servis dalam 17 hari.',
                    'action_payload' => [
                        'action' => 'create_work_order',
                        'vehicle_id' => 1,
                        'title' => 'Ganti Oli Mesin & Filter Berkala',
                        'scheduled_date' => '2026-09-05',
                        'priority' => 'high',
                        'estimated_hours' => 1.5,
                        'odometer_at_service' => 45000,
                    ],
                ],
            ],
            anomalies: [
                [
                    'id' => 'anom_1',
                    'vehicle_id' => 1,
                    'vehicle_name' => 'Avanza G 2023',
                    'plate_number' => 'B 1234 CD',
                    'anomaly_type' => 'mileage_spike',
                    'severity' => 'warning',
                    'title' => 'Laju Pemakaian Tinggi',
                    'description' => 'Laju harian 110 KM/hari tercatat.',
                    'recommendation' => 'Pertimbangkan rotasi armada.',
                ],
            ],
            vehicleHealthScores: [
                1 => ['score' => 88, 'status' => 'good', 'issues_count' => 0],
            ],
            rawResponse: ['status' => 'mocked'],
            generatedAt: '2026-08-19T11:30:00Z',
        );

        $this->mock(PredictiveMaintenanceServiceInterface::class, function (MockInterface $mock) use ($mockResult): void {
            $mock->shouldReceive('analyzeFleetHealth')
                ->once()
                ->with(60, 30)
                ->andReturn($mockResult);
        });

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.maintenance.ai_predictive_analyze'), [
                'lookback_days' => 60,
                'forecast_days' => 30,
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('result.fleet_health_score', 88.5)
            ->assertJsonPath('result.fleet_risk_level', 'low')
            ->assertJsonPath('result.service_forecasts.0.vehicle_id', 1)
            ->assertJsonPath('result.service_forecasts.0.days_remaining', 17);
    }

    public function test_create_work_order_from_ai_recommendation_creates_work_order_record(): void
    {
        $vehicle = Vehicle::factory()->create(['name' => 'Innova Reborn Diesel']);
        $category = MaintenanceCategory::firstOrCreate(
            ['key' => 'engine'],
            ['name' => 'Mesin & Pelumasan', 'sort_order' => 1]
        );

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.maintenance.ai_predictive_create_wo'), [
                'action_payload' => [
                    'action' => 'create_work_order',
                    'vehicle_id' => $vehicle->id,
                    'title' => 'Ganti Oli & Filter Mesin AI',
                    'category_id' => $category->id,
                    'scheduled_date' => '2026-09-10',
                    'priority' => WorkOrder::PRIORITY_HIGH,
                    'estimated_hours' => 2.0,
                    'odometer_at_service' => 50000,
                ],
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['success', 'message', 'work_order_id']);

        $this->assertDatabaseHas('work_orders', [
            'vehicle_id' => $vehicle->id,
            'title' => 'Ganti Oli & Filter Mesin AI',
            'type' => WorkOrder::TYPE_PREVENTIVE,
            'status' => WorkOrder::STATUS_PENDING,
            'priority' => WorkOrder::PRIORITY_HIGH,
        ]);
    }

    public function test_diagnose_single_vehicle_health(): void
    {
        $vehicle = Vehicle::factory()->create([
            'name' => 'Xpander Cross',
            'odometer_km' => 35000,
            'status' => Vehicle::STATUS_ACTIVE,
        ]);

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.maintenance.ai_predictive_vehicle', $vehicle))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('result.vehicle_id', $vehicle->id)
            ->assertJsonPath('result.name', 'Xpander Cross')
            ->assertJsonStructure([
                'success',
                'result' => [
                    'vehicle_id',
                    'name',
                    'health_score',
                    'status',
                    'km_per_day_run_rate',
                    'current_odometer_km',
                ],
            ]);
    }
}
