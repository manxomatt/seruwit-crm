<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalCalendarTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_calendar(): void
    {
        $this->get(route('module.rental.calendar.index'))->assertRedirect(route('login'));
    }

    public function test_defaults_to_week_view_for_current_date(): void
    {
        Carbon::setTestNow('2026-08-07');

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.calendar.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Calendar/Index')
                ->where('board.view', 'week')
                ->where('board.date', '2026-08-07')
                ->where('board.from', '2026-08-03')
                ->where('board.to', '2026-08-09')
                ->has('board.dates', 7)
                ->has('board.counts')
                ->has('board.utilisation_by_date')
                ->has('board.vehicles')
            );
    }

    public function test_week_cells_map_status_priority_per_day(): void
    {
        $free = Vehicle::factory()->create(['name' => 'Free Car', 'status' => Vehicle::STATUS_ACTIVE]);
        $booked = Vehicle::factory()->create(['name' => 'Booked Car', 'status' => Vehicle::STATUS_ACTIVE]);
        $active = Vehicle::factory()->create(['name' => 'Active Car', 'status' => Vehicle::STATUS_ACTIVE]);
        $down = Vehicle::factory()->create(['name' => 'Down Car', 'status' => Vehicle::STATUS_MAINTENANCE]);

        Rental::factory()->confirmed()->create([
            'vehicle_id' => $booked->id,
            'start_date' => '2026-08-05',
            'end_date' => '2026-08-07',
        ]);

        Rental::factory()->active()->create([
            'vehicle_id' => $active->id,
            'start_date' => '2026-08-04',
            'end_date' => '2026-08-08',
        ]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.calendar.index', [
                'view' => 'week',
                'date' => '2026-08-07',
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Calendar/Index')
                ->where('board.counts.total', 4)
                ->where('board.counts.free', 1)
                ->where('board.counts.booked', 1)
                ->where('board.counts.in_use', 1)
                ->where('board.counts.unavailable', 1)
                ->where('board.vehicles', fn ($vehicles) => collect($vehicles)->contains(
                    fn ($row) => $row['id'] === $free->id
                        && $row['cells']['2026-08-07']['status'] === 'free'
                ) && collect($vehicles)->contains(
                    fn ($row) => $row['id'] === $booked->id
                        && $row['cells']['2026-08-07']['status'] === 'booked'
                        && count($row['cells']['2026-08-07']['bookings']) === 1
                ) && collect($vehicles)->contains(
                    fn ($row) => $row['id'] === $active->id
                        && $row['cells']['2026-08-07']['status'] === 'in_use'
                ) && collect($vehicles)->contains(
                    fn ($row) => $row['id'] === $down->id
                        && $row['cells']['2026-08-07']['status'] === 'unavailable'
                ))
            );
    }

    public function test_year_view_omits_vehicle_cells_but_keeps_utilisation(): void
    {
        Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        Rental::factory()->active()->create([
            'start_date' => '2026-03-10',
            'end_date' => '2026-03-12',
        ]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.calendar.index', [
                'view' => 'year',
                'date' => '2026-08-01',
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Calendar/Index')
                ->where('board.view', 'year')
                ->where('board.from', '2026-01-01')
                ->where('board.to', '2026-12-31')
                ->where('board.vehicles', [])
                ->has('board.utilisation_by_date.2026-03-11')
                ->where('board.utilisation_by_date.2026-03-11.in_use', 1)
            );
    }

    public function test_quarter_view_spans_three_months(): void
    {
        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.calendar.index', [
                'view' => 'quarter',
                'date' => '2026-08-15',
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('board.view', 'quarter')
                ->where('board.from', '2026-08-01')
                ->where('board.to', '2026-10-31')
            );
    }

    public function test_invalid_view_falls_back_to_week(): void
    {
        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.calendar.index', [
                'view' => 'not-a-view',
                'date' => '2026-08-07',
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('board.view', 'week'));
    }

    public function test_create_page_accepts_calendar_date_prefill(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.create', [
                'vehicle_id' => $vehicle->id,
                'start_date' => '2026-08-12',
                'end_date' => '2026-08-12',
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Create')
                ->where('prefill.vehicle_id', $vehicle->id)
                ->where('prefill.start_date', '2026-08-12')
                ->where('prefill.end_date', '2026-08-12')
            );
    }
}
