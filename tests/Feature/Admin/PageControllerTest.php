<?php

namespace Tests\Feature\Admin;

use App\Models\Page;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PageControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_pages_index_requires_authentication(): void
    {
        $response = $this->get(route('admin.pages.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_access_pages_index(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('admin.pages.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Pages/Index')
            ->has('pages')
        );
    }

    public function test_pages_index_shows_only_user_pages(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $userPage = Page::factory()->for($user)->create(['title' => 'My Page']);
        Page::factory()->for($otherUser)->create(['title' => 'Other Page']);

        $response = $this->actingAs($user)->get(route('admin.pages.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Pages/Index')
            ->has('pages', 1)
            ->where('pages.0.title', 'My Page')
        );
    }

    public function test_authenticated_user_can_access_create_page(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('admin.pages.create'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Pages/Create')
        );
    }

    public function test_authenticated_user_can_store_page(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('admin.pages.store'), [
            'title' => 'Test Page',
            'slug' => 'test-page',
        ]);

        $this->assertDatabaseHas('pages', [
            'title' => 'Test Page',
            'slug' => 'test-page',
            'user_id' => $user->id,
        ]);

        $page = Page::where('slug', 'test-page')->first();
        $response->assertRedirect(route('admin.pages.edit', $page));
    }

    public function test_authenticated_user_can_view_own_page(): void
    {
        $user = User::factory()->create();
        $page = Page::factory()->for($user)->create();

        $response = $this->actingAs($user)->get(route('admin.pages.show', $page));

        $response->assertStatus(200);
        $response->assertInertia(fn ($inertiaPage) => $inertiaPage
            ->component('Admin/Pages/Show')
            ->has('page')
            ->where('page.id', $page->id)
        );
    }

    public function test_authenticated_user_cannot_view_unpublished_page_of_other_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $page = Page::factory()->for($otherUser)->draft()->create();

        $response = $this->actingAs($user)->get(route('admin.pages.show', $page));

        $response->assertStatus(403);
    }

    public function test_authenticated_user_can_edit_own_page(): void
    {
        $user = User::factory()->create();
        $page = Page::factory()->for($user)->create();

        $response = $this->actingAs($user)->get(route('admin.pages.edit', $page));

        $response->assertStatus(200);
        $response->assertInertia(fn ($inertiaPage) => $inertiaPage
            ->component('Admin/Pages/Editor')
            ->has('page')
            ->where('page.id', $page->id)
        );
    }

    public function test_authenticated_user_cannot_edit_page_of_other_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $page = Page::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->get(route('admin.pages.edit', $page));

        $response->assertStatus(403);
    }

    public function test_authenticated_user_can_update_own_page(): void
    {
        $user = User::factory()->create();
        $page = Page::factory()->for($user)->create();

        $response = $this->actingAs($user)->patch(route('admin.pages.update', $page), [
            'title' => 'Updated Title',
            'slug' => 'updated-slug',
        ]);

        $response->assertRedirect(route('admin.pages.edit', $page));
        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'title' => 'Updated Title',
            'slug' => 'updated-slug',
        ]);
    }

    public function test_authenticated_user_can_delete_own_page(): void
    {
        $user = User::factory()->create();
        $page = Page::factory()->for($user)->create();

        $response = $this->actingAs($user)->delete(route('admin.pages.destroy', $page));

        $response->assertRedirect(route('admin.pages.index'));
        $this->assertDatabaseMissing('pages', ['id' => $page->id]);
    }

    public function test_authenticated_user_cannot_delete_page_of_other_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $page = Page::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->delete(route('admin.pages.destroy', $page));

        $response->assertStatus(403);
        $this->assertDatabaseHas('pages', ['id' => $page->id]);
    }

    public function test_authenticated_user_can_set_page_as_homepage(): void
    {
        $user = User::factory()->create();
        $page = Page::factory()->for($user)->draft()->create(['is_homepage' => false]);

        $response = $this->actingAs($user)->patch(route('admin.pages.set-homepage', $page));

        $response->assertRedirect(route('admin.pages.index'));
        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'is_homepage' => true,
            'is_published' => true,
        ]);
    }

    public function test_setting_homepage_removes_previous_homepage(): void
    {
        $user = User::factory()->create();
        $oldHomepage = Page::factory()->for($user)->create(['is_homepage' => true]);
        $newHomepage = Page::factory()->for($user)->create(['is_homepage' => false]);

        $this->actingAs($user)->patch(route('admin.pages.set-homepage', $newHomepage));

        $this->assertDatabaseHas('pages', [
            'id' => $oldHomepage->id,
            'is_homepage' => false,
        ]);
        $this->assertDatabaseHas('pages', [
            'id' => $newHomepage->id,
            'is_homepage' => true,
        ]);
    }

    public function test_authenticated_user_can_save_page_content(): void
    {
        $user = User::factory()->create();
        $page = Page::factory()->for($user)->create();

        $response = $this->actingAs($user)->patchJson(route('admin.pages.save-content', $page), [
            'html' => '<div>New Content</div>',
            'css' => '.new { color: red; }',
            'gjs_data' => ['test' => 'data'],
        ]);

        $response->assertJson(['success' => true]);
        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'html' => '<div>New Content</div>',
            'css' => '.new { color: red; }',
        ]);
    }
}
