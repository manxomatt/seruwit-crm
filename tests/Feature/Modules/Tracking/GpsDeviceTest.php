<?php

namespace Tests\Feature\Modules\Tracking;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\TrackingConfig;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class GpsDeviceTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('module.tracking.devices.index'))->assertRedirect(route('login'));
    }

    public function test_the_device_list_renders(): void
    {
        $user = $this->createAdminUser();
        GpsDevice::factory()->count(2)->create();

        $this->actingAs($user)
            ->get(route('module.tracking.devices.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Tracking/Devices/Index')
                ->has('devices.data', 2)
                ->where('devices.total', 2)
                ->where('devices.per_page', 15)
                ->where('filters.search', null)
            );
    }

    public function test_the_device_list_paginates_results(): void
    {
        $user = $this->createAdminUser();
        GpsDevice::factory()->count(16)->create();

        $this->actingAs($user)
            ->get(route('module.tracking.devices.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('devices.data', 15)
                ->where('devices.total', 16)
                ->where('devices.current_page', 1)
                ->where('devices.last_page', 2)
            );

        $this->actingAs($user)
            ->get(route('module.tracking.devices.index', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('devices.data', 1)
                ->where('devices.current_page', 2)
            );
    }

    public function test_the_device_list_can_be_filtered_by_search(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create(['name' => 'Alpha Truck', 'plate_number' => 'B 1234 XYZ']);
        GpsDevice::factory()->create(['name' => 'Tracker Alpha', 'unique_id' => '860000000000111']);
        GpsDevice::factory()->pairedTo($vehicle)->create(['name' => 'Tracker Beta', 'unique_id' => '860000000000222']);
        GpsDevice::factory()->create(['name' => 'Other Unit', 'unique_id' => '860000000000333']);

        $this->actingAs($user)
            ->get(route('module.tracking.devices.index', ['search' => 'Alpha']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('devices.data', 2)
                ->where('devices.total', 2)
                ->where('filters.search', 'Alpha')
            );

        $this->actingAs($user)
            ->get(route('module.tracking.devices.index', ['search' => '000222']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('devices.data', 1)
                ->where('devices.data.0.unique_id', '860000000000222')
            );

        $this->actingAs($user)
            ->get(route('module.tracking.devices.index', ['search' => '1234 XYZ']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('devices.data', 1)
                ->where('devices.data.0.name', 'Tracker Beta')
            );

        $this->actingAs($user)
            ->get(route('module.tracking.devices.index', ['search' => 'alpha truck']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('devices.data', 1)
                ->where('devices.data.0.name', 'Tracker Beta')
                ->where('devices.data.0.vehicle.name', 'Alpha Truck')
            );
    }

    public function test_syncing_imports_devices_and_updates_existing_ones(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->create(['base_url' => 'https://gps.example.test']);
        $existing = GpsDevice::factory()->create(['traccar_device_id' => 1, 'name' => 'Old name']);

        Http::fake([
            'gps.example.test/api/devices*' => Http::response([
                ['id' => 1, 'uniqueId' => '860000000000001', 'name' => 'Truck A', 'status' => 'online'],
                ['id' => 2, 'uniqueId' => '860000000000002', 'name' => 'Truck B', 'status' => 'offline'],
            ]),
        ]);

        $this->actingAs($user)->post(route('module.tracking.devices.sync'))->assertSessionHas('success');

        $this->assertSame(2, GpsDevice::count());
        $this->assertSame('Truck A', $existing->fresh()->name);
    }

    public function test_syncing_without_credentials_is_refused(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->create(['base_url' => null, 'email' => null, 'password' => null]);

        $this->actingAs($user)->post(route('module.tracking.devices.sync'))->assertSessionHas('error');

        Http::assertNothingSent();
    }

    public function test_sky_track_sync_imports_objects_by_imei(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->skyTrack('sky-secret-key')->create();
        $existing = GpsDevice::factory()->create([
            'traccar_device_id' => 358735072143802,
            'unique_id' => '358735072143802',
            'name' => 'Old name',
            'status' => 'offline',
        ]);

        Http::fake([
            'api.sky-track.example.test/api/objects' => Http::response([
                [
                    'imei' => '358735072143802',
                    'name' => 'Vehicle 1 Test Update',
                    'active' => 'true',
                ],
                [
                    'imei' => '352503094515944',
                    'name' => 'Hiace D 7047 VE',
                    'active' => 'false',
                ],
            ]),
        ]);

        $this->actingAs($user)->post(route('module.tracking.devices.sync'))->assertSessionHas('success');

        $this->assertSame(2, GpsDevice::count());
        $this->assertSame('Vehicle 1 Test Update', $existing->fresh()->name);
        $this->assertSame('online', $existing->fresh()->status);

        $created = GpsDevice::query()->where('unique_id', '352503094515944')->first();
        $this->assertNotNull($created);
        $this->assertSame('Hiace D 7047 VE', $created->name);
        $this->assertSame('offline', $created->status);
        $this->assertSame(352503094515944, $created->traccar_device_id);
    }

    public function test_gps_server_sync_imports_objects_by_imei(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->gpsServer('gps-server-key')->create();
        $existing = GpsDevice::factory()->create([
            'traccar_device_id' => 352503094417117,
            'unique_id' => '352503094417117',
            'name' => 'Old name',
            'status' => 'offline',
        ]);

        Http::fake([
            'gsi-tracking.example.test/api/api.php*' => Http::response([
                [
                    'imei' => '352503094417117',
                    'name' => 'PUTIH',
                    'active' => 'false',
                    'lat' => '-7.988503',
                    'lng' => '110.255173',
                ],
                [
                    'imei' => '352503097417775',
                    'name' => 'ROCKY',
                    'active' => 'true',
                    'lat' => '-7.806912',
                    'lng' => '110.413102',
                ],
            ]),
        ]);

        $this->actingAs($user)->post(route('module.tracking.devices.sync'))->assertSessionHas('success');

        $this->assertSame(2, GpsDevice::count());
        $this->assertSame('PUTIH', $existing->fresh()->name);
        $this->assertSame('offline', $existing->fresh()->status);

        $created = GpsDevice::query()->where('unique_id', '352503097417775')->first();
        $this->assertNotNull($created);
        $this->assertSame('ROCKY', $created->name);
        $this->assertSame('online', $created->status);
        $this->assertSame(352503097417775, $created->traccar_device_id);
    }

    public function test_pairing_captures_the_vehicles_odometer_as_the_baseline(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create(['odometer_km' => 12345]);
        $device = GpsDevice::factory()->create();

        $this->actingAs($user)->patch(route('module.tracking.devices.pair', $device), [
            'vehicle_id' => $vehicle->id,
        ])->assertSessionHas('success');

        $device->refresh();
        $this->assertSame($vehicle->id, $device->vehicle_id);
        $this->assertSame(12345, $device->odometer_base_km);
        $this->assertSame(0, $device->accumulated_distance_m);
        // Cleared so the first poll measures from now rather than crediting the
        // vehicle with the tracker's whole previous life.
        $this->assertNull($device->traccar_total_distance_m);
    }

    public function test_a_vehicle_can_only_carry_one_tracker(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        GpsDevice::factory()->pairedTo($vehicle)->create();
        $second = GpsDevice::factory()->create();

        $this->actingAs($user)->patch(route('module.tracking.devices.pair', $second), [
            'vehicle_id' => $vehicle->id,
        ])->assertSessionHas('error');

        $this->assertNull($second->fresh()->vehicle_id);
    }

    public function test_an_already_paired_device_must_be_unpaired_first(): void
    {
        $user = $this->createAdminUser();
        $device = GpsDevice::factory()->pairedTo(Vehicle::factory()->create())->create();
        $other = Vehicle::factory()->create();

        $this->actingAs($user)->patch(route('module.tracking.devices.pair', $device), [
            'vehicle_id' => $other->id,
        ])->assertSessionHas('error');
    }

    public function test_unpairing_resets_the_odometer_baseline(): void
    {
        $user = $this->createAdminUser();
        $device = GpsDevice::factory()->pairedTo(Vehicle::factory()->create(['odometer_km' => 900]))->create([
            'accumulated_distance_m' => 4000,
        ]);

        $this->actingAs($user)->delete(route('module.tracking.devices.unpair', $device))->assertSessionHas('success');

        $device->refresh();
        $this->assertNull($device->vehicle_id);
        $this->assertSame(0, $device->accumulated_distance_m);
        $this->assertSame(0, $device->odometer_base_km);
    }

    public function test_a_paired_device_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $device = GpsDevice::factory()->pairedTo(Vehicle::factory()->create())->create();

        $this->actingAs($user)->delete(route('module.tracking.devices.destroy', $device))->assertSessionHas('error');

        $this->assertDatabaseHas('gps_devices', ['id' => $device->id]);
    }

    public function test_a_vehicle_with_a_tracker_is_protected_from_deletion(): void
    {
        $vehicle = Vehicle::factory()->create();
        GpsDevice::factory()->pairedTo($vehicle)->create();

        $this->expectException(\Illuminate\Database\QueryException::class);
        $vehicle->delete();
    }
}
