<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Posts\Models\Post;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PostControllerTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpRoles();
    }

    public function test_posts_index_page_is_displayed(): void
    {
        $user = $this->createAdminUser();

        $response = $this
            ->actingAs($user)
            ->get(route('module.posts.index'));

        $response->assertOk();
    }

    public function test_posts_create_page_is_displayed(): void
    {
        $user = $this->createAdminUser();

        $response = $this
            ->actingAs($user)
            ->get(route('module.posts.create'));

        $response->assertOk();
    }

    public function test_user_can_create_post(): void
    {
        $user = $this->createAdminUser();

        $response = $this
            ->actingAs($user)
            ->post(route('module.posts.store'), [
                'title' => 'Test Post',
                'slug' => 'test-post',
                'excerpt' => 'This is a test excerpt',
                'content' => 'This is the test content',
                'is_published' => false,
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('posts', [
            'title' => 'Test Post',
            'slug' => 'test-post',
            'user_id' => $user->id,
        ]);
    }

    public function test_user_can_view_own_post(): void
    {
        $user = $this->createAdminUser();
        $post = Post::factory()->for($user)->create();

        $response = $this
            ->actingAs($user)
            ->get(route('module.posts.show', $post));

        $response->assertOk();
    }

    public function test_user_can_edit_own_post(): void
    {
        $user = $this->createAdminUser();
        $post = Post::factory()->for($user)->create();

        $response = $this
            ->actingAs($user)
            ->get(route('module.posts.edit', $post));

        $response->assertOk();
    }

    public function test_user_can_update_own_post(): void
    {
        $user = $this->createAdminUser();
        $post = Post::factory()->for($user)->create();

        $response = $this
            ->actingAs($user)
            ->patch(route('module.posts.update', $post), [
                'title' => 'Updated Title',
                'slug' => 'updated-slug',
            ]);

        $response->assertRedirect(route('module.posts.index'));

        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'title' => 'Updated Title',
            'slug' => 'updated-slug',
        ]);
    }

    public function test_user_can_delete_own_post(): void
    {
        $user = $this->createAdminUser();
        $post = Post::factory()->for($user)->create();

        $response = $this
            ->actingAs($user)
            ->delete(route('module.posts.destroy', $post));

        $response->assertRedirect(route('module.posts.index'));

        $this->assertDatabaseMissing('posts', [
            'id' => $post->id,
        ]);
    }

    public function test_user_can_toggle_publish_status(): void
    {
        $user = $this->createAdminUser();
        $post = Post::factory()->for($user)->draft()->create();

        $this->assertFalse($post->is_published);

        $response = $this
            ->actingAs($user)
            ->patch(route('module.posts.toggle-publish', $post));

        $response->assertRedirect(route('module.posts.index'));

        $post->refresh();
        $this->assertTrue($post->is_published);
        $this->assertNotNull($post->published_at);
    }

    public function test_user_cannot_edit_other_users_post(): void
    {
        $user = $this->createAdminUser();
        $otherUser = $this->createAdminUser();
        $post = Post::factory()->for($otherUser)->create();

        $response = $this
            ->actingAs($user)
            ->get(route('module.posts.edit', $post));

        $response->assertForbidden();
    }

    public function test_user_cannot_delete_other_users_post(): void
    {
        $user = $this->createAdminUser();
        $otherUser = $this->createAdminUser();
        $post = Post::factory()->for($otherUser)->create();

        $response = $this
            ->actingAs($user)
            ->delete(route('module.posts.destroy', $post));

        $response->assertForbidden();

        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
        ]);
    }

    public function test_guest_cannot_access_posts(): void
    {
        $response = $this->get(route('module.posts.index'));

        $response->assertRedirect(route('login'));
    }
}
