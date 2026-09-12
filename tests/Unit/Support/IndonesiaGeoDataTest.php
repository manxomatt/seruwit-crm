<?php

namespace Tests\Unit\Support;

use App\Support\IndonesiaGeoData;
use PHPUnit\Framework\TestCase;

class IndonesiaGeoDataTest extends TestCase
{
    public function test_it_finds_bandar_lampung_and_way_halim_locations(): void
    {
        $wayHalim = IndonesiaGeoData::findLocation('Depot Jl Sultan Agung Way Halim');
        $this->assertNotNull($wayHalim);
        $this->assertSame('Bandar Lampung', $wayHalim['city']);
        $this->assertSame('Lampung', $wayHalim['province']);
        $this->assertSame('-5.3857', $wayHalim['lat']);
        $this->assertSame('105.2755', $wayHalim['lng']);

        $bandarLampung = IndonesiaGeoData::findLocation('Pool Bandar Lampung Pusat');
        $this->assertNotNull($bandarLampung);
        $this->assertSame('Bandar Lampung', $bandarLampung['city']);
        $this->assertSame('Lampung', $bandarLampung['province']);
    }

    public function test_it_finds_location_by_postal_code(): void
    {
        $lampungPostal = IndonesiaGeoData::findByPostalCode('35131');
        $this->assertNotNull($lampungPostal);
        $this->assertSame('Bandar Lampung', $lampungPostal['city']);
        $this->assertSame('Lampung', $lampungPostal['province']);

        $jakartaPostal = IndonesiaGeoData::findByPostalCode('13910');
        $this->assertNotNull($jakartaPostal);
        $this->assertSame('Jakarta Timur', $jakartaPostal['city']);
    }

    public function test_it_returns_null_for_unknown_location_and_postal_code(): void
    {
        $this->assertNull(IndonesiaGeoData::findLocation('Unknown XYZ non-existent place'));
        $this->assertNull(IndonesiaGeoData::findByPostalCode('00000'));
    }
}
