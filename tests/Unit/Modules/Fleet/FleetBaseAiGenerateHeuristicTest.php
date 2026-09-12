<?php

namespace Tests\Unit\Modules\Fleet;

use Modules\Fleet\AI\Services\GeminiFleetBaseAiGeneratorService;
use Tests\TestCase;

class FleetBaseAiGenerateHeuristicTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_heuristic_parser_resolves_bandar_lampung_and_way_halim_correctly(): void
    {
        $service = new GeminiFleetBaseAiGeneratorService(apiKey: '');

        $input = 'Depot Utama, Bandar Lampung, Jl Sultan Agung Way halim 35131 open 8 jam code BDL-001';
        $result = $service->parseHeuristically($input);

        $this->assertSame('BDL-001', $result['code']);
        $this->assertSame('Depot Utama Bandar Lampung', $result['name']);
        $this->assertSame('depot', $result['kind']);
        $this->assertSame('active', $result['status']);
        $this->assertSame('Bandar Lampung', $result['city']);
        $this->assertSame('Lampung', $result['province']);
        $this->assertSame('35131', $result['zip']);
        $this->assertSame('Jl. Sultan Agung Way Halim', $result['address']);
        $this->assertSame('-5.3857', $result['latitude']);
        $this->assertSame('105.2755', $result['longitude']);
        $this->assertSame('08:00', $result['opens_at']);
        $this->assertSame('16:00', $result['closes_at']);
        $this->assertSame('Asia/Jakarta', $result['timezone']);
        $this->assertFalse($result['allows_overnight']);
    }

    public function test_heuristic_parser_detects_existing_kinds_and_locations(): void
    {
        $service = new GeminiFleetBaseAiGeneratorService(apiKey: '');

        // 1. Depot Utama Cakung
        $resultDepot = $service->parseHeuristically('Depot Utama Cakung kode JKT-CKG-01, Jl. Raya Bekasi KM 24 Jakarta Timur 13910, kapasitas 50 armada, buka 24 jam overnight, radius 35 km');
        $this->assertSame('depot', $resultDepot['kind']);
        $this->assertSame('JKT-CKG-01', $resultDepot['code']);
        $this->assertSame('Jakarta Timur', $resultDepot['city']);
        $this->assertSame('DKI Jakarta', $resultDepot['province']);
        $this->assertSame('13910', $resultDepot['zip']);
        $this->assertSame(50, $resultDepot['vehicle_capacity']);
        $this->assertTrue($resultDepot['allows_overnight']);
        $this->assertEquals(35, $resultDepot['service_radius_km']);
        $this->assertSame('-6.2250', $resultDepot['latitude']);
        $this->assertSame('106.9004', $resultDepot['longitude']);

        // 2. Workshop Cikarang
        $resultWorkshop = $service->parseHeuristically('Workshop Maintenance Cikarang, Kawasan Industri Jababeka Blok C2 Bekasi Jawa Barat 17530, perbaikan truk & servis, kapasitas 15 unit, buka jam 08.00 - 17.00 WIB');
        $this->assertSame('workshop_base', $resultWorkshop['kind']);
        $this->assertSame('Cikarang', $resultWorkshop['city']);
        $this->assertSame('Jawa Barat', $resultWorkshop['province']);
        $this->assertSame(15, $resultWorkshop['vehicle_capacity']);
        $this->assertSame('08:00', $resultWorkshop['opens_at']);
        $this->assertSame('17:00', $resultWorkshop['closes_at']);

        // 3. Pool Satelit Tangerang
        $resultSatellite = $service->parseHeuristically('Pool Satelit Bandara Soetta T2, Jl. Perimeter Selatan Bandara Tangerang Banten, kapasitas 20 mobil, radius 15 km');
        $this->assertSame('satellite', $resultSatellite['kind']);
        $this->assertSame('Tangerang', $resultSatellite['city']);
        $this->assertSame('Banten', $resultSatellite['province']);
        $this->assertSame(20, $resultSatellite['vehicle_capacity']);
        $this->assertEquals(15, $resultSatellite['service_radius_km']);
    }
}
