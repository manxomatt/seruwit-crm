<?php

namespace Tests\Feature\Modules\Transportation;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripSchedule;
use Modules\TransportationManagement\Support\TransportationStatusBoard;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TransportationDashboardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_transportation_dashboard(): void
    {
        $this->get(route('module.transportation.dashboard'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_transportation_dashboard(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.transportation.dashboard'))->assertForbidden();
    }

    public function test_transportation_dashboard_shows_status_board(): void
    {
        Trip::factory()->create([
            'status' => Trip::STATUS_SCHEDULED,
            'scheduled_at' => now()->addHours(3),
            'scheduled_end_at' => now()->addHours(8),
        ]);

        Trip::factory()->create([
            'status' => Trip::STATUS_SCHEDULED,
            'scheduled_at' => now()->subHours(2),
            'scheduled_end_at' => now()->addHours(2),
        ]);

        Trip::factory()->inProgress()->create([
            'scheduled_at' => now()->subHour(),
        ]);

        Trip::factory()->completed()->create([
            'completed_at' => now(),
            'distance_km' => 120,
        ]);

        TripSchedule::factory()->create(['is_active' => true]);
        TripSchedule::factory()->create(['is_active' => false]);

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.transportation.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/TransportationManagement/Dashboard/Index')
                ->where('board.summary.open_pipeline', 3)
                ->where('board.summary.scheduled', 2)
                ->where('board.summary.in_progress', 1)
                ->where('board.summary.completed_this_month', 1)
                ->where('board.summary.distance_this_month', 120.0)
                ->where('board.dispatch.overdue_count', 1)
                ->where('board.schedules.active', 1)
                ->where('board.schedules.total', 2)
                ->where('board.by_status.completed', 1)
                ->where('board.alerts.attention', 2)
                ->has('board.recent', 3)
                ->where('can.create', true)
            );
    }

    public function test_status_board_counts_overdue_scheduled_trips(): void
    {
        Trip::factory()->create([
            'status' => Trip::STATUS_SCHEDULED,
            'scheduled_at' => now()->addDay(),
            'scheduled_end_at' => now()->addDays(2),
        ]);

        Trip::factory()->create([
            'status' => Trip::STATUS_SCHEDULED,
            'scheduled_at' => now()->subDays(1),
            'scheduled_end_at' => now()->subHours(2),
        ]);

        $board = app(TransportationStatusBoard::class)->build();

        $this->assertSame(2, $board['summary']['open_pipeline']);
        $this->assertSame(1, $board['dispatch']['overdue_count']);
    }

    public function test_trips_index_still_works(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.transportation.trips.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/TransportationManagement/Trips/Index'));
    }
}
