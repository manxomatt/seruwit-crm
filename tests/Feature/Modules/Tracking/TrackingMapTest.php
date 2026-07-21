<?php

namespace Tests\Feature\Modules\Tracking;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\TrackingConfig;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TrackingMapTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_the_map_shows_every_positioned_device_paired_or_not(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->create();

        // A freshly synced fleet: positions reported, none paired yet.
        GpsDevice::factory()->at(-6.2, 106.8)->create(['name' => 'Unpaired Tracker']);
        GpsDevice::factory()->pairedTo(Vehicle::factory()->create())->at(-6.3, 106.9)->create();
        // A device that has never reported is not on the map.
        GpsDevice::factory()->create(['last_latitude' => null, 'last_longitude' => null]);

        $this->actingAs($user)->get(route('module.tracking.map'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Tracking/Map')
                ->has('devices', 2)
            );
    }

    public function test_the_map_reports_the_last_poll_time(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->create(['last_polled_at' => now()]);

        $this->actingAs($user)->get(route('module.tracking.map'))
            ->assertInertia(fn ($page) => $page->whereNot('lastPolledAt', null));
    }
}
