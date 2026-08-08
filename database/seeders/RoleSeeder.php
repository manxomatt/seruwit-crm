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
        Role::query()->firstOrCreate(
            ['slug' => 'admin'],
            [
                'name' => 'Administrator',
                'description' => 'Full access to all system features',
                'is_system' => true,
                'dashboard_path' => '/module/dashboard',
            ]
        );

        // Create User role (read-only access)
        Role::query()->firstOrCreate(
            ['slug' => 'user'],
            [
                'name' => 'User',
                'description' => 'Read-only access to system features',
                'is_system' => true,
                'dashboard_path' => '/module/dashboard',
            ]
        );

        // Driver: the mobile delivery portal only. Narrow set — see their trips
        // and orders, and deliver (POD). No dispatch, no admin.
        Role::query()->firstOrCreate(
            ['slug' => 'driver'],
            [
                'name' => 'Driver',
                'description' => 'Mobile delivery driver — POD only',
                'is_system' => true,
                'dashboard_path' => '/module/driver/today',
            ]
        );

        // Salesperson: field canvassing portal only — check in/out and view canvassing data.
        Role::query()->firstOrCreate(
            ['slug' => 'salesperson'],
            [
                'name' => 'Salesperson',
                'description' => 'Field salesperson — mobile canvassing portal only',
                'is_system' => true,
                'dashboard_path' => '/module/canvassing/portal/today',
            ]
        );

        // Reseller: can manage their own tenant portfolio from the central domain.
        // No module-level permissions — access is gated by the manage-tenants gate.
        // This role exists exclusively on central domain control plane, not inside tenant schemas.
        if (! tenancy()->initialized) {
            Role::query()->firstOrCreate(
                ['slug' => 'reseller'],
                [
                    'name' => 'Reseller',
                    'description' => 'Can manage tenants they own on the central control plane',
                    'is_system' => true,
                    'dashboard_path' => '/module/tenants',
                ]
            );
        }

        // Warehouse head: full site ops, restricted to exactly one assigned warehouse/store.
        Role::query()->firstOrCreate(
            ['slug' => 'warehouse_head'],
            [
                'name' => 'Warehouse Head',
                'description' => 'Owns operations for a single warehouse or store site',
                'is_system' => true,
                'dashboard_path' => '/module/inventory/warehouses',
            ]
        );

        // Warehouse manager: same ops verbs, can be assigned to one or more sites.
        Role::query()->firstOrCreate(
            ['slug' => 'warehouse_manager'],
            [
                'name' => 'Warehouse Manager',
                'description' => 'Owns operations across one or more warehouse or store sites',
                'is_system' => true,
                'dashboard_path' => '/module/inventory/warehouses',
            ]
        );

        Role::query()->firstOrCreate(
            ['slug' => 'fleet_base_head'],
            [
                'name' => 'Fleet Base Head',
                'description' => 'Owns operations for a single fleet home base',
                'is_system' => true,
                'dashboard_path' => '/module/fleet/bases',
            ]
        );

        Role::query()->firstOrCreate(
            ['slug' => 'fleet_base_manager'],
            [
                'name' => 'Fleet Base Manager',
                'description' => 'Owns operations across one or more fleet home bases',
                'is_system' => true,
                'dashboard_path' => '/module/fleet/bases',
            ]
        );

        SystemRolePermissions::syncAllSystemRoles();
    }
}
