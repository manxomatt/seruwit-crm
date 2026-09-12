<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class GeocodeForwardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_forward_geocode(): void
    {
        $this->getJson(route('module.geocode.forward', [
            'q' => 'Bandar Lampung',
        ]))->assertUnauthorized();
    }

    public function test_admin_can_forward_geocode_an_address_via_nominatim(): void
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

        $this->actingAs($this->createAdminUser())
            ->getJson(route('module.geocode.forward', [
                'q' => 'Jl Sultan Agung Way Halim',
            ]))
            ->assertOk()
            ->assertJson([
                'address' => 'Jalan Sultan Agung, Way Halim, Bandar Lampung, Lampung, Indonesia',
                'latitude' => -5.3857,
                'longitude' => 105.2755,
                'city' => 'Bandar Lampung',
                'province' => 'Lampung',
                'zip' => '35131',
            ]);
    }

    public function test_forward_geocode_falls_back_to_indonesia_geo_data_when_nominatim_fails(): void
    {
        Http::fake([
            'nominatim.openstreetmap.org/search*' => Http::response([], 500),
        ]);

        $this->actingAs($this->createAdminUser())
            ->getJson(route('module.geocode.forward', [
                'q' => 'Way Halim, Bandar Lampung',
            ]))
            ->assertOk()
            ->assertJson([
                'city' => 'Bandar Lampung',
                'province' => 'Lampung',
                'latitude' => -5.3857,
                'longitude' => 105.2755,
            ]);
    }

    public function test_forward_geocode_validates_query(): void
    {
        $this->actingAs($this->createAdminUser())
            ->getJson(route('module.geocode.forward', [
                'q' => '',
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('q');
    }
}
