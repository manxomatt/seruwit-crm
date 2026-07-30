<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class GeocodeReverseTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_reverse_geocode(): void
    {
        $this->getJson(route('module.geocode.reverse', [
            'lat' => -5.3971,
            'lng' => 105.2668,
        ]))->assertUnauthorized();
    }

    public function test_admin_can_reverse_geocode_a_point(): void
    {
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response([
                'display_name' => 'Jl. Raden Intan, Bandar Lampung, Indonesia',
            ], 200),
        ]);

        $this->actingAs($this->createAdminUser())
            ->getJson(route('module.geocode.reverse', [
                'lat' => -5.3971,
                'lng' => 105.2668,
            ]))
            ->assertOk()
            ->assertJson([
                'address' => 'Jl. Raden Intan, Bandar Lampung, Indonesia',
                'latitude' => -5.3971,
                'longitude' => 105.2668,
            ]);
    }

    public function test_reverse_geocode_validates_coordinates(): void
    {
        $this->actingAs($this->createAdminUser())
            ->getJson(route('module.geocode.reverse', [
                'lat' => 120,
                'lng' => 105.2668,
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('lat');
    }
}
