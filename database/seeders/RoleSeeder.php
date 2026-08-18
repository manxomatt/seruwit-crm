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
        // Admin role is always created (has all permissions implicitly)
        Role::query()->firstOrCreate(
            ['slug' => 'admin'],
            SystemRolePermissions::getSystemRoleDefinition('admin')
        );

        // Reseller & User roles exist on central control plane when not inside tenant schema
        if (! tenancy()->initialized) {
            Role::query()->firstOrCreate(
                ['slug' => 'user'],
                SystemRolePermissions::getSystemRoleDefinition('user')
            );

            Role::query()->firstOrCreate(
                ['slug' => 'reseller'],
                SystemRolePermissions::getSystemRoleDefinition('reseller')
            );
        }

        SystemRolePermissions::syncAllSystemRoles();
    }

    /**
     * Helper to seed all system roles (used by non-tenant tests or demo seeders).
     */
    public static function seedAllSystemRoles(): void
    {
        $slugs = [
            'admin',
            'user',
            'driver',
            'salesperson',
            'warehouse_head',
            'warehouse_manager',
            'fleet_base_head',
            'fleet_base_manager',
        ];

        foreach ($slugs as $slug) {
            $def = SystemRolePermissions::getSystemRoleDefinition($slug);
            if ($def !== null) {
                Role::query()->firstOrCreate(['slug' => $slug], $def);
            }
        }

        SystemRolePermissions::syncAllSystemRoles();
    }
}
