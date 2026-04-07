<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed permissions first, then roles, menus, and settings
        $this->call([
            PermissionSeeder::class,
            RoleSeeder::class,
            MenuSeeder::class,
            SettingSeeder::class,
        ]);

        // Create admin user
        $adminUser = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@domain.com',
        ]);

        // Assign admin role to admin user
        $adminRole = Role::query()->where('slug', 'admin')->first();
        if ($adminRole) {
            $adminUser->assignRole($adminRole);
        }

        // Create regular user
        $regularUser = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@domain.com',
        ]);

        // Assign user role to regular user
        $userRole = Role::query()->where('slug', 'user')->first();
        if ($userRole) {
            $regularUser->assignRole($userRole);
        }
    }
}
