<?php

namespace Tests\Feature\Custom;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Create system roles for tests
        Role::factory()->admin()->create();
        Role::factory()->user()->create();
    }

    public function test_custom_dashboard_requires_authentication(): void
    {
        $response = $this->get(route('custom.dashboard'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_access_custom_dashboard(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('custom.dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Custom/Dashboard')
            ->has('user')
            ->has('user.name')
            ->has('user.email')
            ->has('user.roles')
        );
    }

    public function test_custom_dashboard_shows_user_with_custom_role(): void
    {
        // Create a custom role with specific permissions
        $customRole = Role::factory()->create([
            'name' => 'Content Manager',
            'slug' => 'content-manager',
            'dashboard_path' => '/custom/dashboard',
        ]);

        // Create permissions and attach to role
        $pagesViewPermission = Permission::factory()->create([
            'name' => 'View Pages',
            'slug' => 'pages.view',
            'module' => 'pages',
            'action' => 'view',
        ]);
        $postsViewPermission = Permission::factory()->create([
            'name' => 'View Posts',
            'slug' => 'posts.view',
            'module' => 'posts',
            'action' => 'view',
        ]);

        $customRole->permissions()->attach([$pagesViewPermission->id, $postsViewPermission->id]);

        $user = User::factory()->create();
        $user->roles()->attach($customRole->id);

        $response = $this->actingAs($user)->get(route('custom.dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Custom/Dashboard')
            ->where('user.name', $user->name)
            ->where('user.email', $user->email)
            ->has('primaryRole')
            ->where('primaryRole.name', 'Content Manager')
            ->where('primaryRole.slug', 'content-manager')
        );
    }

    public function test_custom_dashboard_shows_permissions_in_auth(): void
    {
        // Create a custom role with specific permissions
        $customRole = Role::factory()->create([
            'name' => 'Editor',
            'slug' => 'editor',
        ]);

        // Create permissions
        $pagesViewPermission = Permission::factory()->create([
            'name' => 'View Pages',
            'slug' => 'pages.view',
            'module' => 'pages',
            'action' => 'view',
        ]);
        $pagesCreatePermission = Permission::factory()->create([
            'name' => 'Create Pages',
            'slug' => 'pages.create',
            'module' => 'pages',
            'action' => 'create',
        ]);
        $postsViewPermission = Permission::factory()->create([
            'name' => 'View Posts',
            'slug' => 'posts.view',
            'module' => 'posts',
            'action' => 'view',
        ]);

        $customRole->permissions()->attach([
            $pagesViewPermission->id,
            $pagesCreatePermission->id,
            $postsViewPermission->id,
        ]);

        $user = User::factory()->create();
        $user->roles()->attach($customRole->id);

        $response = $this->actingAs($user)->get(route('custom.dashboard'));

        $response->assertStatus(200);

        // Check that permissions are passed in auth
        $response->assertInertia(fn ($page) => $page
            ->component('Custom/Dashboard')
            ->has('auth.user.permissions')
            ->has('auth.user.permissions.pages')
            ->has('auth.user.permissions.posts')
        );
    }

    public function test_custom_dashboard_user_without_roles_shows_no_primary_role(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('custom.dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Custom/Dashboard')
            ->where('primaryRole', null)
        );
    }

    public function test_custom_pages_route_requires_permission(): void
    {
        $user = User::factory()->create();

        // User without pages.view permission should get 403
        $response = $this->actingAs($user)->get(route('custom.pages.index'));

        $response->assertStatus(403);
    }

    public function test_custom_pages_route_accessible_with_permission(): void
    {
        $customRole = Role::factory()->create([
            'name' => 'Content Manager',
            'slug' => 'content-manager',
        ]);

        $pagesViewPermission = Permission::factory()->create([
            'name' => 'View Pages',
            'slug' => 'pages.view',
            'module' => 'pages',
            'action' => 'view',
        ]);

        $customRole->permissions()->attach($pagesViewPermission->id);

        $user = User::factory()->create();
        $user->roles()->attach($customRole->id);

        $response = $this->actingAs($user)->get(route('custom.pages.index'));

        $response->assertStatus(200);
    }

    public function test_custom_posts_route_requires_permission(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('custom.posts.index'));

        $response->assertStatus(403);
    }

    public function test_custom_posts_route_accessible_with_permission(): void
    {
        $customRole = Role::factory()->create([
            'name' => 'Blogger',
            'slug' => 'blogger',
        ]);

        $postsViewPermission = Permission::factory()->create([
            'name' => 'View Posts',
            'slug' => 'posts.view',
            'module' => 'posts',
            'action' => 'view',
        ]);

        $customRole->permissions()->attach($postsViewPermission->id);

        $user = User::factory()->create();
        $user->roles()->attach($customRole->id);

        $response = $this->actingAs($user)->get(route('custom.posts.index'));

        $response->assertStatus(200);
    }

    public function test_admin_user_can_access_all_custom_routes(): void
    {
        $adminRole = Role::where('slug', 'admin')->first();
        $user = User::factory()->create();
        $user->roles()->attach($adminRole->id);

        // Admin should have access to all routes
        $response = $this->actingAs($user)->get(route('custom.dashboard'));
        $response->assertStatus(200);

        $response = $this->actingAs($user)->get(route('custom.pages.index'));
        $response->assertStatus(200);

        $response = $this->actingAs($user)->get(route('custom.posts.index'));
        $response->assertStatus(200);
    }
}
