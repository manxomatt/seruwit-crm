<?php

namespace Tests\Feature\Admin;

use App\Models\Carousel;
use App\Models\CarouselImage;
use App\Models\Media;
use App\Models\Page;
use App\Models\Role;
use App\Models\Todo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnalyticsControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Create admin role for tests
        Role::factory()->admin()->create();
    }

    public function test_analytics_page_requires_authentication(): void
    {
        $response = $this->get(route('admin.analytics.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_access_analytics_page(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get(route('admin.analytics.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Analytics/Index')
            ->has('overview')
            ->has('contentStats')
            ->has('mediaStats')
            ->has('userStats')
            ->has('recentActivity')
            ->has('trendsData')
        );
    }

    public function test_analytics_returns_correct_overview_stats(): void
    {
        $user = User::factory()->admin()->create();
        User::factory()->count(3)->create();
        Page::factory()->count(2)->for($user)->create(['is_published' => true]);
        Page::factory()->for($user)->create(['is_published' => false]);
        Media::factory()->count(2)->for($user)->create();
        Carousel::factory()->for($user)->create();
        Todo::factory()->count(3)->for($user)->create(['is_completed' => false]);
        Todo::factory()->for($user)->create(['is_completed' => true]);

        $response = $this->actingAs($user)->get(route('admin.analytics.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Analytics/Index')
            ->where('overview.totalUsers', 4)
            ->where('overview.totalPages', 3)
            ->where('overview.publishedPages', 2)
            ->where('overview.totalMedia', 2)
            ->where('overview.totalCarousels', 1)
            ->where('overview.totalTodos', 4)
            ->where('overview.completedTodos', 1)
        );
    }

    public function test_analytics_returns_correct_content_stats(): void
    {
        $user = User::factory()->admin()->create();
        Page::factory()->count(2)->for($user)->create(['is_published' => true]);
        Page::factory()->for($user)->create(['is_published' => false]);
        Page::factory()->for($user)->create(['is_published' => true, 'is_homepage' => true]);

        Carousel::factory()->count(2)->for($user)->create(['is_active' => true]);
        Carousel::factory()->for($user)->create(['is_active' => false]);

        Todo::factory()->count(2)->for($user)->create(['is_completed' => true]);
        Todo::factory()->count(3)->for($user)->create(['is_completed' => false]);

        $response = $this->actingAs($user)->get(route('admin.analytics.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Analytics/Index')
            ->where('contentStats.pages.published', 3)
            ->where('contentStats.pages.draft', 1)
            ->where('contentStats.pages.total', 4)
            ->where('contentStats.pages.hasHomepage', true)
            ->where('contentStats.carousels.active', 2)
            ->where('contentStats.carousels.inactive', 1)
            ->where('contentStats.carousels.total', 3)
            ->where('contentStats.todos.completed', 2)
            ->where('contentStats.todos.pending', 3)
            ->where('contentStats.todos.total', 5)
            ->where('contentStats.todos.completionRate', 40)
        );
    }

    public function test_analytics_returns_correct_media_stats(): void
    {
        $user = User::factory()->admin()->create();
        Media::factory()->for($user)->create([
            'type' => 'image',
            'size' => 1024 * 1024,
        ]);
        Media::factory()->for($user)->create([
            'type' => 'image',
            'size' => 2 * 1024 * 1024,
        ]);
        Media::factory()->for($user)->create([
            'type' => 'document',
            'size' => 512 * 1024,
        ]);

        $response = $this->actingAs($user)->get(route('admin.analytics.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Analytics/Index')
            ->where('mediaStats.totalFiles', 3)
            ->has('mediaStats.byType')
            ->has('mediaStats.humanStorageUsed')
            ->has('mediaStats.recentUploads')
        );
    }

    public function test_analytics_returns_correct_user_stats(): void
    {
        $user = User::factory()->admin()->create(['email_verified_at' => now()]);
        User::factory()->count(2)->create(['email_verified_at' => now()]);
        User::factory()->create(['email_verified_at' => null]);

        $response = $this->actingAs($user)->get(route('admin.analytics.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Analytics/Index')
            ->where('userStats.total', 4)
            ->where('userStats.verified', 3)
            ->where('userStats.unverified', 1)
            ->has('userStats.topContributors')
            ->has('userStats.recentUsers')
            ->has('userStats.growthRate')
        );
    }

    public function test_analytics_returns_recent_activity(): void
    {
        $user = User::factory()->admin()->create();
        Page::factory()->for($user)->create();
        Media::factory()->for($user)->create();
        Carousel::factory()->for($user)->create();

        $response = $this->actingAs($user)->get(route('admin.analytics.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Analytics/Index')
            ->has('recentActivity')
        );
    }

    public function test_analytics_returns_trends_data(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get(route('admin.analytics.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Analytics/Index')
            ->has('trendsData.labels', 7)
            ->has('trendsData.pages', 7)
            ->has('trendsData.users', 7)
            ->has('trendsData.media', 7)
        );
    }

    public function test_analytics_top_contributors_shows_users_with_most_content(): void
    {
        $user1 = User::factory()->admin()->create();
        $user2 = User::factory()->create();

        Page::factory()->count(5)->for($user1)->create();
        Page::factory()->count(2)->for($user2)->create();

        Media::factory()->count(3)->for($user1)->create();
        Media::factory()->for($user2)->create();

        $response = $this->actingAs($user1)->get(route('admin.analytics.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Analytics/Index')
            ->has('userStats.topContributors')
            ->where('userStats.topContributors.0.pagesCount', 5)
            ->where('userStats.topContributors.0.mediaCount', 3)
        );
    }

    public function test_analytics_handles_empty_data_gracefully(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get(route('admin.analytics.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Analytics/Index')
            ->where('overview.totalPages', 0)
            ->where('overview.totalMedia', 0)
            ->where('overview.totalCarousels', 0)
            ->where('contentStats.todos.completionRate', 0)
        );
    }

    public function test_analytics_carousel_images_count_is_correct(): void
    {
        $user = User::factory()->admin()->create();
        $carousel = Carousel::factory()->for($user)->create();
        CarouselImage::factory()->count(3)->for($carousel)->create();

        $response = $this->actingAs($user)->get(route('admin.analytics.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Analytics/Index')
            ->where('contentStats.carousels.totalImages', 3)
        );
    }
}
