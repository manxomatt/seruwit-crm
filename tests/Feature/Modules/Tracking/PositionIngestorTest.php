<?php

namespace Tests\Feature\Modules\Tracking;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Events\VehiclePositionsRecorded;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\GpsSource;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Models\VehiclePosition;
use Modules\Tracking\Services\PositionIngestor;
use Tests\TestCase;

/**
 * The ingestion rules themselves. The per-tenant loop that drives this lives in
 * TrackingPollCommandTest, which needs real tenant schemas.
 */
class PositionIngestorTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        TrackingConfig::factory()->create();
    }

    /**
     * Fakes the two-step path the client really uses: /devices?all=true to
     * learn each device's positionId, then /positions?id=… for the fixes. The
     * device list is derived from the positions so tests keep passing plain
     * position rows.
     *
     * @param  array<int, array<string, mixed>>  $positions
     */
    private function fakeTraccar(array $positions): void
    {
        Http::fake([
            'gps.example.test/api/devices*' => Http::response($this->devicesFor($positions)),
            'gps.example.test/api/positions*' => Http::response($positions),
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $positions
     * @return array<int, array<string, mixed>>
     */
    private function devicesFor(array $positions): array
    {
        return collect($positions)
            ->pluck('deviceId')
            ->unique()
            ->values()
            ->map(fn (int $id, int $i) => [
                'id' => $id,
                'uniqueId' => (string) $id,
                'name' => 'Device '.$id,
                'positionId' => 1000 + $i,
            ])
            ->all();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function position(int $deviceId, float $lat, float $lng, array $overrides = []): array
    {
        return array_replace([
            'deviceId' => $deviceId,
            'latitude' => $lat,
            'longitude' => $lng,
            'speed' => 20,
            'course' => 90,
            'valid' => true,
            'fixTime' => now()->toIso8601String(),
            'serverTime' => now()->toIso8601String(),
            'attributes' => [],
        ], $overrides);
    }

    private function ingest(?GpsSource $source = null): int
    {
        $source ??= GpsSource::factory()->create(['base_url' => 'https://gps.example.test']);

        return PositionIngestor::for($source)->ingest();
    }

    public function test_it_stores_positions_and_refreshes_the_device(): void
    {
        $source = GpsSource::factory()->create(['base_url' => 'https://gps.example.test']);
        $device = GpsDevice::factory()->forSource($source)->create(['external_device_id' => 7]);
        $this->fakeTraccar([$this->position(7, -6.2, 106.8)]);

        $this->assertSame(1, $this->ingest($source));
        $this->assertSame(1, VehiclePosition::count());

        $device->refresh();
        $this->assertSame('-6.2000000', $device->last_latitude);
        $this->assertNotNull($device->last_recorded_at);
        // 20 knots is 37.04 km/h.
        $this->assertSame('37.04', $device->last_speed_kph);
    }

    public function test_replaying_the_same_response_stores_nothing_twice(): void
    {
        $source = GpsSource::factory()->create(['base_url' => 'https://gps.example.test']);
        GpsDevice::factory()->forSource($source)->create(['external_device_id' => 7]);
        $this->fakeTraccar([$this->position(7, -6.2, 106.8)]);

        $this->ingest($source);
        $this->ingest($source);

        $this->assertSame(1, VehiclePosition::count());
    }

    public function test_it_rolls_the_vehicle_odometer_from_traccars_own_distance_counter(): void
    {
        $source = GpsSource::factory()->create(['base_url' => 'https://gps.example.test']);
        $vehicle = Vehicle::factory()->create(['odometer_km' => 1000]);
        $device = GpsDevice::factory()->forSource($source)->pairedTo($vehicle)->create([
            'external_device_id' => 7,
            'provider_total_distance_m' => 500_000,
        ]);

        $this->fakeTraccar([$this->position(7, -6.2, 106.8, [
            'attributes' => ['totalDistance' => 505_000],
        ])]);

        $this->ingest($source);

        $this->assertSame(5000, $device->fresh()->accumulated_distance_m);
        $this->assertSame(1005, $vehicle->fresh()->odometer_km);
    }

    /**
     * The trap: vehicles.odometer_km is whole kilometres, so incrementing it by
     * each poll's sub-kilometre delta would floor to zero and never move.
     */
    public function test_sub_kilometre_movements_accumulate_until_they_roll_a_kilometre(): void
    {
        $source = GpsSource::factory()->create(['base_url' => 'https://gps.example.test']);
        $vehicle = Vehicle::factory()->create(['odometer_km' => 1000]);
        $device = GpsDevice::factory()->forSource($source)->pairedTo($vehicle)->create([
            'external_device_id' => 7,
            'provider_total_distance_m' => 0,
        ]);

        // A sequence rather than repeated fake() calls: Http::fake() merges its
        // stubs, so re-faking the same URL would keep replaying the first one.
        $sequence = Http::sequence();

        foreach ([400, 800, 1200] as $index => $total) {
            $sequence->push([$this->position(7, -6.2, 106.8, [
                'fixTime' => now()->addMinutes($index + 1)->toIso8601String(),
                'attributes' => ['totalDistance' => $total],
            ])]);
        }

        Http::fake([
            'gps.example.test/api/devices*' => Http::response([
                ['id' => 7, 'uniqueId' => '7', 'name' => 'Device 7', 'positionId' => 1000],
            ]),
            'gps.example.test/api/positions*' => $sequence,
        ]);

        for ($poll = 0; $poll < 3; $poll++) {
            $this->ingest($source);
        }

        $this->assertSame(1200, $device->fresh()->accumulated_distance_m);
        // 1.2 km travelled: the odometer moved exactly one whole kilometre.
        $this->assertSame(1001, $vehicle->fresh()->odometer_km);
    }

    public function test_it_falls_back_to_haversine_when_traccar_reports_no_distance(): void
    {
        $source = GpsSource::factory()->create(['base_url' => 'https://gps.example.test']);
        $vehicle = Vehicle::factory()->create(['odometer_km' => 0]);
        $device = GpsDevice::factory()->forSource($source)->pairedTo($vehicle)->at(-6.2, 106.8)->create([
            'external_device_id' => 7,
        ]);

        // ~1.1 km east.
        $this->fakeTraccar([$this->position(7, -6.2, 106.81, [
            'fixTime' => now()->addMinute()->toIso8601String(),
        ])]);

        $this->ingest($source);

        $this->assertEqualsWithDelta(1105, $device->fresh()->accumulated_distance_m, 60);
        $this->assertSame(1, $vehicle->fresh()->odometer_km);
    }

    public function test_a_device_reset_does_not_produce_a_negative_distance(): void
    {
        $source = GpsSource::factory()->create(['base_url' => 'https://gps.example.test']);
        $device = GpsDevice::factory()->forSource($source)->at(-6.2, 106.8)->create([
            'external_device_id' => 7,
            'provider_total_distance_m' => 900_000,
        ]);

        // Counter reset to near zero while the vehicle barely moved.
        $this->fakeTraccar([$this->position(7, -6.2, 106.8, [
            'fixTime' => now()->addMinute()->toIso8601String(),
            'attributes' => ['totalDistance' => 10],
        ])]);

        $this->ingest($source);

        $this->assertSame(0, $device->fresh()->accumulated_distance_m);
    }

    public function test_an_implausible_jump_is_discarded(): void
    {
        $source = GpsSource::factory()->create(['base_url' => 'https://gps.example.test']);
        $device = GpsDevice::factory()->forSource($source)->at(-6.2, 106.8)->create([
            'external_device_id' => 7,
            'provider_total_distance_m' => 0,
        ]);

        $this->fakeTraccar([$this->position(7, -6.2, 106.8, [
            'fixTime' => now()->addMinute()->toIso8601String(),
            'attributes' => ['totalDistance' => 900_000],
        ])]);

        $this->ingest($source);

        $this->assertSame(0, $device->fresh()->accumulated_distance_m);
    }

    public function test_drift_while_parked_does_not_move_the_odometer(): void
    {
        $source = GpsSource::factory()->create(['base_url' => 'https://gps.example.test']);
        $device = GpsDevice::factory()->forSource($source)->at(-6.2, 106.8)->create([
            'external_device_id' => 7,
            'provider_total_distance_m' => 1000,
        ]);

        // 5 m of jitter, below the minimum delta.
        $this->fakeTraccar([$this->position(7, -6.2, 106.8, [
            'fixTime' => now()->addMinute()->toIso8601String(),
            'attributes' => ['totalDistance' => 1005],
        ])]);

        $this->ingest($source);

        $this->assertSame(0, $device->fresh()->accumulated_distance_m);
    }

    public function test_an_unpaired_device_is_ingested_without_touching_any_vehicle(): void
    {
        $source = GpsSource::factory()->create(['base_url' => 'https://gps.example.test']);
        $vehicle = Vehicle::factory()->create(['odometer_km' => 500]);
        GpsDevice::factory()->forSource($source)->create(['external_device_id' => 7, 'vehicle_id' => null]);

        $this->fakeTraccar([$this->position(7, -6.2, 106.8, [
            'attributes' => ['totalDistance' => 50_000],
        ])]);

        $this->ingest($source);

        $this->assertSame(1, VehiclePosition::count());
        $this->assertNull(VehiclePosition::first()->vehicle_id);
        $this->assertSame(500, $vehicle->fresh()->odometer_km);
    }

    public function test_an_unknown_device_id_is_ignored(): void
    {
        $source = GpsSource::factory()->create(['base_url' => 'https://gps.example.test']);
        GpsDevice::factory()->forSource($source)->create(['external_device_id' => 7]);

        $this->fakeTraccar([$this->position(999, -6.2, 106.8)]);

        $this->assertSame(0, $this->ingest($source));
        $this->assertSame(0, VehiclePosition::count());
    }

    public function test_it_announces_what_landed_for_other_modules(): void
    {
        Event::fake([VehiclePositionsRecorded::class]);

        $source = GpsSource::factory()->create(['base_url' => 'https://gps.example.test']);
        $vehicle = Vehicle::factory()->create();
        GpsDevice::factory()->forSource($source)->pairedTo($vehicle)->create(['external_device_id' => 7]);
        $this->fakeTraccar([$this->position(7, -6.2, 106.8)]);

        $this->ingest($source);

        Event::assertDispatched(
            VehiclePositionsRecorded::class,
            fn (VehiclePositionsRecorded $event) => array_keys($event->byVehicle()) === [$vehicle->id]
                && $event->geofenceRadiusM === 200,
        );
    }

    public function test_nothing_is_announced_when_no_new_fix_arrived(): void
    {
        Event::fake([VehiclePositionsRecorded::class]);

        $source = GpsSource::factory()->create(['base_url' => 'https://gps.example.test']);
        GpsDevice::factory()->forSource($source)->create([
            'external_device_id' => 7,
            'last_recorded_at' => now()->addHour(),
        ]);
        $this->fakeTraccar([$this->position(7, -6.2, 106.8)]);

        $this->assertSame(0, $this->ingest($source));

        Event::assertNotDispatched(VehiclePositionsRecorded::class);
    }

    public function test_it_ingests_sky_track_live_positions_by_imei(): void
    {
        $imei = '358735072143802';
        $source = GpsSource::factory()->skyTrack()->create();
        $device = GpsDevice::factory()->forSource($source)->create([
            'external_device_id' => (int) $imei,
            'unique_id' => $imei,
        ]);

        Http::fake([
            'api.sky-track.example.test/api/tracking/objects' => Http::response([[
                'imei' => $imei,
                'status' => 'm',
                'data' => [
                    'dt_server' => now()->toDateTimeString(),
                    'dt_tracker' => now()->toDateTimeString(),
                    'lat' => -7.036783,
                    'lng' => 107.396587,
                    'altitude' => 0,
                    'angle' => 176,
                    'speed' => 42,
                    'params' => [
                        'acc' => 1,
                        'motion' => true,
                        'totalDistance' => 2113841.13,
                    ],
                ],
            ]]),
        ]);

        $this->assertSame(1, PositionIngestor::for($source)->ingest());
        $this->assertSame(1, VehiclePosition::count());

        $device->refresh();
        $this->assertSame('-7.0367830', $device->last_latitude);
        $this->assertSame('42.00', $device->last_speed_kph);
        $this->assertSame(2113841, $device->provider_total_distance_m);
    }

    public function test_it_ingests_gps_server_live_positions_by_imei(): void
    {
        $imei = '352503097417775';
        $source = GpsSource::factory()->gpsServer()->create();
        $device = GpsDevice::factory()->forSource($source)->create([
            'external_device_id' => (int) $imei,
            'unique_id' => $imei,
        ]);

        Http::fake([
            'gsi-tracking.example.test/api/api.php*' => Http::response([[
                'imei' => $imei,
                'active' => 'true',
                'dt_server' => now()->utc()->format('Y-m-d H:i:s'),
                'dt_tracker' => now()->utc()->format('Y-m-d H:i:s'),
                'lat' => '-7.806912',
                'lng' => '110.413102',
                'altitude' => '0',
                'angle' => '103',
                'speed' => '11',
                'params' => [
                    'acc' => '1',
                    'track' => '1',
                ],
                'odometer' => '29549.893497999794',
            ]]),
        ]);

        $this->assertSame(1, PositionIngestor::for($source)->ingest());
        $this->assertSame(1, VehiclePosition::count());

        $device->refresh();
        $this->assertSame('-7.8069120', $device->last_latitude);
        $this->assertSame('11.00', $device->last_speed_kph);
        $this->assertSame(29549893, $device->provider_total_distance_m);
    }
}
