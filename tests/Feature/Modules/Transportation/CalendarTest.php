<?php

namespace Tests\Feature\Modules\Transportation;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\TransportationManagement\Models\Trip;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class CalendarTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_the_calendar(): void
    {
        $this->get(route('module.transportation.calendar.index'))->assertRedirect(route('login'));
    }

    public function test_it_defaults_to_month_view_for_the_current_date(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.transportation.calendar.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Modules/TransportationManagement/Calendar/Index')
                ->where('view', 'month')
                ->where('date', now()->toDateString())
            );
    }

    public function test_month_view_only_returns_trips_within_the_requested_month(): void
    {
        $user = $this->createAdminUser();
        $inMonth = Trip::factory()->create(['scheduled_at' => Carbon::parse('2026-03-15 10:00:00')]);
        Trip::factory()->create(['scheduled_at' => Carbon::parse('2026-02-28 10:00:00')]);
        Trip::factory()->create(['scheduled_at' => Carbon::parse('2026-04-01 10:00:00')]);

        $response = $this->actingAs($user)->get(route('module.transportation.calendar.index', [
            'view' => 'month',
            'date' => '2026-03-10',
        ]));

        $response->assertInertia(fn (Assert $page) => $page
            ->where('view', 'month')
            ->where('date', '2026-03-10')
            ->has('tripsByDate.2026-03-15.0', fn (Assert $trip) => $trip
                ->where('id', $inMonth->id)
                ->etc()
            )
            ->missing('tripsByDate.2026-02-28')
            ->missing('tripsByDate.2026-04-01')
        );
    }

    public function test_week_view_only_returns_trips_within_the_requested_week(): void
    {
        $user = $this->createAdminUser();
        // Sunday 2026-03-08 through Saturday 2026-03-14.
        $inWeek = Trip::factory()->create(['scheduled_at' => Carbon::parse('2026-03-10 09:00:00')]);
        Trip::factory()->create(['scheduled_at' => Carbon::parse('2026-03-07 09:00:00')]);
        Trip::factory()->create(['scheduled_at' => Carbon::parse('2026-03-15 09:00:00')]);

        $response = $this->actingAs($user)->get(route('module.transportation.calendar.index', [
            'view' => 'week',
            'date' => '2026-03-10',
        ]));

        $response->assertInertia(fn (Assert $page) => $page
            ->where('view', 'week')
            ->has('tripsByDate.2026-03-10.0', fn (Assert $trip) => $trip
                ->where('id', $inWeek->id)
                ->etc()
            )
            ->missing('tripsByDate.2026-03-07')
            ->missing('tripsByDate.2026-03-15')
        );
    }

    public function test_year_view_only_returns_trips_within_the_requested_year(): void
    {
        $user = $this->createAdminUser();
        $inYear = Trip::factory()->create(['scheduled_at' => Carbon::parse('2026-06-15 09:00:00')]);
        Trip::factory()->create(['scheduled_at' => Carbon::parse('2025-12-31 09:00:00')]);
        Trip::factory()->create(['scheduled_at' => Carbon::parse('2027-01-01 09:00:00')]);

        $response = $this->actingAs($user)->get(route('module.transportation.calendar.index', [
            'view' => 'year',
            'date' => '2026-06-15',
        ]));

        $response->assertInertia(fn (Assert $page) => $page
            ->where('view', 'year')
            ->has('tripsByDate.2026-06-15.0', fn (Assert $trip) => $trip
                ->where('id', $inYear->id)
                ->etc()
            )
            ->missing('tripsByDate.2025-12-31')
            ->missing('tripsByDate.2027-01-01')
        );
    }

    public function test_an_invalid_view_falls_back_to_month(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.transportation.calendar.index', ['view' => 'day']))
            ->assertInertia(fn (Assert $page) => $page->where('view', 'month'));
    }
}
