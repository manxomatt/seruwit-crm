<?php

namespace Tests\Feature\Modules\Tracking;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Models\VehiclePosition;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TrackingHistoryTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_history_page_renders_empty_without_vehicle(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->create();

        $this->actingAs($user)
            ->get(route('module.tracking.history'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Tracking/History')
                ->where('trail', [])
                ->where('stats.points', 0));
    }

    public function test_history_returns_thinned_trail_and_distance(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->create();

        $vehicle = Vehicle::factory()->create();
        $device = GpsDevice::factory()->pairedTo($vehicle)->create();

        VehiclePosition::factory()->create([
            'gps_device_id' => $device->id,
            'vehicle_id' => $vehicle->id,
            'latitude' => -6.2000000,
            'longitude' => 106.8000000,
            'speed_kph' => 40,
            'total_distance_m' => 1000,
            'recorded_at' => now()->subHour(),
        ]);
        VehiclePosition::factory()->create([
            'gps_device_id' => $device->id,
            'vehicle_id' => $vehicle->id,
            'latitude' => -6.2100000,
            'longitude' => 106.8100000,
            'speed_kph' => 55,
            'total_distance_m' => 3500,
            'recorded_at' => now()->subMinutes(30),
        ]);

        $this->actingAs($user)
            ->get(route('module.tracking.history', [
                'vehicle_id' => $vehicle->id,
                'from' => now()->subHours(2)->toDateTimeString(),
                'to' => now()->toDateTimeString(),
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Tracking/History')
                ->has('trail', 2)
                ->where('stats.points', 2)
                ->where('stats.distance_km', 2.5)
                ->where('stats.max_speed_kph', 55));
    }
}
