<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Convenience accounts for local development and the test suite only: a platform
 * admin (admin@domain.com) and a plain user (test@domain.com).
 *
 * Never run by the installer — a real deployment gets its admin from the
 * installer's Create Admin step, not a hard-coded credential.
 */
class DevAccountsSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
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
