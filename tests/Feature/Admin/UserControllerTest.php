<?php

namespace Tests\Feature\Admin;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Create admin role for tests
        Role::factory()->admin()->create();
    }

    public function test_users_index_requires_authentication(): void
    {
        $response = $this->get(route('admin.users.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_access_users_index(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get(route('admin.users.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Users/Index')
            ->has('users')
            ->has('filters')
        );
    }

    public function test_users_index_shows_all_users(): void
    {
        $user = User::factory()->admin()->create(['name' => 'Admin User']);
        User::factory()->create(['name' => 'Test User 1']);
        User::factory()->create(['name' => 'Test User 2']);

        $response = $this->actingAs($user)->get(route('admin.users.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Users/Index')
            ->has('users.data', 3)
        );
    }

    public function test_users_index_can_search_by_name(): void
    {
        $user = User::factory()->admin()->create(['name' => 'Admin User']);
        User::factory()->create(['name' => 'John Doe']);
        User::factory()->create(['name' => 'Jane Smith']);

        $response = $this->actingAs($user)->get(route('admin.users.index', ['search' => 'John']));

        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Users/Index')
            ->has('users.data', 1)
            ->where('users.data.0.name', 'John Doe')
        );
    }

    public function test_users_index_can_search_by_email(): void
    {
        $user = User::factory()->admin()->create(['email' => 'admin@example.com']);
        User::factory()->create(['email' => 'john@test.com']);
        User::factory()->create(['email' => 'jane@example.com']);

        $response = $this->actingAs($user)->get(route('admin.users.index', ['search' => 'test.com']));

        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Users/Index')
            ->has('users.data', 1)
            ->where('users.data.0.email', 'john@test.com')
        );
    }

    public function test_authenticated_user_can_access_create_user(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get(route('admin.users.create'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Users/Create')
        );
    }

    public function test_authenticated_user_can_store_user(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->post(route('admin.users.store'), [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect(route('admin.users.index'));
        $this->assertDatabaseHas('users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
        ]);

        $newUser = User::where('email', 'newuser@example.com')->first();
        $this->assertTrue(Hash::check('password123', $newUser->password));
    }

    public function test_store_user_validates_required_fields(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->post(route('admin.users.store'), []);

        $response->assertSessionHasErrors(['name', 'email', 'password']);
    }

    public function test_store_user_validates_unique_email(): void
    {
        $user = User::factory()->admin()->create();
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->actingAs($user)->post(route('admin.users.store'), [
            'name' => 'Test User',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertSessionHasErrors(['email']);
    }

    public function test_store_user_validates_password_confirmation(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->post(route('admin.users.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'differentpassword',
        ]);

        $response->assertSessionHasErrors(['password']);
    }

    public function test_authenticated_user_can_view_user(): void
    {
        $user = User::factory()->admin()->create();
        $targetUser = User::factory()->create(['name' => 'Target User']);

        $response = $this->actingAs($user)->get(route('admin.users.show', $targetUser));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Users/Show')
            ->has('user')
            ->where('user.id', $targetUser->id)
            ->where('user.name', 'Target User')
        );
    }

    public function test_authenticated_user_can_edit_user(): void
    {
        $user = User::factory()->admin()->create();
        $targetUser = User::factory()->create(['name' => 'Target User']);

        $response = $this->actingAs($user)->get(route('admin.users.edit', $targetUser));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Users/Edit')
            ->has('user')
            ->where('user.id', $targetUser->id)
        );
    }

    public function test_authenticated_user_can_update_user(): void
    {
        $user = User::factory()->admin()->create();
        $targetUser = User::factory()->create();

        $response = $this->actingAs($user)->patch(route('admin.users.update', $targetUser), [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
        ]);

        $response->assertRedirect(route('admin.users.index'));
        $this->assertDatabaseHas('users', [
            'id' => $targetUser->id,
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
        ]);
    }

    public function test_update_user_can_change_password(): void
    {
        $user = User::factory()->admin()->create();
        $targetUser = User::factory()->create();

        $response = $this->actingAs($user)->patch(route('admin.users.update', $targetUser), [
            'name' => $targetUser->name,
            'email' => $targetUser->email,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertRedirect(route('admin.users.index'));
        $targetUser->refresh();
        $this->assertTrue(Hash::check('newpassword123', $targetUser->password));
    }

    public function test_update_user_without_password_keeps_existing_password(): void
    {
        $user = User::factory()->admin()->create();
        $targetUser = User::factory()->create([
            'password' => Hash::make('originalpassword'),
        ]);

        $response = $this->actingAs($user)->patch(route('admin.users.update', $targetUser), [
            'name' => 'Updated Name',
            'email' => $targetUser->email,
        ]);

        $response->assertRedirect(route('admin.users.index'));
        $targetUser->refresh();
        $this->assertTrue(Hash::check('originalpassword', $targetUser->password));
    }

    public function test_update_user_validates_unique_email_except_self(): void
    {
        $user = User::factory()->admin()->create();
        $targetUser = User::factory()->create(['email' => 'target@example.com']);
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->actingAs($user)->patch(route('admin.users.update', $targetUser), [
            'name' => 'Updated Name',
            'email' => 'existing@example.com',
        ]);

        $response->assertSessionHasErrors(['email']);
    }

    public function test_update_user_allows_same_email(): void
    {
        $user = User::factory()->admin()->create();
        $targetUser = User::factory()->create(['email' => 'target@example.com']);

        $response = $this->actingAs($user)->patch(route('admin.users.update', $targetUser), [
            'name' => 'Updated Name',
            'email' => 'target@example.com',
        ]);

        $response->assertRedirect(route('admin.users.index'));
        $this->assertDatabaseHas('users', [
            'id' => $targetUser->id,
            'name' => 'Updated Name',
            'email' => 'target@example.com',
        ]);
    }

    public function test_authenticated_user_can_delete_user(): void
    {
        $user = User::factory()->admin()->create();
        $targetUser = User::factory()->create();

        $response = $this->actingAs($user)->delete(route('admin.users.destroy', $targetUser));

        $response->assertRedirect(route('admin.users.index'));
        $this->assertDatabaseMissing('users', ['id' => $targetUser->id]);
    }

    public function test_users_index_is_paginated(): void
    {
        $user = User::factory()->admin()->create();
        User::factory()->count(20)->create();

        $response = $this->actingAs($user)->get(route('admin.users.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Users/Index')
            ->has('users.data', 15)
            ->has('users.links')
            ->where('users.total', 21)
        );
    }
}
