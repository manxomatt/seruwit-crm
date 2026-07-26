<?php

namespace Tests\Feature\Modules\Transportation;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class DirectionsProxyTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_directions_proxy_returns_road_coordinates(): void
    {
        Http::fake([
            'router.project-osrm.org/*' => Http::response([
                'code' => 'Ok',
                'routes' => [[
                    'geometry' => [
                        'coordinates' => [
                            [106.8456, -6.2088],
                            [106.8400, -6.2200],
                            [106.8205, -6.2910],
                        ],
                    ],
                ]],
            ], 200),
        ]);

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->getJson(route('module.transportation.directions', [
                'points' => '-6.2088,106.8456|-6.2910,106.8205',
            ]))
            ->assertOk()
            ->assertJsonPath('following_roads', true)
            ->assertJsonCount(3, 'coordinates')
            ->assertJsonPath('coordinates.0.0', -6.2088)
            ->assertJsonPath('coordinates.0.1', 106.8456);
    }

    public function test_directions_proxy_requires_authentication(): void
    {
        $this->getJson(route('module.transportation.directions', [
            'points' => '-6.2088,106.8456|-6.2910,106.8205',
        ]))->assertUnauthorized();
    }

    public function test_directions_proxy_rejects_single_point(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->getJson(route('module.transportation.directions', [
                'points' => '-6.2088,106.8456',
            ]))
            ->assertStatus(422);
    }
}
