<?php

namespace Tests\Feature\Modules\Fleet;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Modules\Fleet\AI\Contracts\VehicleAiGeneratorServiceInterface;
use Modules\Fleet\AI\Services\GeminiVehicleAiGeneratorService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class VehicleAiGenerateTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_vehicle_ai_generate_endpoint(): void
    {
        $this->postJson(route('module.fleet.vehicles.ai-generate'), [
            'text' => 'Toyota Avanza 2023 B 1234 ABC',
        ])->assertUnauthorized();
    }

    public function test_validation_fails_on_empty_text(): void
    {
        $admin = $this->createAdminUser();

        $this->actingAs($admin)
            ->postJson(route('module.fleet.vehicles.ai-generate'), [
                'text' => '',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['text']);
    }

    public function test_ai_generate_returns_successful_data_structure(): void
    {
        $admin = $this->createAdminUser();

        $response = $this->actingAs($admin)
            ->postJson(route('module.fleet.vehicles.ai-generate'), [
                'text' => 'Toyota Innova Reborn 2.4 G Diesel MT 2022 Hitam Metalik, plat B 1882 KZZ, 7 seat, tangki 55L, km 42000, pool Cakung',
                'bases' => [
                    ['id' => 1, 'name' => 'Pool Cakung Jakarta', 'code' => 'JKT-CKG'],
                ],
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.plate_number', 'B 1882 KZZ')
            ->assertJsonPath('data.brand', 'Toyota')
            ->assertJsonPath('data.fuel_type', 'diesel')
            ->assertJsonPath('data.model_year', 2022)
            ->assertJsonPath('data.capacity_seats', 7)
            ->assertJsonPath('data.home_base_id', '1');
    }

    public function test_heuristic_parser_accurately_detects_various_vehicle_types(): void
    {
        $service = new GeminiVehicleAiGeneratorService(apiKey: '');

        // 1. MPV / Car
        $resultAvanza = $service->parseHeuristically('Avanza 1.5 G MT 2023 Putih, plat D 1234 ABC, 7 kursi, odometer 15000 km');
        $this->assertSame('Toyota', $resultAvanza['brand']);
        $this->assertSame('D 1234 ABC', $resultAvanza['plate_number']);
        $this->assertSame('car', $resultAvanza['type']);
        $this->assertSame('mpv', $resultAvanza['rental_class']);
        $this->assertSame(2023, $resultAvanza['model_year']);
        $this->assertSame('Putih', $resultAvanza['color']);
        $this->assertSame(7, $resultAvanza['capacity_seats']);
        $this->assertSame(15000, $resultAvanza['odometer_km']);
        $this->assertSame('petrol', $resultAvanza['fuel_type']);

        // 2. Commercial Truck
        $resultTruck = $service->parseHeuristically('Mitsubishi Canter FE 74 HD Truk Box Kuning 2021, plat B 9012 XYZ, muatan 5000 kg, solar, tangki 100L');
        $this->assertSame('Mitsubishi', $resultTruck['brand']);
        $this->assertSame('B 9012 XYZ', $resultTruck['plate_number']);
        $this->assertSame('truck', $resultTruck['type']);
        $this->assertSame('truck', $resultTruck['rental_class']);
        $this->assertSame('diesel', $resultTruck['fuel_type']);
        $this->assertEquals(5000, $resultTruck['capacity_kg']);
        $this->assertEquals(100, $resultTruck['tank_capacity_liters']);

        // 3. Van / Minibus
        $resultVan = $service->parseHeuristically('Toyota HiAce Premio 2024 Silver Luxury VIP 10 Kursi, plat B 7777 VIP, diesel');
        $this->assertSame('Toyota', $resultVan['brand']);
        $this->assertSame('van', $resultVan['type']);
        $this->assertSame('van', $resultVan['rental_class']);
        $this->assertSame('diesel', $resultVan['fuel_type']);
        $this->assertSame(10, $resultVan['capacity_seats']);

        // 4. Electric Car
        $resultEv = $service->parseHeuristically('Hyundai Ioniq 5 EV 2023 Hitam Metalik, plat B 8888 EV, listrik, km 5000');
        $this->assertSame('Hyundai', $resultEv['brand']);
        $this->assertSame('electric', $resultEv['fuel_type']);
        $this->assertSame(5000, $resultEv['odometer_km']);
    }

    public function test_mocked_gemini_service_integration(): void
    {
        $admin = $this->createAdminUser();

        $this->mock(VehicleAiGeneratorServiceInterface::class, function (MockInterface $mock): void {
            $mock->shouldReceive('generateFromText')
                ->once()
                ->andReturn([
                    'name' => 'Toyota Alphard 2.5 G AT',
                    'brand' => 'Toyota',
                    'plate_number' => 'B 1 VIP',
                    'type' => 'car',
                    'rental_class' => 'premium',
                    'model_year' => 2024,
                    'color' => 'Hitam Metalik',
                    'capacity_seats' => 7,
                    'fuel_type' => 'petrol',
                    'odometer_km' => 1200,
                    'status' => 'active',
                ]);
        });

        $response = $this->actingAs($admin)
            ->postJson(route('module.fleet.vehicles.ai-generate'), [
                'text' => 'Alphard baru 2024',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Toyota Alphard 2.5 G AT')
            ->assertJsonPath('data.rental_class', 'premium');
    }
}
