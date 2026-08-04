<?php

namespace Tests\Traits;

use App\Http\Middleware\EnsureTenantIsActive;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\ModuleRegistrySeeder;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

trait WithRoles
{
    /**
     * Set up roles and permissions for testing.
     *
     * Module permissions are seeded before RoleSeeder, which syncs whatever is in
     * the table onto the roles — seed them after and no role would ever hold them.
     */
    protected function setUpRoles(): void
    {
        // `module.*` routes are the tenant-domain copies of app.php. Non-tenancy
        // feature tests hit them on a central host (localhost / localhost.test),
        // which PreventAccessFromCentralDomains would 404. Skip those gates unless
        // the test also uses WithTenant and drives a real tenant domain.
        if (! in_array(WithTenant::class, class_uses_recursive(static::class), true)) {
            $this->withoutMiddleware([
                InitializeTenancyByDomain::class,
                PreventAccessFromCentralDomains::class,
                EnsureTenantIsActive::class,
            ]);
        }

        $this->seed(PermissionSeeder::class);
        $this->seed(ModuleRegistrySeeder::class);
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
