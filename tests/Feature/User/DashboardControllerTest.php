<?php

namespace Tests\Feature\User;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_user_dashboard(): void
    {
        $response = $this->get(route('user.dashboard'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_access_user_dashboard(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('user.dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('User/Dashboard')
            ->has('user')
            ->where('user.name', $user->name)
            ->where('user.email', $user->email)
        );
    }

    public function test_user_dashboard_shows_user_roles(): void
    {
        $role = Role::factory()->create(['name' => 'Editor', 'slug' => 'editor']);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        $response = $this->actingAs($user)->get(route('user.dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('User/Dashboard')
            ->has('user.roles')
            ->where('user.roles.0', 'Editor')
        );
    }

    public function test_user_dashboard_shares_permissions_in_auth(): void
    {
        // Create a role with specific permissions
        $role = Role::factory()->create(['name' => 'Editor', 'slug' => 'editor']);
        $permission = Permission::factory()->create([
            'name' => 'View Pages',
            'slug' => 'pages.view',
            'module' => 'pages',
            'action' => 'view',
        ]);
        $role->permissions()->attach($permission);

        $user = User::factory()->create();
        $user->roles()->attach($role);

        $response = $this->actingAs($user)->get(route('user.dashboard'));

        $response->assertStatus(200);
        // The permissions should be shared via HandleInertiaRequests middleware
        $response->assertInertia(fn ($page) => $page
            ->component('User/Dashboard')
            ->has('auth.user.permissions')
            ->where('auth.user.permissions.pages', ['view'])
        );
    }

    public function test_admin_user_has_all_permissions(): void
    {
        // Create admin role
        $adminRole = Role::factory()->create(['name' => 'Admin', 'slug' => 'admin', 'is_system' => true]);

        // Create some permissions
        Permission::factory()->create([
            'name' => 'View Pages',
            'slug' => 'pages.view',
            'module' => 'pages',
            'action' => 'view',
        ]);
        Permission::factory()->create([
            'name' => 'Create Pages',
            'slug' => 'pages.create',
            'module' => 'pages',
            'action' => 'create',
        ]);

        $user = User::factory()->create();
        $user->roles()->attach($adminRole);

        $response = $this->actingAs($user)->get(route('user.dashboard'));

        $response->assertStatus(200);
        // Admin should have all permissions
        $response->assertInertia(fn ($page) => $page
            ->component('User/Dashboard')
            ->has('auth.user.permissions.pages')
            ->where('auth.user.is_admin', true)
        );
    }

    public function test_user_without_permissions_has_empty_permissions_array(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('user.dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('User/Dashboard')
            ->has('auth.user.permissions')
            ->where('auth.user.permissions', [])
        );
    }
}
