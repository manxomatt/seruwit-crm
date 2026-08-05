<?php

namespace Tests\Feature\Modules\Tracking;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Modules\Tracking\Events\VehiclePositionsRecorded;
use Modules\Tracking\Listeners\DetectTrackingAlerts;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\TrackingAlertState;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Models\TrackingGeofence;
use Modules\Tracking\Support\PositionPayload;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TrackingAlertTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_overspeed_notifies_tracking_viewers_once_per_cooldown(): void
    {
        Notification::fake();

        $admin = $this->createAdminUser();
        TrackingConfig::factory()->create([
            'alerts_enabled' => true,
            'alert_speed_kph' => 80,
            'alert_cooldown_minutes' => 30,
        ]);

        $vehicle = Vehicle::factory()->create();
        $device = GpsDevice::factory()->pairedTo($vehicle)->create(['external_device_id' => 11]);

        $event = new VehiclePositionsRecorded(
            positions: [$this->payload(11, -6.2, 106.8, 120)],
            vehicleIdsByExternalDeviceId: [11 => $vehicle->id],
            geofenceRadiusM: 200,
            checkpointMinDistanceM: 200,
            checkpointMinIntervalMinutes: 5,
        );

        (new DetectTrackingAlerts)->handle($event);
        (new DetectTrackingAlerts)->handle($event);

        Notification::assertSentToTimes($admin, \App\Notifications\GenericNotification::class, 1);
        $this->assertDatabaseHas('tracking_alert_states', [
            'alert_key' => 'overspeed:vehicle:'.$vehicle->id,
            'kind' => 'overspeed',
        ]);
        $this->assertNotNull($device->fresh());
    }

    public function test_geofence_exit_alerts_for_active_rental_vehicle(): void
    {
        Notification::fake();

        $admin = $this->createAdminUser();
        TrackingConfig::factory()->create([
            'alerts_enabled' => true,
            'alert_cooldown_minutes' => 30,
        ]);

        $vehicle = Vehicle::factory()->create();
        GpsDevice::factory()->pairedTo($vehicle)->create(['external_device_id' => 22]);
        Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'status' => Rental::STATUS_ACTIVE,
        ]);

        $geofence = TrackingGeofence::query()->create([
            'name' => 'Bandung',
            'latitude' => -6.9175,
            'longitude' => 107.6191,
            'radius_m' => 1000,
            'alert_on' => TrackingGeofence::ALERT_EXIT,
            'active_rentals_only' => true,
            'is_active' => true,
        ]);

        $listener = new DetectTrackingAlerts;

        // Seed "inside" state without notifying.
        $listener->handle(new VehiclePositionsRecorded(
            positions: [$this->payload(22, -6.9175, 107.6191, 0)],
            vehicleIdsByExternalDeviceId: [22 => $vehicle->id],
            geofenceRadiusM: 200,
            checkpointMinDistanceM: 200,
            checkpointMinIntervalMinutes: 5,
        ));

        Notification::assertNothingSent();

        $listener->handle(new VehiclePositionsRecorded(
            positions: [$this->payload(22, -6.2, 106.8, 40)],
            vehicleIdsByExternalDeviceId: [22 => $vehicle->id],
            geofenceRadiusM: 200,
            checkpointMinDistanceM: 200,
            checkpointMinIntervalMinutes: 5,
        ));

        Notification::assertSentTo($admin, \App\Notifications\GenericNotification::class);
        $this->assertTrue(
            TrackingAlertState::query()
                ->where('alert_key', 'geofence:'.$geofence->id.':vehicle:'.$vehicle->id)
                ->where('inside_geofence', false)
                ->exists()
        );
    }

    public function test_stale_devices_are_detected(): void
    {
        Notification::fake();

        $admin = $this->createAdminUser();
        TrackingConfig::factory()->create([
            'alerts_enabled' => true,
            'alert_stale_minutes' => 15,
            'alert_cooldown_minutes' => 30,
        ]);

        $vehicle = Vehicle::factory()->create();
        GpsDevice::factory()->pairedTo($vehicle)->create([
            'external_device_id' => 33,
            'last_recorded_at' => now()->subMinutes(45),
        ]);

        (new DetectTrackingAlerts)->handle(new VehiclePositionsRecorded(
            positions: [],
            vehicleIdsByExternalDeviceId: [],
            geofenceRadiusM: 200,
            checkpointMinDistanceM: 200,
            checkpointMinIntervalMinutes: 5,
        ));

        Notification::assertSentTo($admin, \App\Notifications\GenericNotification::class);
    }

    private function payload(int $deviceId, float $lat, float $lng, float $speedKph): PositionPayload
    {
        return new PositionPayload(
            externalDeviceId: $deviceId,
            latitude: $lat,
            longitude: $lng,
            speedKph: $speedKph,
            course: null,
            altitude: null,
            ignition: true,
            motion: $speedKph > 3,
            totalDistanceM: null,
            recordedAt: CarbonImmutable::now(),
            serverTime: CarbonImmutable::now(),
            attributes: null,
        );
    }
}
