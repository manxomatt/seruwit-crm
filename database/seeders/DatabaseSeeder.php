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
        // Permissions first — including every registered module's, since RoleSeeder
        // syncs whatever exists at that moment onto the roles — then roles, menus
        // and settings.
        $this->call([
            PermissionSeeder::class,
            ModuleRegistrySeeder::class,
            RoleSeeder::class,
            MenuSeeder::class,
            SettingSeeder::class,
            // Central only: plans are a platform definition, and tenant schemas
            // carry nothing but the plan key.
            PlanSeeder::class,
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
