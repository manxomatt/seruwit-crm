<?php

namespace Tests\Feature\Modules\Fleet;

use App\Models\Role;
use App\Models\User;
use App\Support\SystemRolePermissions;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\FleetBase;
use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\AccessibleFleetBases;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class FleetBaseHeadAccessTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->withoutMiddleware([
            ValidateCsrfToken::class,
            VerifyCsrfToken::class,
        ]);
        $this->setUpRoles();
        SystemRolePermissions::seedRolesForModule('fleet');
        SystemRolePermissions::syncAllSystemRoles();
    }

    public function test_fleet_base_head_has_view_create_update_but_not_delete(): void
    {
        $headRole = Role::query()->where('slug', AccessibleFleetBases::ROLE_HEAD)->firstOrFail();
        $permissionSlugs = $headRole->permissions()->pluck('slug')->all();

        $this->assertContains('fleet.view', $permissionSlugs);
        $this->assertContains('fleet.create', $permissionSlugs);
        $this->assertContains('fleet.update', $permissionSlugs);
        $this->assertNotContains('fleet.delete', $permissionSlugs);
        $this->assertContains('media.view', $permissionSlugs);
        $this->assertContains('media.create', $permissionSlugs);
    }

    public function test_fleet_base_head_cannot_create_or_store_new_base(): void
    {
        $admin = $this->createAdminUser();
        $base = FleetBase::factory()->create(['manager_id' => $admin->id]);
        $head = $this->createHeadUser([$base->id]);

        $this->actingAs($head)->get(route('module.fleet.bases.create'))
            ->assertForbidden();

        $this->actingAs($head)->post(route('module.fleet.bases.store'), [
            'code' => 'NEW-BASE-01',
            'name' => 'New Base',
            'kind' => 'depot',
            'status' => 'active',
            'timezone' => 'Asia/Jakarta',
            'allows_overnight' => true,
            'manager_id' => $head->id,
        ])->assertForbidden();
    }

    public function test_fleet_base_head_cannot_delete_base(): void
    {
        $admin = $this->createAdminUser();
        $base = FleetBase::factory()->create(['manager_id' => $admin->id]);
        $head = $this->createHeadUser([$base->id]);

        $this->actingAs($head)->delete(route('module.fleet.bases.destroy', $base))
            ->assertForbidden();

        $this->assertDatabaseHas('fleet_bases', ['id' => $base->id]);
    }

    public function test_fleet_base_head_only_sees_vehicles_from_assigned_base(): void
    {
        $admin = $this->createAdminUser();
        $assignedBase = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-A']);
        $otherBase = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-B']);

        $myVehicle = Vehicle::factory()->create([
            'home_base_id' => $assignedBase->id,
            'plate_number' => 'B1111MY',
        ]);
        $otherVehicle = Vehicle::factory()->create([
            'home_base_id' => $otherBase->id,
            'plate_number' => 'B2222OTHER',
        ]);

        $head = $this->createHeadUser([$assignedBase->id]);

        $this->actingAs($head)->get(route('module.fleet.vehicles.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Vehicles/Index')
                ->where('vehicles.total', 1)
                ->where('vehicles.data.0.plate_number', 'B1111MY')
            );
    }

    public function test_fleet_base_head_cannot_view_or_edit_vehicle_from_other_base(): void
    {
        $admin = $this->createAdminUser();
        $assignedBase = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-A']);
        $otherBase = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-B']);

        $otherVehicle = Vehicle::factory()->create([
            'home_base_id' => $otherBase->id,
            'plate_number' => 'B2222OTHER',
        ]);

        $head = $this->createHeadUser([$assignedBase->id]);

        $this->actingAs($head)->get(route('module.fleet.vehicles.show', $otherVehicle))
            ->assertForbidden();

        $this->actingAs($head)->get(route('module.fleet.vehicles.edit', $otherVehicle))
            ->assertForbidden();

        $this->actingAs($head)->patch(route('module.fleet.vehicles.update', $otherVehicle), [
            'name' => 'Attempted Edit',
            'plate_number' => 'B2222OTHER',
            'home_base_id' => $assignedBase->id,
        ])->assertForbidden();
    }

    public function test_fleet_base_head_can_view_and_update_vehicle_from_own_base(): void
    {
        $admin = $this->createAdminUser();
        $assignedBase = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-A']);

        $myVehicle = Vehicle::factory()->create([
            'home_base_id' => $assignedBase->id,
            'name' => 'Truck A',
            'plate_number' => 'B1111MY',
            'brand' => 'Hino',
            'color' => 'Green',
            'type' => 'truck',
        ]);

        $head = $this->createHeadUser([$assignedBase->id]);

        $this->actingAs($head)->get(route('module.fleet.vehicles.show', $myVehicle))
            ->assertOk();

        $this->actingAs($head)->get(route('module.fleet.vehicles.edit', $myVehicle))
            ->assertOk();

        $this->actingAs($head)->patch(route('module.fleet.vehicles.update', $myVehicle), [
            'name' => 'Truck A Updated',
            'plate_number' => 'B1111MY',
            'brand' => 'Hino',
            'color' => 'Green',
            'type' => 'truck',
            'home_base_id' => $assignedBase->id,
        ])->assertRedirect(route('module.fleet.vehicles.show', $myVehicle));

        $this->assertSame('Truck A Updated', $myVehicle->fresh()->name);
    }

    public function test_fleet_base_head_cannot_delete_vehicle(): void
    {
        $admin = $this->createAdminUser();
        $assignedBase = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-A']);

        $myVehicle = Vehicle::factory()->create([
            'home_base_id' => $assignedBase->id,
            'plate_number' => 'B1111MY',
        ]);

        $head = $this->createHeadUser([$assignedBase->id]);

        $this->actingAs($head)->delete(route('module.fleet.vehicles.destroy', $myVehicle))
            ->assertForbidden();

        $this->assertDatabaseHas('vehicles', ['id' => $myVehicle->id]);
    }

    public function test_fleet_base_head_fuel_logs_are_scoped_to_assigned_base(): void
    {
        $admin = $this->createAdminUser();
        $assignedBase = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-A']);
        $otherBase = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-B']);

        $myVehicle = Vehicle::factory()->create(['home_base_id' => $assignedBase->id]);
        $otherVehicle = Vehicle::factory()->create(['home_base_id' => $otherBase->id]);

        FuelLog::factory()->create([
            'vehicle_id' => $myVehicle->id,
            'liters' => 50,
            'cost' => 500000,
        ]);
        FuelLog::factory()->create([
            'vehicle_id' => $otherVehicle->id,
            'liters' => 70,
            'cost' => 700000,
        ]);

        $head = $this->createHeadUser([$assignedBase->id]);

        $this->actingAs($head)->get(route('module.fleet.fuel.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Fuel/Index')
                ->where('logs.total', 1)
                ->where('logs.data.0.vehicle_id', $myVehicle->id)
                ->where('vehicles.0.id', $myVehicle->id)
            );
    }

    /**
     * @param  list<int>  $fleetBaseIds
     */
    protected function createHeadUser(array $fleetBaseIds): User
    {
        $user = User::factory()->create();
        $role = Role::query()->where('slug', AccessibleFleetBases::ROLE_HEAD)->firstOrFail();
        $user->assignRole($role);
        $user->fleetBases()->sync($fleetBaseIds);

        return $user;
    }
}
