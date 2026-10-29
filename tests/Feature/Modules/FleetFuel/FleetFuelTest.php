<?php

namespace Tests\Feature\Modules\FleetFuel;

use App\Support\SystemRolePermissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\FleetFuel\Models\FuelLog;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class FleetFuelTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
        SystemRolePermissions::seedRolesForModule('fleet-fuel');
        SystemRolePermissions::syncAllSystemRoles();
    }

    public function test_guests_cannot_access_fleet_fuel(): void
    {
        $this->get(route('module.fleet-fuel.index'))->assertRedirect(route('login'));
        $this->get(route('module.fleet-fuel.analytics'))->assertRedirect(route('login'));
    }

    public function test_admin_can_access_fleet_fuel_index(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create(['name' => 'Avanza Operasional']);

        FuelLog::factory()->create([
            'vehicle_id' => $vehicle->id,
            'liters' => 30,
            'cost' => 390000,
        ]);

        $this->actingAs($user)->get(route('module.fleet-fuel.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/FleetFuel/Index')
                ->has('logs.data')
                ->has('vehicles')
                ->has('filters')
            );
    }

    public function test_admin_can_access_fleet_fuel_analytics(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create(['name' => 'Innova Reborn']);

        FuelLog::factory()->create([
            'vehicle_id' => $vehicle->id,
            'liters' => 45,
            'cost' => 675000,
            'km_per_liter' => 11.5,
        ]);

        $this->actingAs($user)->get(route('module.fleet-fuel.analytics'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/FleetFuel/Analytics')
                ->has('analytics.summary')
                ->has('analytics.monthly_costs')
                ->has('analytics.efficiency_trend')
                ->has('analytics.fleet_ranking')
            );
    }

    public function test_store_and_destroy_fuel_log_via_module_routes(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create(['odometer_km' => 15000]);

        $response = $this->actingAs($user)->post(route('module.fleet-fuel.vehicles.logs.store', $vehicle), [
            'filled_at' => now()->toDateString(),
            'liters' => 40,
            'cost' => 560000,
            'odometer_km' => 15450,
            'odometer_source' => 'vehicle',
            'station_name' => 'Pertamina Dago',
            'is_full_tank' => true,
        ]);

        $response->assertRedirect(route('module.fleet.vehicles.show', $vehicle));

        $this->assertDatabaseHas('fuel_logs', [
            'vehicle_id' => $vehicle->id,
            'liters' => 40,
            'station_name' => 'Pertamina Dago',
            'distance_since_last_km' => null, // first fill without baseline
        ]);

        $this->assertSame(15450, $vehicle->fresh()->odometer_km);

        $log = FuelLog::query()->where('vehicle_id', $vehicle->id)->firstOrFail();

        $deleteResponse = $this->actingAs($user)->delete(route('module.fleet-fuel.vehicles.logs.destroy', [$vehicle, $log]));
        $deleteResponse->assertRedirect(route('module.fleet.vehicles.show', $vehicle));

        $this->assertDatabaseMissing('fuel_logs', ['id' => $log->id]);
    }

    public function test_backward_compatibility_routes_work(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create(['odometer_km' => 2000]);

        $this->actingAs($user)->get(route('module.fleet.fuel.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/FleetFuel/Index')
            );

        $this->actingAs($user)->get(route('module.fleet.fuel.analytics'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/FleetFuel/Analytics')
            );

        $this->actingAs($user)->post(route('module.fleet.vehicles.fuel-logs.store', $vehicle), [
            'filled_at' => now()->toDateString(),
            'liters' => 25,
            'cost' => 350000,
            'odometer_km' => 2250,
        ])->assertRedirect(route('module.fleet.vehicles.show', $vehicle));

        $this->assertDatabaseHas('fuel_logs', [
            'vehicle_id' => $vehicle->id,
            'liters' => 25,
        ]);
    }
}
