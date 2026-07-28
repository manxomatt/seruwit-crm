<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalAvailabilityTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_availability_board_lists_free_and_booked_vehicles(): void
    {
        $free = Vehicle::factory()->create(['name' => 'Free Car', 'status' => Vehicle::STATUS_ACTIVE]);
        $bookedVehicle = Vehicle::factory()->create(['name' => 'Booked Car', 'status' => Vehicle::STATUS_ACTIVE]);

        Rental::factory()->confirmed()->create([
            'vehicle_id' => $bookedVehicle->id,
            'start_date' => '2027-06-01',
            'end_date' => '2027-06-10',
        ]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.availability.index', [
                'from' => '2027-06-01',
                'to' => '2027-06-14',
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Availability/Index')
                ->where('filters.from', '2027-06-01')
                ->where('filters.to', '2027-06-14')
                ->where('board.counts.total', 2)
                ->where('board.counts.free', 1)
                ->where('board.counts.booked', 1)
                ->has('board.vehicles', 2)
                ->where('board.vehicles', fn ($vehicles) => collect($vehicles)->contains(
                    fn ($row) => $row['id'] === $free->id && $row['availability'] === 'free'
                ) && collect($vehicles)->contains(
                    fn ($row) => $row['id'] === $bookedVehicle->id
                        && $row['availability'] === 'booked'
                        && count($row['bookings']) === 1
                )));
    }

    public function test_guests_are_redirected_from_availability(): void
    {
        $this->get(route('module.rental.availability.index'))
            ->assertRedirect(route('login'));
    }
}
