<?php

namespace Tests\Traits;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

trait WithRoles
{
    /**
     * Set up roles and permissions for testing.
     */
    protected function setUpRoles(): void
    {
        $this->seed(PermissionSeeder::class);
        $this->seed(RoleSeeder::class);
    }

    /**
     * Create a user with admin role.
     */
    protected function createAdminUser(array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $adminRole = Role::where('slug', 'admin')->first();
        if ($adminRole) {
            $user->roles()->attach($adminRole);
        }

        return $user;
    }

    /**
     * Create a user with user role (read-only).
     */
    protected function createUserWithRole(array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $userRole = Role::where('slug', 'user')->first();
        if ($userRole) {
            $user->roles()->attach($userRole);
        }

        return $user;
    }

    /**
     * Create a user without any role.
     */
    protected function createUserWithoutRole(array $attributes = []): User
    {
        return User::factory()->create($attributes);
    }

    /**
     * Assign admin role to an existing user.
     */
    protected function assignAdminRole(User $user): User
    {
        $adminRole = Role::where('slug', 'admin')->first();
        if ($adminRole) {
            $user->roles()->syncWithoutDetaching([$adminRole->id]);
        }

        return $user;
    }

    /**
     * Assign user role to an existing user.
     */
    protected function assignUserRole(User $user): User
    {
        $userRole = Role::where('slug', 'user')->first();
        if ($userRole) {
            $user->roles()->syncWithoutDetaching([$userRole->id]);
        }

        return $user;
    }
}
