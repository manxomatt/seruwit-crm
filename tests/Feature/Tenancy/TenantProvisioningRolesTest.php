<?php

namespace Tests\Feature\Tenancy;

use App\Models\Role;
use App\Models\User;
use App\Modules\Facades\Modules;
use App\Modules\ModuleInstaller;
use Tests\TestCase;
use Tests\Traits\WithTenant;

class TenantProvisioningRolesTest extends TestCase
{
    use WithTenant;

    public function test_newly_provisioned_tenant_has_only_admin_role_and_owner_is_admin(): void
    {
        $id = \Illuminate\Support\Str::random(6);
        $tenant = $this->provisionTenant('Only Admin Co', 'only-admin-'.$id, "owner-{$id}@only-admin.test");

        $tenant->run(function (): void {
            // Verify roles table in tenant schema only has 'admin' role
            $roles = Role::query()->pluck('slug')->all();
            $this->assertSame(['admin'], $roles);

            // Verify owner user has only 'admin' role
            $owner = User::query()->first();
            $this->assertNotNull($owner);
            $this->assertSame(['admin'], $owner->roles->pluck('slug')->all());
        });
    }

    public function test_installing_inventory_module_creates_warehouse_roles(): void
    {
        $id = \Illuminate\Support\Str::random(6);
        $tenant = $this->provisionTenant('Inventory Tenant', 'inventory-'.$id, "owner-{$id}@inventory.test");

        $tenant->run(function (): void {
            $this->assertFalse(Role::query()->where('slug', 'warehouse_manager')->exists());
            $this->assertFalse(Role::query()->where('slug', 'warehouse_head')->exists());
        });

        $inventoryModule = Modules::find('inventory');
        $this->assertNotNull($inventoryModule);

        app(ModuleInstaller::class)->install($tenant, $inventoryModule);

        $tenant->run(function (): void {
            $this->assertTrue(Role::query()->where('slug', 'warehouse_manager')->exists());
            $this->assertTrue(Role::query()->where('slug', 'warehouse_head')->exists());

            $managerRole = Role::query()->where('slug', 'warehouse_manager')->firstOrFail();
            $this->assertTrue($managerRole->permissions()->where('module', 'inventory')->exists());
        });
    }

    public function test_installing_fleet_module_creates_fleet_roles(): void
    {
        $id = \Illuminate\Support\Str::random(6);
        $tenant = $this->provisionTenant('Fleet Tenant', 'fleet-'.$id, "owner-{$id}@fleet.test");

        $tenant->run(function (): void {
            $this->assertFalse(Role::query()->where('slug', 'fleet_base_manager')->exists());
            $this->assertFalse(Role::query()->where('slug', 'fleet_base_head')->exists());
        });

        $fleetModule = Modules::find('fleet');
        $this->assertNotNull($fleetModule);

        app(ModuleInstaller::class)->install($tenant, $fleetModule);

        $tenant->run(function (): void {
            $this->assertTrue(Role::query()->where('slug', 'fleet_base_manager')->exists());
            $this->assertTrue(Role::query()->where('slug', 'fleet_base_head')->exists());

            $fleetRole = Role::query()->where('slug', 'fleet_base_manager')->firstOrFail();
            $this->assertTrue($fleetRole->permissions()->where('module', 'fleet')->exists());
        });
    }

    public function test_installing_canvassing_module_creates_salesperson_role(): void
    {
        $id = \Illuminate\Support\Str::random(6);
        $tenant = $this->provisionTenant('Canvassing Tenant', 'canvassing-'.$id, "owner-{$id}@canvassing.test");

        $tenant->run(function (): void {
            $this->assertFalse(Role::query()->where('slug', 'salesperson')->exists());
        });

        $canvassingModule = Modules::find('canvassing');
        $this->assertNotNull($canvassingModule);

        app(ModuleInstaller::class)->install($tenant, $canvassingModule);

        $tenant->run(function (): void {
            $this->assertTrue(Role::query()->where('slug', 'salesperson')->exists());
        });
    }
}
