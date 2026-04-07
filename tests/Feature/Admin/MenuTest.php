<?php

namespace Tests\Feature\Admin;

use App\Models\Menu;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MenuTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create permissions
        Permission::create([
            'name' => 'View Pages',
            'slug' => 'pages.view',
            'module' => 'pages',
            'action' => 'view',
        ]);

        Permission::create([
            'name' => 'View Users',
            'slug' => 'users.view',
            'module' => 'users',
            'action' => 'view',
        ]);

        Permission::create([
            'name' => 'View Settings',
            'slug' => 'settings.view',
            'module' => 'settings',
            'action' => 'view',
        ]);
    }

    public function test_menu_model_can_be_created(): void
    {
        $menu = Menu::factory()->create([
            'name' => 'Dashboard',
            'slug' => 'dashboard',
            'icon' => 'dashboard',
            'route_name' => 'dashboard',
        ]);

        $this->assertDatabaseHas('menus', [
            'name' => 'Dashboard',
            'slug' => 'dashboard',
        ]);
    }

    public function test_menu_without_permission_is_visible_to_all_users(): void
    {
        $menu = Menu::factory()->create([
            'name' => 'Dashboard',
            'slug' => 'dashboard',
            'permission_module' => null,
        ]);

        $role = Role::factory()->user()->create();
        $user = User::factory()->create();
        $user->roles()->attach($role);

        $this->assertTrue($menu->userHasPermission($user));
    }

    public function test_menu_with_permission_is_visible_to_admin(): void
    {
        $menu = Menu::factory()->withPermission('users')->create([
            'name' => 'Users',
            'slug' => 'users',
        ]);

        $adminRole = Role::factory()->admin()->create();
        $admin = User::factory()->create();
        $admin->roles()->attach($adminRole);

        $this->assertTrue($menu->userHasPermission($admin));
    }

    public function test_menu_with_permission_is_hidden_from_user_without_permission(): void
    {
        $menu = Menu::factory()->withPermission('users')->create([
            'name' => 'Users',
            'slug' => 'users',
        ]);

        $role = Role::factory()->user()->create();
        // Don't attach any permissions to the role
        $user = User::factory()->create();
        $user->roles()->attach($role);

        $this->assertFalse($menu->userHasPermission($user));
    }

    public function test_menu_with_permission_is_visible_to_user_with_permission(): void
    {
        $menu = Menu::factory()->withPermission('pages')->create([
            'name' => 'Pages',
            'slug' => 'pages',
        ]);

        $permission = Permission::where('slug', 'pages.view')->first();
        $role = Role::factory()->user()->create();
        $role->permissions()->attach($permission);

        $user = User::factory()->create();
        $user->roles()->attach($role);

        $this->assertTrue($menu->userHasPermission($user));
    }

    public function test_get_menus_for_user_filters_based_on_permissions(): void
    {
        // Create menus
        Menu::factory()->create([
            'name' => 'Dashboard',
            'slug' => 'dashboard',
            'permission_module' => null,
            'sort_order' => 1,
        ]);

        Menu::factory()->withPermission('pages')->create([
            'name' => 'Pages',
            'slug' => 'pages',
            'sort_order' => 2,
        ]);

        Menu::factory()->withPermission('users')->create([
            'name' => 'Users',
            'slug' => 'users',
            'sort_order' => 3,
        ]);

        // Create user with only pages permission
        $permission = Permission::where('slug', 'pages.view')->first();
        $role = Role::factory()->user()->create();
        $role->permissions()->attach($permission);

        $user = User::factory()->create();
        $user->roles()->attach($role);

        $menus = Menu::getMenusForUser($user, 'admin');

        $this->assertCount(2, $menus);
        $this->assertEquals('Dashboard', $menus[0]['name']);
        $this->assertEquals('Pages', $menus[1]['name']);
    }

    public function test_admin_sees_all_menus(): void
    {
        // Create menus
        Menu::factory()->create([
            'name' => 'Dashboard',
            'slug' => 'dashboard',
            'permission_module' => null,
            'sort_order' => 1,
        ]);

        Menu::factory()->withPermission('pages')->create([
            'name' => 'Pages',
            'slug' => 'pages',
            'sort_order' => 2,
        ]);

        Menu::factory()->withPermission('users')->create([
            'name' => 'Users',
            'slug' => 'users',
            'sort_order' => 3,
        ]);

        Menu::factory()->withPermission('settings')->create([
            'name' => 'Settings',
            'slug' => 'settings',
            'sort_order' => 4,
        ]);

        // Create admin user
        $adminRole = Role::factory()->admin()->create();
        $admin = User::factory()->create();
        $admin->roles()->attach($adminRole);

        $menus = Menu::getMenusForUser($admin, 'admin');

        $this->assertCount(4, $menus);
    }

    public function test_inactive_menus_are_not_returned(): void
    {
        Menu::factory()->create([
            'name' => 'Active Menu',
            'slug' => 'active',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        Menu::factory()->inactive()->create([
            'name' => 'Inactive Menu',
            'slug' => 'inactive',
            'sort_order' => 2,
        ]);

        $adminRole = Role::factory()->admin()->create();
        $admin = User::factory()->create();
        $admin->roles()->attach($adminRole);

        $menus = Menu::getMenusForUser($admin, 'admin');

        $this->assertCount(1, $menus);
        $this->assertEquals('Active Menu', $menus[0]['name']);
    }

    public function test_menus_are_ordered_by_sort_order(): void
    {
        Menu::factory()->create([
            'name' => 'Third',
            'slug' => 'third',
            'sort_order' => 3,
        ]);

        Menu::factory()->create([
            'name' => 'First',
            'slug' => 'first',
            'sort_order' => 1,
        ]);

        Menu::factory()->create([
            'name' => 'Second',
            'slug' => 'second',
            'sort_order' => 2,
        ]);

        $adminRole = Role::factory()->admin()->create();
        $admin = User::factory()->create();
        $admin->roles()->attach($adminRole);

        $menus = Menu::getMenusForUser($admin, 'admin');

        $this->assertEquals('First', $menus[0]['name']);
        $this->assertEquals('Second', $menus[1]['name']);
        $this->assertEquals('Third', $menus[2]['name']);
    }

    public function test_child_menus_are_included(): void
    {
        $parent = Menu::factory()->create([
            'name' => 'Parent',
            'slug' => 'parent',
            'sort_order' => 1,
        ]);

        Menu::factory()->childOf($parent)->create([
            'name' => 'Child 1',
            'slug' => 'child-1',
            'sort_order' => 1,
        ]);

        Menu::factory()->childOf($parent)->create([
            'name' => 'Child 2',
            'slug' => 'child-2',
            'sort_order' => 2,
        ]);

        $adminRole = Role::factory()->admin()->create();
        $admin = User::factory()->create();
        $admin->roles()->attach($adminRole);

        $menus = Menu::getMenusForUser($admin, 'admin');

        $this->assertCount(1, $menus);
        $this->assertEquals('Parent', $menus[0]['name']);
        $this->assertArrayHasKey('children', $menus[0]);
        $this->assertCount(2, $menus[0]['children']);
        $this->assertEquals('Child 1', $menus[0]['children'][0]['name']);
        $this->assertEquals('Child 2', $menus[0]['children'][1]['name']);
    }

    public function test_menus_are_shared_via_inertia(): void
    {
        // Seed menus
        $this->artisan('db:seed', ['--class' => 'MenuSeeder']);

        $adminRole = Role::factory()->admin()->create();
        $admin = User::factory()->create();
        $admin->roles()->attach($adminRole);

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));

        $response->assertInertia(fn ($page) => $page->has('menus'));
    }
}
