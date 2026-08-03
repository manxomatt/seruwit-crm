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

    public function test_availability_board_maps_rental_status_to_availability(): void
    {
        $free = Vehicle::factory()->create(['name' => 'Free Car', 'status' => Vehicle::STATUS_ACTIVE]);
        $draftVehicle = Vehicle::factory()->create(['name' => 'Draft Car', 'status' => Vehicle::STATUS_ACTIVE]);
        $bookedVehicle = Vehicle::factory()->create(['name' => 'Booked Car', 'status' => Vehicle::STATUS_ACTIVE]);
        $activeVehicle = Vehicle::factory()->create(['name' => 'Active Car', 'status' => Vehicle::STATUS_ACTIVE]);

        Rental::factory()->create([
            'vehicle_id' => $draftVehicle->id,
            'status' => Rental::STATUS_DRAFT,
            'start_date' => '2027-06-01',
            'end_date' => '2027-06-10',
        ]);

        Rental::factory()->confirmed()->create([
            'vehicle_id' => $bookedVehicle->id,
            'start_date' => '2027-06-01',
            'end_date' => '2027-06-10',
        ]);

        Rental::factory()->active()->create([
            'vehicle_id' => $activeVehicle->id,
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
                ->where('board.counts.total', 4)
                ->where('board.counts.free', 2)
                ->where('board.counts.booked', 1)
                ->where('board.counts.in_use', 1)
                ->has('board.vehicles', 4)
                ->where('board.vehicles', fn ($vehicles) => collect($vehicles)->contains(
                    fn ($row) => $row['id'] === $free->id && $row['availability'] === 'free'
                ) && collect($vehicles)->contains(
                    fn ($row) => $row['id'] === $draftVehicle->id
                        && $row['availability'] === 'free'
                        && count($row['bookings']) === 1
                        && $row['bookings'][0]['status'] === Rental::STATUS_DRAFT
                ) && collect($vehicles)->contains(
                    fn ($row) => $row['id'] === $bookedVehicle->id
                        && $row['availability'] === 'booked'
                ) && collect($vehicles)->contains(
                    fn ($row) => $row['id'] === $activeVehicle->id
                        && $row['availability'] === 'in_use'
                )));
    }

    public function test_guests_are_redirected_from_availability(): void
    {
        $this->get(route('module.rental.availability.index'))
            ->assertRedirect(route('login'));
    }
}
