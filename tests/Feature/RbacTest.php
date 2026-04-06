<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RbacTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed permissions and roles for testing
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_admin_role_has_all_permissions(): void
    {
        $adminRole = Role::where('slug', 'admin')->first();
        $allPermissions = Permission::all();

        $this->assertCount($allPermissions->count(), $adminRole->permissions);
    }

    public function test_user_role_has_only_view_permissions(): void
    {
        $userRole = Role::where('slug', 'user')->first();

        foreach ($userRole->permissions as $permission) {
            $this->assertEquals('view', $permission->action);
        }
    }

    public function test_user_can_be_assigned_role(): void
    {
        $user = User::factory()->create();
        $adminRole = Role::where('slug', 'admin')->first();

        $user->roles()->attach($adminRole);

        $this->assertTrue($user->hasRole('admin'));
        $this->assertTrue($user->isAdmin());
    }

    public function test_user_can_have_multiple_roles(): void
    {
        $user = User::factory()->create();
        $adminRole = Role::where('slug', 'admin')->first();
        $userRole = Role::where('slug', 'user')->first();

        $user->roles()->attach([$adminRole->id, $userRole->id]);

        $this->assertTrue($user->hasRole('admin'));
        $this->assertTrue($user->hasRole('user'));
        $this->assertCount(2, $user->roles);
    }

    public function test_user_with_admin_role_can_access_all_routes(): void
    {
        $user = User::factory()->create();
        $adminRole = Role::where('slug', 'admin')->first();
        $user->roles()->attach($adminRole);

        // Test access to pages module
        $response = $this->actingAs($user)->get(route('admin.pages.index'));
        $response->assertOk();

        // Test access to users module
        $response = $this->actingAs($user)->get(route('admin.users.index'));
        $response->assertOk();

        // Test access to roles module
        $response = $this->actingAs($user)->get(route('admin.roles.index'));
        $response->assertOk();
    }

    public function test_user_with_user_role_can_only_view(): void
    {
        $user = User::factory()->create();
        $userRole = Role::where('slug', 'user')->first();
        $user->roles()->attach($userRole);

        // Test view access - should work
        $response = $this->actingAs($user)->get(route('admin.pages.index'));
        $response->assertOk();

        // Test create access - should be forbidden
        $response = $this->actingAs($user)->get(route('admin.pages.create'));
        $response->assertForbidden();
    }

    public function test_user_without_role_cannot_access_protected_routes(): void
    {
        $user = User::factory()->create();

        // User without any role should be forbidden
        $response = $this->actingAs($user)->get(route('admin.pages.index'));
        $response->assertForbidden();
    }

    public function test_custom_role_can_be_created_with_specific_permissions(): void
    {
        $customRole = Role::factory()->create([
            'name' => 'Editor',
            'slug' => 'editor',
            'is_system' => false,
        ]);

        // Assign only pages permissions
        $pagesPermissions = Permission::where('module', 'pages')->get();
        $customRole->permissions()->attach($pagesPermissions->pluck('id'));

        $user = User::factory()->create();
        $user->roles()->attach($customRole);

        // Should have access to pages
        $this->assertTrue($user->hasPermissionFor('pages', 'view'));
        $this->assertTrue($user->hasPermissionFor('pages', 'create'));

        // Should not have access to users
        $this->assertFalse($user->hasPermissionFor('users', 'view'));
    }

    public function test_has_permission_method_works_correctly(): void
    {
        $user = User::factory()->create();
        $adminRole = Role::where('slug', 'admin')->first();
        $user->roles()->attach($adminRole);

        $this->assertTrue($user->hasPermission('pages.view'));
        $this->assertTrue($user->hasPermission('users.delete'));
        $this->assertTrue($user->hasPermission('roles.create'));
    }

    public function test_has_permission_for_method_works_correctly(): void
    {
        $user = User::factory()->create();
        $userRole = Role::where('slug', 'user')->first();
        $user->roles()->attach($userRole);

        $this->assertTrue($user->hasPermissionFor('pages', 'view'));
        $this->assertFalse($user->hasPermissionFor('pages', 'create'));
        $this->assertFalse($user->hasPermissionFor('pages', 'delete'));
    }

    public function test_system_roles_cannot_be_deleted(): void
    {
        $user = User::factory()->create();
        $adminRole = Role::where('slug', 'admin')->first();
        $user->roles()->attach($adminRole);

        $userRole = Role::where('slug', 'user')->first();

        $response = $this->actingAs($user)->delete(route('admin.roles.destroy', $userRole));

        // System roles should not be deletable
        $response->assertRedirect();
        $this->assertDatabaseHas('roles', ['id' => $userRole->id]);
    }

    public function test_custom_roles_can_be_deleted(): void
    {
        $user = User::factory()->create();
        $adminRole = Role::where('slug', 'admin')->first();
        $user->roles()->attach($adminRole);

        $customRole = Role::factory()->create([
            'name' => 'Custom Role',
            'slug' => 'custom-role',
            'is_system' => false,
        ]);

        $response = $this->actingAs($user)->delete(route('admin.roles.destroy', $customRole));

        $response->assertRedirect(route('admin.roles.index'));
        $this->assertDatabaseMissing('roles', ['id' => $customRole->id]);
    }

    public function test_roles_index_page_is_displayed(): void
    {
        $user = User::factory()->create();
        $adminRole = Role::where('slug', 'admin')->first();
        $user->roles()->attach($adminRole);

        $response = $this->actingAs($user)->get(route('admin.roles.index'));

        $response->assertOk();
    }

    public function test_roles_create_page_is_displayed(): void
    {
        $user = User::factory()->create();
        $adminRole = Role::where('slug', 'admin')->first();
        $user->roles()->attach($adminRole);

        $response = $this->actingAs($user)->get(route('admin.roles.create'));

        $response->assertOk();
    }

    public function test_user_can_create_custom_role(): void
    {
        $user = User::factory()->create();
        $adminRole = Role::where('slug', 'admin')->first();
        $user->roles()->attach($adminRole);

        $permissions = Permission::where('module', 'pages')->pluck('id')->toArray();

        $response = $this->actingAs($user)->post(route('admin.roles.store'), [
            'name' => 'Content Manager',
            'slug' => 'content-manager',
            'description' => 'Can manage content',
            'permissions' => $permissions,
        ]);

        $response->assertRedirect(route('admin.roles.index'));

        $this->assertDatabaseHas('roles', [
            'name' => 'Content Manager',
            'slug' => 'content-manager',
            'is_system' => false,
        ]);
    }

    public function test_user_can_update_custom_role(): void
    {
        $user = User::factory()->create();
        $adminRole = Role::where('slug', 'admin')->first();
        $user->roles()->attach($adminRole);

        $customRole = Role::factory()->create([
            'name' => 'Old Name',
            'slug' => 'old-name',
            'is_system' => false,
        ]);

        $response = $this->actingAs($user)->patch(route('admin.roles.update', $customRole), [
            'name' => 'New Name',
            'slug' => 'new-name',
            'description' => 'Updated description',
            'permissions' => [],
        ]);

        $response->assertRedirect(route('admin.roles.index'));

        $this->assertDatabaseHas('roles', [
            'id' => $customRole->id,
            'name' => 'New Name',
            'slug' => 'new-name',
        ]);
    }
}
