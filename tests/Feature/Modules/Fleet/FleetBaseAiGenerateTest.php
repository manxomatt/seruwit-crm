<?php

namespace Tests\Feature\Modules\Fleet;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Modules\Fleet\AI\Contracts\FleetBaseAiGeneratorServiceInterface;
use Modules\Fleet\AI\Services\GeminiFleetBaseAiGeneratorService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class FleetBaseAiGenerateTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_fleet_base_ai_generate_endpoint(): void
    {
        $this->postJson(route('module.fleet.bases.ai-generate'), [
            'text' => 'Depot Utama Cakung JKT-CKG-01',
        ])->assertUnauthorized();
    }

    public function test_validation_fails_on_empty_text(): void
    {
        $admin = $this->createAdminUser();

        $this->actingAs($admin)
            ->postJson(route('module.fleet.bases.ai-generate'), [
                'text' => '',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['text']);
    }

    public function test_ai_generate_returns_successful_fleet_base_data_structure(): void
    {
        $admin = $this->createAdminUser();

        $response = $this->actingAs($admin)
            ->postJson(route('module.fleet.bases.ai-generate'), [
                'text' => 'Depot Utama Cakung JKT-CKG-01, Jl. Raya Bekasi KM 24 Jakarta Timur 13910 DKI Jakarta, telp 021-4601234, email pool.cakung@seruwit.com, kapasitas 50 mobil, izin parkir inap 24 jam overnight, radius layanan 35 km, manajer Budi',
                'managers' => [
                    ['id' => 99, 'name' => 'Budi Santoso', 'email' => 'budi@seruwit.com'],
                ],
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'JKT-CKG-01')
            ->assertJsonPath('data.city', 'Jakarta Timur')
            ->assertJsonPath('data.province', 'DKI Jakarta')
            ->assertJsonPath('data.zip', '13910')
            ->assertJsonPath('data.kind', 'depot')
            ->assertJsonPath('data.vehicle_capacity', 50)
            ->assertJsonPath('data.allows_overnight', true)
            ->assertJsonPath('data.service_radius_km', 35)
            ->assertJsonPath('data.manager_id', '99');
    }

    public function test_heuristic_parser_accurately_detects_various_fleet_base_kinds(): void
    {
        $service = new GeminiFleetBaseAiGeneratorService(apiKey: '');

        // 1. Depot Utama
        $resultDepot = $service->parseHeuristically('Depot Utama Cakung kode JKT-CKG-01, Jl. Raya Bekasi KM 24 Jakarta Timur 13910, kapasitas 50 armada, buka 24 jam overnight, radius 35 km');
        $this->assertSame('depot', $resultDepot['kind']);
        $this->assertSame('JKT-CKG-01', $resultDepot['code']);
        $this->assertSame('Jakarta Timur', $resultDepot['city']);
        $this->assertSame('DKI Jakarta', $resultDepot['province']);
        $this->assertSame('13910', $resultDepot['zip']);
        $this->assertSame(50, $resultDepot['vehicle_capacity']);
        $this->assertTrue($resultDepot['allows_overnight']);
        $this->assertEquals(35, $resultDepot['service_radius_km']);

        // 2. Workshop / Bengkel
        $resultWorkshop = $service->parseHeuristically('Workshop Maintenance Cikarang, Kawasan Industri Jababeka Blok C2 Bekasi Jawa Barat 17530, perbaikan truk & servis, kapasitas 15 unit, buka jam 08.00 - 17.00 WIB');
        $this->assertSame('workshop_base', $resultWorkshop['kind']);
        $this->assertSame('Cikarang', $resultWorkshop['city']);
        $this->assertSame('Jawa Barat', $resultWorkshop['province']);
        $this->assertSame(15, $resultWorkshop['vehicle_capacity']);
        $this->assertSame('08:00', $resultWorkshop['opens_at']);
        $this->assertSame('17:00', $resultWorkshop['closes_at']);

        // 3. Cabang Satelit
        $resultSatellite = $service->parseHeuristically('Pool Satelit Bandara Soetta T2, Jl. Perimeter Selatan Bandara Tangerang Banten, kapasitas 20 mobil, radius 15 km');
        $this->assertSame('satellite', $resultSatellite['kind']);
        $this->assertSame('Tangerang', $resultSatellite['city']);
        $this->assertSame('Banten', $resultSatellite['province']);
        $this->assertSame(20, $resultSatellite['vehicle_capacity']);
        $this->assertEquals(15, $resultSatellite['service_radius_km']);

        // 4. Yard / Pool Parkir
        $resultYard = $service->parseHeuristically('Yard Pool Parkir Terbuka Surabaya, Jl. Rungkut Industri Surabaya Jawa Timur, kapasitas 100 mobil');
        $this->assertSame('yard', $resultYard['kind']);
        $this->assertSame('Surabaya', $resultYard['city']);
        $this->assertSame('Jawa Timur', $resultYard['province']);
        $this->assertSame(100, $resultYard['vehicle_capacity']);
    }

    public function test_mocked_gemini_base_service_integration(): void
    {
        $admin = $this->createAdminUser();

        $this->mock(FleetBaseAiGeneratorServiceInterface::class, function (MockInterface $mock): void {
            $mock->shouldReceive('generateFromText')
                ->once()
                ->andReturn([
                    'code' => 'BDG-PST-01',
                    'name' => 'Depot Pasteur Bandung',
                    'kind' => 'depot',
                    'status' => 'active',
                    'address' => 'Jl. Dr. Djunjunan No. 123',
                    'city' => 'Bandung',
                    'province' => 'Jawa Barat',
                    'zip' => '40161',
                    'latitude' => '-6.8923',
                    'longitude' => '107.5812',
                    'opens_at' => '08:00',
                    'closes_at' => '20:00',
                    'timezone' => 'Asia/Jakarta',
                    'vehicle_capacity' => 40,
                    'allows_overnight' => true,
                    'service_radius_km' => 30,
                    'manager_id' => '1',
                    'notes' => 'Akses mudah dekat gerbang tol Pasteur',
                ]);
        });

        $response = $this->actingAs($admin)
            ->postJson(route('module.fleet.bases.ai-generate'), [
                'text' => 'Depot Bandung Pasteur',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'BDG-PST-01')
            ->assertJsonPath('data.city', 'Bandung');
    }
}
