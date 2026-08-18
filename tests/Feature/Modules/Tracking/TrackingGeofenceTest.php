<?php

namespace Tests\Feature\Modules\Tracking;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Models\TrackingGeofence;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TrackingGeofenceTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_geofences_index_lists_zones(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->create();
        TrackingGeofence::query()->create([
            'name' => 'Jakarta',
            'latitude' => -6.2,
            'longitude' => 106.8,
            'radius_m' => 5000,
            'alert_on' => 'exit',
            'active_rentals_only' => true,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->get(route('module.tracking.geofences.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Tracking/Geofences/Index')
                ->has('geofences', 1)
                ->where('geofences.0.name', 'Jakarta'));
    }

    public function test_can_create_update_and_delete_geofence(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->create();

        $this->actingAs($user)
            ->post(route('module.tracking.geofences.store'), [
                'name' => 'Depok',
                'latitude' => -6.4,
                'longitude' => 106.8,
                'radius_m' => 1500,
                'alert_on' => 'both',
                'active_rentals_only' => true,
                'is_active' => true,
            ])
            ->assertRedirect();

        $geofence = TrackingGeofence::query()->first();
        $this->assertNotNull($geofence);
        $this->assertSame('Depok', $geofence->name);

        $this->actingAs($user)
            ->patch(route('module.tracking.geofences.update', $geofence), [
                'name' => 'Depok Selatan',
                'latitude' => -6.41,
                'longitude' => 106.81,
                'radius_m' => 2000,
                'alert_on' => 'exit',
                'active_rentals_only' => false,
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertSame('Depok Selatan', $geofence->fresh()->name);
        $this->assertFalse($geofence->fresh()->active_rentals_only);

        $this->actingAs($user)
            ->delete(route('module.tracking.geofences.destroy', $geofence))
            ->assertRedirect();

        $this->assertDatabaseMissing('tracking_geofences', ['id' => $geofence->id]);
    }

    public function test_can_create_and_update_polygon_geofence(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->create();

        $coords = [
            [-6.2000000, 106.8160000],
            [-6.2100000, 106.8200000],
            [-6.2150000, 106.8100000],
        ];

        $this->actingAs($user)
            ->post(route('module.tracking.geofences.store'), [
                'name' => 'Zona Khusus SCBD',
                'type' => 'polygon',
                'coordinates' => $coords,
                'alert_on' => 'exit',
                'active_rentals_only' => true,
                'is_active' => true,
            ])
            ->assertRedirect();

        $geofence = TrackingGeofence::query()->first();
        $this->assertNotNull($geofence);
        $this->assertSame('Zona Khusus SCBD', $geofence->name);
        $this->assertSame('polygon', $geofence->type);
        $this->assertCount(3, $geofence->coordinates);
        $this->assertNotNull($geofence->latitude);
        $this->assertNotNull($geofence->longitude);
        $this->assertNull($geofence->radius_m);
        $this->assertTrue($geofence->isPolygon());
    }

    public function test_polygon_geofence_requires_at_least_three_coordinates(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->create();

        $coords = [
            [-6.2000000, 106.8160000],
            [-6.2100000, 106.8200000],
        ];

        $this->actingAs($user)
            ->post(route('module.tracking.geofences.store'), [
                'name' => 'Invalid Zone',
                'type' => 'polygon',
                'coordinates' => $coords,
                'alert_on' => 'exit',
            ])
            ->assertSessionHasErrors('coordinates');
    }
}
