<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_pages_index_is_displayed(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this
            ->actingAs($user)
            ->get('/module/pages');

        $response->assertOk();
    }

    public function test_pages_index_requires_authentication(): void
    {
        $response = $this->get('/module/pages');

        $response->assertRedirect('/login');
    }

    public function test_create_page_form_is_displayed(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this
            ->actingAs($user)
            ->get('/module/pages/create');

        $response->assertOk();
    }

    public function test_user_can_create_a_page(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this
            ->actingAs($user)
            ->post('/module/pages', [
                'title' => 'Test Page',
                'slug' => 'test-page',
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('pages', [
            'title' => 'Test Page',
            'slug' => 'test-page',
            'user_id' => $user->id,
        ]);
    }

    public function test_page_title_is_required(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this
            ->actingAs($user)
            ->post('/module/pages', [
                'title' => '',
                'slug' => 'test-page',
            ]);

        $response->assertSessionHasErrors('title');
    }

    public function test_page_slug_is_required(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this
            ->actingAs($user)
            ->post('/module/pages', [
                'title' => 'Test Page',
                'slug' => '',
            ]);

        $response->assertSessionHasErrors('slug');
    }

    public function test_page_slug_must_be_unique(): void
    {
        $user = User::factory()->admin()->create();
        Page::factory()->create(['user_id' => $user->id, 'slug' => 'existing-slug']);

        $response = $this
            ->actingAs($user)
            ->post('/module/pages', [
                'title' => 'Test Page',
                'slug' => 'existing-slug',
            ]);

        $response->assertSessionHasErrors('slug');
    }

    public function test_user_can_view_own_page_editor(): void
    {
        $user = User::factory()->admin()->create();
        $page = Page::factory()->create(['user_id' => $user->id]);

        $response = $this
            ->actingAs($user)
            ->get("/module/pages/{$page->id}/edit");

        $response->assertOk();
    }

    public function test_user_cannot_view_other_users_page_editor(): void
    {
        $user = User::factory()->admin()->create();
        $otherUser = User::factory()->admin()->create();
        $page = Page::factory()->create(['user_id' => $otherUser->id]);

        $response = $this
            ->actingAs($user)
            ->get("/module/pages/{$page->id}/edit");

        $response->assertForbidden();
    }

    public function test_user_can_update_own_page(): void
    {
        $user = User::factory()->admin()->create();
        $page = Page::factory()->create(['user_id' => $user->id]);

        $response = $this
            ->actingAs($user)
            ->patch("/module/pages/{$page->id}", [
                'title' => 'Updated Title',
                'html' => '<div>Updated Content</div>',
                'css' => '.test { color: red; }',
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'title' => 'Updated Title',
            'html' => '<div>Updated Content</div>',
            'css' => '.test { color: red; }',
        ]);
    }

    public function test_user_cannot_update_other_users_page(): void
    {
        $user = User::factory()->admin()->create();
        $otherUser = User::factory()->admin()->create();
        $page = Page::factory()->create(['user_id' => $otherUser->id]);

        $response = $this
            ->actingAs($user)
            ->patch("/module/pages/{$page->id}", [
                'title' => 'Updated Title',
            ]);

        $response->assertForbidden();
    }

    public function test_user_can_delete_own_page(): void
    {
        $user = User::factory()->admin()->create();
        $page = Page::factory()->create(['user_id' => $user->id]);

        $response = $this
            ->actingAs($user)
            ->delete("/module/pages/{$page->id}");

        $response->assertRedirect('/module/pages');

        $this->assertDatabaseMissing('pages', [
            'id' => $page->id,
        ]);
    }

    public function test_user_cannot_delete_other_users_page(): void
    {
        $user = User::factory()->admin()->create();
        $otherUser = User::factory()->admin()->create();
        $page = Page::factory()->create(['user_id' => $otherUser->id]);

        $response = $this
            ->actingAs($user)
            ->delete("/module/pages/{$page->id}");

        $response->assertForbidden();

        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
        ]);
    }

    public function test_user_can_save_page_content_via_ajax(): void
    {
        $user = User::factory()->admin()->create();
        $page = Page::factory()->create(['user_id' => $user->id]);

        $response = $this
            ->actingAs($user)
            ->patchJson("/module/pages/{$page->id}/save-content", [
                'html' => '<div>New Content</div>',
                'css' => '.new { color: blue; }',
                'gjs_data' => ['components' => [], 'styles' => []],
            ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);

        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'html' => '<div>New Content</div>',
            'css' => '.new { color: blue; }',
        ]);
    }

    public function test_published_page_is_publicly_accessible(): void
    {
        $user = User::factory()->admin()->create();
        $page = Page::factory()->published()->create([
            'user_id' => $user->id,
            'slug' => 'public-page',
            'html' => '<h1>Public Content</h1>',
        ]);

        $response = $this->get('/p/public-page');

        $response->assertOk();
        $response->assertSee('Public Content');
    }

    public function test_unpublished_page_is_not_publicly_accessible(): void
    {
        $user = User::factory()->admin()->create();
        $page = Page::factory()->draft()->create([
            'user_id' => $user->id,
            'slug' => 'draft-page',
        ]);

        $response = $this->get('/p/draft-page');

        $response->assertNotFound();
    }

    public function test_user_can_toggle_page_publish_status(): void
    {
        $user = User::factory()->admin()->create();
        $page = Page::factory()->draft()->create(['user_id' => $user->id]);

        $response = $this
            ->actingAs($user)
            ->patch("/module/pages/{$page->id}", [
                'is_published' => true,
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'is_published' => true,
        ]);
    }

    public function test_user_can_preview_own_draft_page(): void
    {
        $user = User::factory()->admin()->create();
        $page = Page::factory()->draft()->create(['user_id' => $user->id]);

        $response = $this
            ->actingAs($user)
            ->get("/module/pages/{$page->id}");

        $response->assertOk();
    }

    public function test_user_cannot_preview_other_users_draft_page(): void
    {
        $user = User::factory()->admin()->create();
        $otherUser = User::factory()->admin()->create();
        $page = Page::factory()->draft()->create(['user_id' => $otherUser->id]);

        $response = $this
            ->actingAs($user)
            ->get("/module/pages/{$page->id}");

        $response->assertForbidden();
    }

    public function test_pages_are_ordered_by_latest(): void
    {
        $user = User::factory()->admin()->create();

        $olderPage = Page::factory()->create([
            'user_id' => $user->id,
            'title' => 'Older Page',
            'created_at' => now()->subDays(2),
        ]);

        $newerPage = Page::factory()->create([
            'user_id' => $user->id,
            'title' => 'Newer Page',
            'created_at' => now()->subDay(),
        ]);

        $response = $this
            ->actingAs($user)
            ->get('/module/pages');

        $response->assertOk();
        $response->assertSeeInOrder(['Newer Page', 'Older Page']);
    }
}
