<?php

namespace Tests\Unit\Support;

use App\Support\NominatimGeocoder;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NominatimGeocoderTest extends TestCase
{
    public function test_forward_geocodes_via_nominatim_when_available(): void
    {
        Http::fake([
            'nominatim.openstreetmap.org/search*' => Http::response([
                [
                    'lat' => '-5.3857',
                    'lon' => '105.2755',
                    'display_name' => 'Jalan Sultan Agung, Way Halim, Bandar Lampung, Lampung, Indonesia',
                    'address' => [
                        'city' => 'Bandar Lampung',
                        'state' => 'Lampung',
                        'postcode' => '35131',
                    ],
                ],
            ], 200),
        ]);

        $geocoder = new NominatimGeocoder;
        $result = $geocoder->forward('Jl Sultan Agung Way Halim');

        $this->assertNotNull($result);
        $this->assertSame('Jalan Sultan Agung, Way Halim, Bandar Lampung, Lampung, Indonesia', $result['address']);
        $this->assertSame(-5.3857, $result['latitude']);
        $this->assertSame(105.2755, $result['longitude']);
        $this->assertSame('Bandar Lampung', $result['city']);
        $this->assertSame('Lampung', $result['province']);
        $this->assertSame('35131', $result['zip']);
    }

    public function test_forward_geocodes_fallback_to_indonesia_geo_data_on_http_failure(): void
    {
        Http::fake([
            'nominatim.openstreetmap.org/search*' => Http::response([], 500),
        ]);

        $geocoder = new NominatimGeocoder;
        $result = $geocoder->forward('Jl Sultan Agung Way Halim Bandar Lampung');

        $this->assertNotNull($result);
        $this->assertSame('Bandar Lampung', $result['city']);
        $this->assertSame('Lampung', $result['province']);
        $this->assertSame(-5.3857, $result['latitude']);
        $this->assertSame(105.2755, $result['longitude']);
    }

    public function test_forward_returns_null_on_empty_query(): void
    {
        $geocoder = new NominatimGeocoder;
        $this->assertNull($geocoder->forward(''));
    }
}
