<?php

namespace Tests\Feature\Modules;

use App\Models\InstalledModule;
use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\FleetModule;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Events\VehiclePositionsRecorded;
use Modules\Tracking\Support\PositionPayload;
use Modules\Tracking\TrackingModule;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripCheckpoint;
use Modules\TransportationManagement\TransportationManagementModule;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * Proves Tracking behaves like any other optional module and, crucially, that
 * it is genuinely Foundation: it installs without a single logistics module,
 * and the trip-side listener stays inert in either direction.
 */
class TrackingModuleLifecycleTest extends TestCase
{
    use WithTenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    private function installer(): ModuleInstaller
    {
        return app(ModuleInstaller::class);
    }

    private function tracking(): TrackingModule
    {
        return app(TrackingModule::class);
    }

    public function test_installing_requires_a_plan_entitled_to_tracking(): void
    {
        $tenant = $this->provisionTenant('Basic GPS Co', 'basic-gps-co', 'owner@basic-gps.test');

        // The default plan (basic) does not include tracking.
        $this->expectException(\RuntimeException::class);
        $this->installer()->install($tenant, $this->tracking());
    }

    /**
     * The tier placement is only real if Tracking can stand without the
     * business line that consumes it — otherwise it is a Vertical wearing a
     * Foundation label.
     */
    public function test_tracking_installs_without_any_logistics_module(): void
    {
        $tenant = $this->provisionTenant('GPS Only Co', 'gps-only-co', 'owner@gps-only.test');
        $tenant->plan = 'pro';
        $tenant->save();

        $this->installer()->install($tenant, $this->tracking());

        $tenant->run(function () {
            $this->assertTrue(Schema::hasTable('gps_devices'));
            $this->assertTrue(Schema::hasTable('vehicle_positions'));
            $this->assertTrue(Schema::hasTable('tracking_configs'));

            // Fleet comes along as a declared requirement.
            $this->assertTrue(InstalledModule::query()->where('key', 'fleet')->installed()->exists());

            foreach (['transportation', 'orders', 'billing'] as $key) {
                $this->assertFalse(
                    InstalledModule::query()->where('key', $key)->installed()->exists(),
                    "Tracking must not drag [{$key}] in with it.",
                );
            }
        });
    }

    public function test_fleet_cannot_be_uninstalled_while_tracking_depends_on_it(): void
    {
        $tenant = $this->provisionTenant('GPS Guard Co', 'gps-guard-co', 'owner@gps-guard.test');
        $tenant->plan = 'pro';
        $tenant->save();

        $this->installer()->install($tenant, $this->tracking());

        $this->expectException(\RuntimeException::class);
        $this->installer()->uninstall($tenant, app(FleetModule::class));
    }

    /**
     * With Tracking installed but Transportation absent there is no trips
     * table, so a listener that failed to gate would surface as a
     * QueryException rather than a silent pass.
     */
    public function test_the_trip_listener_is_inert_without_transportation(): void
    {
        $tenant = $this->provisionTenant('GPS No Trips Co', 'gps-no-trips-co', 'owner@gps-no-trips.test');
        $tenant->plan = 'pro';
        $tenant->save();

        $this->installer()->install($tenant, $this->tracking());

        $tenant->run(function () {
            $this->assertFalse(Schema::hasTable('trips'));

            VehiclePositionsRecorded::dispatch(
                [new PositionPayload(
                    traccarDeviceId: 7,
                    latitude: -6.2,
                    longitude: 106.8,
                    speedKph: 40,
                    course: null,
                    altitude: null,
                    ignition: true,
                    motion: true,
                    totalDistanceM: null,
                    recordedAt: now()->toImmutable(),
                    serverTime: null,
                    attributes: null,
                )],
                [7 => 1],
                200,
                200,
                5,
            );
        });

        // Reaching here without a QueryException proves the gate held.
        $this->assertTrue(true);
    }

    /**
     * And the mirror image: Transportation installed, Tracking absent. The
     * event never fires, so trips simply keep their manual checkpoints.
     */
    public function test_transportation_works_without_tracking_installed(): void
    {
        $tenant = $this->provisionTenant('Trips No GPS Co', 'trips-no-gps-co', 'owner@trips-no-gps.test');
        $tenant->plan = 'pro';
        $tenant->save();

        $this->installer()->install($tenant, app(TransportationManagementModule::class));

        $tenant->run(function () {
            $this->assertFalse(Schema::hasTable('gps_devices'));

            $trip = Trip::factory()->inProgress()->create([
                'vehicle_id' => Vehicle::factory()->create()->id,
            ]);

            TripCheckpoint::create([
                'trip_id' => $trip->id,
                'latitude' => -6.2,
                'longitude' => 106.8,
                'recorded_at' => now(),
            ]);

            // Manual entry still defaults to the manual source.
            $this->assertSame(TripCheckpoint::SOURCE_MANUAL, TripCheckpoint::first()->source);
        });
    }
}
