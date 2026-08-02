<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Support\SystemRolePermissions;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Admin role (has all permissions implicitly)
        $adminRole = Role::query()->firstOrCreate(
            ['slug' => 'admin'],
            [
                'name' => 'Administrator',
                'description' => 'Full access to all system features',
                'is_system' => true,
                'dashboard_path' => '/module/dashboard',
            ]
        );
        $this->ensureDefaultPermissions($adminRole);

        // Create User role (read-only access)
        $userRole = Role::query()->firstOrCreate(
            ['slug' => 'user'],
            [
                'name' => 'User',
                'description' => 'Read-only access to system features',
                'is_system' => true,
                'dashboard_path' => '/module/dashboard',
            ]
        );
        $this->ensureDefaultPermissions($userRole);

        // Driver: the mobile delivery portal only. Narrow set — see their trips
        // and orders, and deliver (POD). No dispatch, no admin.
        $driverRole = Role::query()->firstOrCreate(
            ['slug' => 'driver'],
            [
                'name' => 'Driver',
                'description' => 'Mobile delivery driver — POD only',
                'is_system' => true,
                'dashboard_path' => '/module/driver/today',
            ]
        );
        $this->ensureDefaultPermissions($driverRole);

        // Salesperson: field canvassing portal only — check in/out and view canvassing data.
        $salespersonRole = Role::query()->firstOrCreate(
            ['slug' => 'salesperson'],
            [
                'name' => 'Salesperson',
                'description' => 'Field salesperson — mobile canvassing portal only',
                'is_system' => true,
                'dashboard_path' => '/module/canvassing/portal/today',
            ]
        );
        $this->ensureDefaultPermissions($salespersonRole);

        // Reseller: can manage their own tenant portfolio from the central domain.
        // No module-level permissions — access is gated by the manage-tenants gate.
        Role::query()->firstOrCreate(
            ['slug' => 'reseller'],
            [
                'name' => 'Reseller',
                'description' => 'Can manage tenants they own on the central control plane',
                'is_system' => true,
                'dashboard_path' => '/module/tenants',
            ]
        );

        // Warehouse head: full site ops, restricted to exactly one assigned warehouse/store.
        $warehouseHead = Role::query()->firstOrCreate(
            ['slug' => 'warehouse_head'],
            [
                'name' => 'Warehouse Head',
                'description' => 'Owns operations for a single warehouse or store site',
                'is_system' => true,
                'dashboard_path' => '/module/inventory/warehouses',
            ]
        );
        $this->ensureDefaultPermissions($warehouseHead);

        // Warehouse manager: same ops verbs, can be assigned to one or more sites.
        $warehouseManager = Role::query()->firstOrCreate(
            ['slug' => 'warehouse_manager'],
            [
                'name' => 'Warehouse Manager',
                'description' => 'Owns operations across one or more warehouse or store sites',
                'is_system' => true,
                'dashboard_path' => '/module/inventory/warehouses',
            ]
        );
        $this->ensureDefaultPermissions($warehouseManager);
    }

    /**
     * Ensure seeded defaults exist without wiping extras an admin added.
     */
    private function ensureDefaultPermissions(Role $role): void
    {
        $role->permissions()->sync(
            SystemRolePermissions::mergeWithDefaults(
                $role,
                $role->permissions()->pluck('id')->all()
            )
        );
    }
}
