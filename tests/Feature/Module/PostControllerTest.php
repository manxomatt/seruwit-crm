<?php

namespace Tests\Feature\Module;

use App\Models\Permission;
use App\Models\Post;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function testUserWithPermissionCanAccessPostsIndex(): void
    {
        $response = $this->actingAs($this->user)
            ->get(route('module.posts.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Module/Posts/Index'));
    }

    public function testUserWithPermissionCanAccessCreatePost(): void
    {
        $response = $this->actingAs($this->user)
            ->get(route('module.posts.create'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Module/Posts/Create'));
    }

    public function testUserWithPermissionCanStorePost(): void
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

    public function testUserCanViewOwnPost(): void
    {
        $post = Post::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->get(route('module.posts.show', $post));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Module/Posts/Show'));
    }

    public function testUserCanEditOwnPost(): void
    {
        $post = Post::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->get(route('module.posts.edit', $post));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Module/Posts/Edit'));
    }

    public function testUserCanUpdateOwnPost(): void
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

    public function testUserCanDeleteOwnPost(): void
    {
        $post = Post::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->delete(route('module.posts.destroy', $post));

        $response->assertRedirect(route('module.posts.index'));
        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }

    public function testUserCanTogglePublishOwnPost(): void
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

    public function testUserCannotEditOtherUsersPost(): void
    {
        $otherUser = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user)
            ->get(route('module.posts.edit', $post));

        $response->assertStatus(403);
    }

    public function testUserCannotUpdateOtherUsersPost(): void
    {
        $otherUser = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user)
            ->patch(route('module.posts.update', $post), [
                'title' => 'Hacked Title',
            ]);

        $response->assertStatus(403);
    }

    public function testUserCannotDeleteOtherUsersPost(): void
    {
        $otherUser = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user)
            ->delete(route('module.posts.destroy', $post));

        $response->assertStatus(403);
    }

    public function testUserWithoutPermissionCannotAccessPosts(): void
    {
        // Create user without any permissions
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('module.posts.index'));

        $response->assertStatus(403);
    }

    public function testAdminUserCanAccessModulePosts(): void
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

    public function testRegularUserWithPermissionCanAccessModulePosts(): void
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
