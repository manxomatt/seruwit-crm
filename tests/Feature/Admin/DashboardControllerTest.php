<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase;

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
            ->has('stats.totalViews')
            ->has('stats.revenue')
            ->has('recentActivity')
        );
    }

    public function test_admin_dashboard_returns_correct_stats_structure(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('admin.dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('stats.totalUsers', 1250)
            ->where('stats.totalPages', 48)
            ->where('stats.totalViews', 125000)
            ->where('stats.revenue', 52400)
        );
    }

    public function test_admin_dashboard_returns_recent_activity(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('admin.dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('recentActivity', 4)
            ->has('recentActivity.0', fn ($activity) => $activity
                ->has('id')
                ->has('type')
                ->has('description')
                ->has('time')
            )
        );
    }
}
