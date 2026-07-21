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
    }
}
