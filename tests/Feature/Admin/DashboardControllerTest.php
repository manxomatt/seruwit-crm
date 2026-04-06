<?php

namespace Tests\Feature\Admin;

use App\Models\Carousel;
use App\Models\Media;
use App\Models\Page;
use App\Models\Role;
use App\Models\Todo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Create admin role for tests
        Role::factory()->admin()->create();
    }

    public function test_admin_dashboard_requires_authentication(): void
    {
        $response = $this->get(route('admin.dashboard'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_access_admin_dashboard(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('admin.dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('stats')
            ->has('stats.totalUsers')
            ->has('stats.totalPages')
            ->has('stats.publishedPages')
            ->has('stats.totalMedia')
            ->has('stats.totalCarousels')
            ->has('recentActivity')
            ->has('quickStats')
        );
    }

    public function test_admin_dashboard_returns_correct_stats(): void
    {
        $user = User::factory()->create();
        User::factory()->count(2)->create();
        Page::factory()->count(3)->for($user)->create(['is_published' => true]);
        Page::factory()->for($user)->create(['is_published' => false]);
        Media::factory()->count(2)->for($user)->create();
        Carousel::factory()->count(2)->for($user)->create(['is_active' => true]);
        Carousel::factory()->for($user)->create(['is_active' => false]);

        $response = $this->actingAs($user)->get(route('admin.dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('stats.totalUsers', 3)
            ->where('stats.totalPages', 4)
            ->where('stats.publishedPages', 3)
            ->where('stats.totalMedia', 2)
            ->where('stats.totalCarousels', 3)
            ->where('stats.activeCarousels', 2)
        );
    }

    public function test_admin_dashboard_returns_recent_activity(): void
    {
        $user = User::factory()->create();
        Page::factory()->for($user)->create();
        Media::factory()->for($user)->create();

        $response = $this->actingAs($user)->get(route('admin.dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('recentActivity')
        );
    }

    public function test_admin_dashboard_returns_quick_stats(): void
    {
        $user = User::factory()->create();
        Todo::factory()->count(3)->for($user)->create(['is_completed' => true]);
        Todo::factory()->count(2)->for($user)->create(['is_completed' => false]);
        Page::factory()->count(3)->for($user)->create();

        $response = $this->actingAs($user)->get(route('admin.dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('quickStats.todos.total', 5)
            ->where('quickStats.todos.completed', 3)
            ->where('quickStats.todos.pending', 2)
            ->where('quickStats.todos.completionRate', 60)
            ->has('quickStats.recentPages', 3)
            ->has('quickStats.trends.labels', 7)
            ->has('quickStats.trends.pages', 7)
            ->has('quickStats.trends.users', 7)
        );
    }

    public function test_admin_dashboard_returns_recent_pages(): void
    {
        $user = User::factory()->create();
        Page::factory()->count(3)->for($user)->create(['is_published' => true]);
        Page::factory()->count(2)->for($user)->create(['is_published' => false]);

        $response = $this->actingAs($user)->get(route('admin.dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('quickStats.recentPages', 5)
            ->has('quickStats.recentPages.0', fn ($recentPage) => $recentPage
                ->has('id')
                ->has('title')
                ->has('slug')
                ->has('isPublished')
                ->has('createdAt')
            )
        );
    }

    public function test_admin_dashboard_handles_empty_data(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('admin.dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('stats.totalUsers', 1)
            ->where('stats.totalPages', 0)
            ->where('stats.totalMedia', 0)
            ->where('stats.totalCarousels', 0)
            ->where('quickStats.todos.total', 0)
            ->where('quickStats.todos.completionRate', 0)
            ->has('quickStats.recentPages', 0)
        );
    }

    public function test_admin_dashboard_calculates_growth_rates(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('admin.dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('stats.userGrowth')
            ->has('stats.pageGrowth')
            ->has('stats.mediaGrowth')
        );
    }

    public function test_admin_dashboard_returns_storage_info(): void
    {
        $user = User::factory()->create();
        Media::factory()->for($user)->create(['size' => 1024 * 1024]);
        Media::factory()->for($user)->create(['size' => 2 * 1024 * 1024]);

        $response = $this->actingAs($user)->get(route('admin.dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('stats.totalStorage')
        );
    }

    public function test_admin_dashboard_activity_includes_various_types(): void
    {
        $user = User::factory()->create();
        Page::factory()->for($user)->create();
        Media::factory()->for($user)->create();
        Carousel::factory()->for($user)->create();
        Todo::factory()->for($user)->create();

        $response = $this->actingAs($user)->get(route('admin.dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('recentActivity')
        );

        // Verify activity items have required structure
        $response->assertInertia(fn ($page) => $page
            ->has('recentActivity.0', fn ($activity) => $activity
                ->has('id')
                ->has('type')
                ->has('description')
                ->has('time')
            )
        );
    }
}
