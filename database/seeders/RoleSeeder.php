<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
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

        // Assign all permissions to admin role (preserve any extras on reseed)
        $this->ensureDefaultPermissions($adminRole, Permission::query()->pluck('id')->all());

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

        // Assign only view permissions to user role (preserve any extras on reseed)
        $viewPermissions = Permission::query()
            ->where('action', 'view')
            ->pluck('id')
            ->all();
        $this->ensureDefaultPermissions($userRole, $viewPermissions);

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

        $driverPermissions = Permission::query()
            ->where(function ($query) {
                $query
                    ->where(fn ($q) => $q->where('module', 'orders')->whereIn('action', ['view', 'deliver']))
                    ->orWhere(fn ($q) => $q->where('module', 'transportation')->where('action', 'view'));
            })
            ->pluck('id')
            ->all();
        $this->ensureDefaultPermissions($driverRole, $driverPermissions);

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

        $salespersonPermissions = Permission::query()
            ->where(function ($query): void {
                $query->where(fn ($q) => $q->where('module', 'canvassing')->whereIn('action', ['view', 'checkin']));
            })
            ->pluck('id')
            ->all();
        $this->ensureDefaultPermissions($salespersonRole, $salespersonPermissions);

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

        $siteOpsPermissions = Permission::query()
            ->where(function ($query): void {
                $query
                    ->where(fn ($q) => $q->where('module', 'inventory')->whereIn('action', ['view', 'create', 'update', 'adjust']))
                    ->orWhere(fn ($q) => $q->where('module', 'products')->where('action', 'view'))
                    ->orWhere(fn ($q) => $q->where('module', 'partners')->where('action', 'view'))
                    ->orWhere(fn ($q) => $q->where('module', 'purchasing')->whereIn('action', ['view', 'create', 'update', 'receive']))
                    ->orWhere(fn ($q) => $q->where('module', 'sales')->whereIn('action', ['view', 'create', 'update', 'issue']))
                    ->orWhere(fn ($q) => $q->where('module', 'orders')->whereIn('action', ['view', 'create']));
            })
            ->pluck('id')
            ->all();
        $this->ensureDefaultPermissions($warehouseHead, $siteOpsPermissions);

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
        $this->ensureDefaultPermissions($warehouseManager, $siteOpsPermissions);
    }

    /**
     * Ensure the seeded default permissions exist without wiping extras an admin added.
     *
     * @param  array<int>  $defaultPermissionIds
     */
    private function ensureDefaultPermissions(Role $role, array $defaultPermissionIds): void
    {
        $merged = $role->permissions()
            ->pluck('id')
            ->merge($defaultPermissionIds)
            ->unique()
            ->values()
            ->all();

        $role->permissions()->sync($merged);
    }
}
