<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\AI\Contracts\RentalRateAiGeneratorServiceInterface;
use Modules\Rental\AI\Services\GeminiRentalRateAiGeneratorService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalRateAiGenerateTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_rate_ai_generate_endpoint(): void
    {
        $this->postJson(route('module.rental.rates.ai-generate'), [
            'text' => 'Tarif Harian Avanza 450rb',
        ])->assertUnauthorized();
    }

    public function test_validation_fails_on_empty_text(): void
    {
        $admin = $this->createAdminUser();

        $this->actingAs($admin)
            ->postJson(route('module.rental.rates.ai-generate'), [
                'text' => '',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['text']);
    }

    public function test_ai_generate_returns_successful_data_structure(): void
    {
        $admin = $this->createAdminUser();

        $vehicle = Vehicle::factory()->create([
            'name' => 'Toyota Avanza Veloz 1.5 AT',
            'plate_number' => 'B 1234 ABC',
            'type' => 'car',
            'status' => Vehicle::STATUS_ACTIVE,
        ]);

        $response = $this->actingAs($admin)
            ->postJson(route('module.rental.rates.ai-generate'), [
                'text' => 'Tarif Harian Avanza Veloz 450rb lepas kunci deposit 500rb limit 200km kelebihan 2500/km. Sewa 3-6 hari diskon 10%, sewa 7+ hari diskon 20%, loyalty 5x order diskon 15%',
                'vehicles' => [
                    ['id' => $vehicle->id, 'name' => $vehicle->name, 'plate_number' => $vehicle->plate_number, 'type' => $vehicle->type],
                ],
                'rentalClasses' => [
                    ['value' => 'mpv', 'label' => 'MPV'],
                ],
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.period_type', 'daily')
            ->assertJsonPath('data.rate_per_period', 450000)
            ->assertJsonPath('data.deposit_amount', 500000)
            ->assertJsonPath('data.km_limit_per_period', 200)
            ->assertJsonPath('data.vehicle_id', (string) $vehicle->id);

        $tiers = $response->json('data.tiers');
        $this->assertIsArray($tiers);
        $this->assertNotEmpty($tiers);
    }

    public function test_heuristic_parser_accurately_detects_rates_and_tiers(): void
    {
        $service = new GeminiRentalRateAiGeneratorService(apiKey: '');

        $vehicles = [
            ['id' => 10, 'name' => 'Toyota Avanza Veloz', 'plate_number' => 'B 1234 ABC', 'type' => 'car'],
            ['id' => 20, 'name' => 'Mitsubishi Canter Box', 'plate_number' => 'B 9999 XYZ', 'type' => 'truck'],
        ];
        $classes = [
            ['value' => 'mpv', 'label' => 'MPV'],
            ['value' => 'suv', 'label' => 'SUV'],
        ];

        // 1. Daily rate with vehicle match and volume tiers
        $resultDaily = $service->generateFromText(
            'Tarif Harian Avanza Veloz 450rb limit 200km deposit 500rb, sewa 3-6 hari diskon 10%, sewa 7+ hari diskon 20%',
            $vehicles,
            $classes
        );

        $this->assertSame('daily', $resultDaily['period_type']);
        $this->assertEquals(450000, $resultDaily['rate_per_period']);
        $this->assertEquals(500000, $resultDaily['deposit_amount']);
        $this->assertSame(200, $resultDaily['km_limit_per_period']);
        $this->assertSame('10', $resultDaily['vehicle_id']);
        $this->assertCount(2, $resultDaily['tiers']);
        $this->assertSame('period_volume', $resultDaily['tiers'][0]['tier_type']);
        $this->assertSame(3, $resultDaily['tiers'][0]['min_threshold']);
        $this->assertSame(6, $resultDaily['tiers'][0]['max_threshold']);
        $this->assertEquals(10, $resultDaily['tiers'][0]['modifier_value']);

        // 2. Monthly truck rate
        $resultMonthly = $service->generateFromText(
            'Paket Bulanan Truk Canter Box 12jt deposit 3jt denda telat 100rb',
            $vehicles,
            $classes
        );

        $this->assertSame('monthly', $resultMonthly['period_type']);
        $this->assertEquals(12000000, $resultMonthly['rate_per_period']);
        $this->assertEquals(3000000, $resultMonthly['deposit_amount']);
        $this->assertEquals(100000, $resultMonthly['late_fee_per_day']);
        $this->assertSame('20', $resultMonthly['vehicle_id']);

        // 3. Class SUV Weekly Rate with loyalty discount
        $resultWeekly = $service->generateFromText(
            'Tarif Mingguan Kelas SUV 2.5jt deposit 1jt limit 1500km, loyalty repeat order 5 kali diskon 15%',
            $vehicles,
            $classes
        );

        $this->assertSame('weekly', $resultWeekly['period_type']);
        $this->assertEquals(2500000, $resultWeekly['rate_per_period']);
        $this->assertSame('suv', $resultWeekly['rental_class']);
        $this->assertCount(1, $resultWeekly['tiers']);
        $this->assertSame('loyalty_count', $resultWeekly['tiers'][0]['tier_type']);
        $this->assertSame(5, $resultWeekly['tiers'][0]['min_threshold']);
        $this->assertEquals(15, $resultWeekly['tiers'][0]['modifier_value']);
    }

    public function test_service_interface_can_be_mocked(): void
    {
        $admin = $this->createAdminUser();

        $this->mock(RentalRateAiGeneratorServiceInterface::class, function (MockInterface $mock): void {
            $mock->shouldReceive('generateFromText')
                ->once()
                ->andReturn([
                    'name' => 'Mocked Special Rate',
                    'period_type' => 'daily',
                    'rate_per_period' => 550000,
                    'deposit_amount' => 500000,
                    'km_limit_per_period' => 300,
                    'excess_km_rate' => 2000,
                    'late_fee_per_day' => 50000,
                    'priority' => 1,
                    'vehicle_id' => '',
                    'rental_class' => 'mpv',
                    'is_active' => true,
                    'tiers' => [],
                    'explanation' => 'Mocked AI extraction output.',
                ]);
        });

        $response = $this->actingAs($admin)
            ->postJson(route('module.rental.rates.ai-generate'), [
                'text' => 'Tarif khusus apapun',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Mocked Special Rate')
            ->assertJsonPath('data.rate_per_period', 550000);
    }
}
