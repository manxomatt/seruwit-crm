<?php

namespace Tests\Feature\Module;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Posts\Models\Post;
use Tests\TestCase;

class PostControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Role $role;

    protected function setUp(): void
    {
        parent::setUp();

        // Create permissions with correct module and action
        $viewPermission = Permission::factory()->forModuleAction('posts', 'view')->create();
        $createPermission = Permission::factory()->forModuleAction('posts', 'create')->create();
        $updatePermission = Permission::factory()->forModuleAction('posts', 'update')->create();
        $deletePermission = Permission::factory()->forModuleAction('posts', 'delete')->create();

        // Create a custom role with posts permissions
        $this->role = Role::factory()->create([
            'name' => 'Content Editor',
            'slug' => 'content-editor',
            'is_system' => false,
        ]);

        $this->role->permissions()->attach([
            $viewPermission->id,
            $createPermission->id,
            $updatePermission->id,
            $deletePermission->id,
        ]);

        // Create user with the role
        $this->user = User::factory()->create();
        $this->user->roles()->attach($this->role);
    }

    public function test_user_with_permission_can_access_posts_index(): void
    {
        $response = $this->actingAs($this->user)
            ->get(route('module.posts.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Modules/Posts/Index'));
    }

    public function test_user_with_permission_can_access_create_post(): void
    {
        $response = $this->actingAs($this->user)
            ->get(route('module.posts.create'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Modules/Posts/Create'));
    }

    public function test_user_with_permission_can_store_post(): void
    {
        $postData = [
            'title' => 'Test Post',
            'slug' => 'test-post',
            'excerpt' => 'Test excerpt',
            'content' => 'Test content',
            'is_published' => true,
        ];

        $response = $this->actingAs($this->user)
            ->post(route('module.posts.store'), $postData);

        $response->assertRedirect();
        $this->assertDatabaseHas('posts', [
            'title' => 'Test Post',
            'slug' => 'test-post',
            'user_id' => $this->user->id,
        ]);
    }

    public function test_user_can_view_own_post(): void
    {
        $post = Post::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->get(route('module.posts.show', $post));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Modules/Posts/Show'));
    }

    public function test_user_can_edit_own_post(): void
    {
        $post = Post::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->get(route('module.posts.edit', $post));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Modules/Posts/Edit'));
    }

    public function test_user_can_update_own_post(): void
    {
        $post = Post::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->patch(route('module.posts.update', $post), [
                'title' => 'Updated Title',
                'slug' => 'updated-title',
                'content' => 'Updated content',
            ]);

        $response->assertRedirect(route('module.posts.index'));
        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'title' => 'Updated Title',
        ]);
    }

    public function test_user_can_delete_own_post(): void
    {
        $post = Post::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->delete(route('module.posts.destroy', $post));

        $response->assertRedirect(route('module.posts.index'));
        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }

    public function test_user_can_toggle_publish_own_post(): void
    {
        $post = Post::factory()->create([
            'user_id' => $this->user->id,
            'is_published' => false,
        ]);

        $response = $this->actingAs($this->user)
            ->patch(route('module.posts.toggle-publish', $post));

        $response->assertRedirect(route('module.posts.index'));
        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'is_published' => true,
        ]);
    }

    public function test_user_cannot_edit_other_users_post(): void
    {
        $otherUser = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user)
            ->get(route('module.posts.edit', $post));

        $response->assertStatus(403);
    }

    public function test_user_cannot_update_other_users_post(): void
    {
        $otherUser = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user)
            ->patch(route('module.posts.update', $post), [
                'title' => 'Hacked Title',
            ]);

        $response->assertStatus(403);
    }

    public function test_user_cannot_delete_other_users_post(): void
    {
        $otherUser = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user)
            ->delete(route('module.posts.destroy', $post));

        $response->assertStatus(403);
    }

    public function test_user_without_permission_cannot_access_posts(): void
    {
        // Create user without any permissions
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('module.posts.index'));

        $response->assertStatus(403);
    }

    public function test_admin_user_can_access_module_posts(): void
    {
        // Create admin role
        $adminRole = Role::factory()->create([
            'name' => 'Admin',
            'slug' => 'admin',
            'is_system' => true,
        ]);

        $adminUser = User::factory()->create();
        $adminUser->roles()->attach($adminRole);

        $response = $this->actingAs($adminUser)
            ->get(route('module.posts.index'));

        // Admin has all permissions by default
        $response->assertStatus(200);
    }

    public function test_regular_user_with_permission_can_access_module_posts(): void
    {
        // Create user role with posts permissions
        $userRole = Role::factory()->create([
            'name' => 'User',
            'slug' => 'user',
            'is_system' => true,
        ]);

        $viewPermission = Permission::where('module', 'posts')->where('action', 'view')->first();
        $userRole->permissions()->attach($viewPermission);

        $regularUser = User::factory()->create();
        $regularUser->roles()->attach($userRole);

        $response = $this->actingAs($regularUser)
            ->get(route('module.posts.index'));

        $response->assertStatus(200);
    }
}
