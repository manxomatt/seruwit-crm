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

        // Assign all permissions to admin role
        $allPermissions = Permission::all();
        $adminRole->permissions()->sync($allPermissions->pluck('id')->toArray());

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

        // Assign only view permissions to user role
        $viewPermissions = Permission::query()
            ->where('action', 'view')
            ->get();
        $userRole->permissions()->sync($viewPermissions->pluck('id')->toArray());

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
            ->get();
        $driverRole->permissions()->sync($driverPermissions->pluck('id')->toArray());

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
            ->get();
        $salespersonRole->permissions()->sync($salespersonPermissions->pluck('id')->toArray());

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
    }
}
