<?php

namespace Tests\Feature\Modules\Tracking;

use App\Models\Tenant;
use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Http;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Models\VehiclePosition;
use Modules\Tracking\TrackingModule;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * The per-tenant loop the scheduler drives. Needs real tenant schemas, because
 * the whole point of these commands is that they walk every tenant and survive
 * one of them failing.
 */
class TrackingCommandsTest extends TestCase
{
    use WithTenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    private function trackedTenant(string $name, string $subdomain, string $email): Tenant
    {
        $tenant = $this->provisionTenant($name, $subdomain, $email);
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, app(TrackingModule::class));
        tenancy()->end();

        return $tenant;
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function position(int $deviceId, array $overrides = []): array
    {
        return array_replace([
            'deviceId' => $deviceId,
            'latitude' => -6.2,
            'longitude' => 106.8,
            'speed' => 20,
            'valid' => true,
            'fixTime' => now()->toIso8601String(),
            'attributes' => [],
        ], $overrides);
    }

    /**
     * Fakes the client's two-step path for a host: /devices?all=true derived
     * from the positions, then /positions?id=… returning them.
     *
     * @param  array<int, array<string, mixed>>  $positions
     * @return array<string, mixed>
     */
    private function fleetStubs(string $host, array $positions): array
    {
        $devices = collect($positions)
            ->pluck('deviceId')
            ->unique()
            ->values()
            ->map(fn (int $id, int $i) => ['id' => $id, 'uniqueId' => (string) $id, 'name' => 'D'.$id, 'positionId' => 1000 + $i])
            ->all();

        return [
            "{$host}/api/devices*" => Http::response($devices),
            "{$host}/api/positions*" => Http::response($positions),
        ];
    }

    public function test_it_polls_each_tenant_into_its_own_schema(): void
    {
        $first = $this->trackedTenant('Track One', 'track-one', 'owner@track-one.test');
        $second = $this->trackedTenant('Track Two', 'track-two', 'owner@track-two.test');

        $first->run(function () {
            TrackingConfig::factory()->create(['base_url' => 'https://gps.example.test']);
            GpsDevice::factory()->create(['traccar_device_id' => 11]);
        });

        $second->run(function () {
            TrackingConfig::factory()->create(['base_url' => 'https://gps.example.test']);
            GpsDevice::factory()->create(['traccar_device_id' => 22]);
        });

        Http::fake($this->fleetStubs('gps.example.test', [
            $this->position(11),
            $this->position(22),
        ]));

        $this->artisan('tracking:poll')->assertSuccessful();

        // Each tenant only stores the fix belonging to the device it knows.
        $first->run(fn () => $this->assertSame(1, VehiclePosition::count()));
        $second->run(fn () => $this->assertSame(1, VehiclePosition::count()));
    }

    public function test_a_tenant_with_polling_disabled_is_never_contacted(): void
    {
        $tenant = $this->trackedTenant('Track Off', 'track-off', 'owner@track-off.test');

        $tenant->run(function () {
            TrackingConfig::factory()->disabled()->create(['base_url' => 'https://gps.example.test']);
            GpsDevice::factory()->create(['traccar_device_id' => 11]);
        });

        Http::fake(['gps.example.test/api/*' => Http::response([])]);

        $this->artisan('tracking:poll')->assertSuccessful();

        Http::assertNothingSent();
        $tenant->run(fn () => $this->assertSame(0, VehiclePosition::count()));
    }

    public function test_a_tenant_without_the_module_installed_is_skipped(): void
    {
        $tenant = $this->provisionTenant('No Track', 'no-track', 'owner@no-track.test');
        tenancy()->end();

        Http::fake(['gps.example.test/api/*' => Http::response([])]);

        // No tracking_configs table exists in this schema at all, so a missing
        // gate would surface here as a QueryException rather than a pass.
        $this->artisan('tracking:poll')->assertSuccessful();

        Http::assertNothingSent();
    }

    public function test_a_failing_tenant_does_not_stop_the_others(): void
    {
        $broken = $this->trackedTenant('Track Broken', 'track-broken', 'owner@track-broken.test');
        $healthy = $this->trackedTenant('Track Fine', 'track-fine', 'owner@track-fine.test');

        $broken->run(function () {
            TrackingConfig::factory()->create(['base_url' => 'https://broken.example.test']);
            GpsDevice::factory()->create(['traccar_device_id' => 11]);
        });

        $healthy->run(function () {
            TrackingConfig::factory()->create(['base_url' => 'https://gps.example.test']);
            GpsDevice::factory()->create(['traccar_device_id' => 22]);
        });

        Http::fake([
            'broken.example.test/api/*' => Http::response([], 401),
            ...$this->fleetStubs('gps.example.test', [$this->position(22)]),
        ]);

        $this->artisan('tracking:poll')->assertFailed();

        // The healthy tenant still ingested, and the broken one carries the
        // reason on its own config for its settings page to show.
        $healthy->run(fn () => $this->assertSame(1, VehiclePosition::count()));
        $broken->run(function () {
            $config = TrackingConfig::first();
            $this->assertNotNull($config->last_poll_error);
            $this->assertNotNull($config->last_polled_at);
        });
    }

    public function test_pruning_only_removes_positions_past_the_retention_window(): void
    {
        $tenant = $this->trackedTenant('Track Old', 'track-old', 'owner@track-old.test');

        $tenant->run(function () {
            TrackingConfig::factory()->create(['retention_days' => 30]);
            $device = GpsDevice::factory()->create(['traccar_device_id' => 11]);

            VehiclePosition::factory()->create([
                'gps_device_id' => $device->id,
                'recorded_at' => now()->subDays(40),
            ]);
            VehiclePosition::factory()->create([
                'gps_device_id' => $device->id,
                'recorded_at' => now()->subDays(10),
            ]);
        });

        $this->artisan('tracking:prune')->assertSuccessful();

        $tenant->run(function () {
            $this->assertSame(1, VehiclePosition::count());
            $this->assertTrue(VehiclePosition::first()->recorded_at->isAfter(now()->subDays(30)));
        });
    }
}
