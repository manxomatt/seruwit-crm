<?php

namespace Tests\Feature\Modules\Transportation;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Customer\Models\Customer;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\TransportationManagement\Models\Trip;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TripTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_trips(): void
    {
        $this->get(route('module.transportation.trips.index'))->assertRedirect(route('login'));
    }

    public function test_admin_can_dispatch_a_trip(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $driver = Driver::factory()->create();
        $customer = Customer::factory()->create();

        $response = $this->actingAs($user)->post(route('module.transportation.trips.store'), [
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'customer_id' => $customer->id,
            'origin' => 'Jakarta',
            'destination' => 'Bandung',
            'scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
        ]);

        $trip = Trip::first();
        $response->assertRedirect(route('module.transportation.trips.show', $trip));
        $this->assertSame('Jakarta', $trip->origin);
        $this->assertSame(Trip::STATUS_SCHEDULED, $trip->status);
        $this->assertNotEmpty($trip->code);
    }

    public function test_a_vehicle_already_on_an_active_trip_the_same_date_cannot_be_double_booked(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $driver = Driver::factory()->create();
        $customer = Customer::factory()->create();
        // Fixed mid-day time so adding hours never crosses midnight — the
        // conflict rule is scoped to the calendar date.
        $date = now()->addDay()->setTime(8, 0);
        Trip::factory()->create(['vehicle_id' => $vehicle->id, 'status' => Trip::STATUS_SCHEDULED, 'scheduled_at' => $date]);

        $this->actingAs($user)->post(route('module.transportation.trips.store'), [
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'customer_id' => $customer->id,
            'origin' => 'Jakarta',
            'destination' => 'Bandung',
            'scheduled_at' => $date->copy()->addHours(2)->format('Y-m-d H:i:s'),
        ])->assertSessionHasErrors('vehicle_id');
    }

    public function test_a_driver_already_on_an_active_trip_the_same_date_cannot_be_double_booked(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $driver = Driver::factory()->create();
        $customer = Customer::factory()->create();
        // Fixed mid-day time so adding hours never crosses midnight — the
        // conflict rule is scoped to the calendar date.
        $date = now()->addDay()->setTime(8, 0);
        Trip::factory()->create(['driver_id' => $driver->id, 'status' => Trip::STATUS_IN_PROGRESS, 'scheduled_at' => $date]);

        $this->actingAs($user)->post(route('module.transportation.trips.store'), [
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'customer_id' => $customer->id,
            'origin' => 'Jakarta',
            'destination' => 'Bandung',
            'scheduled_at' => $date->copy()->addHours(2)->format('Y-m-d H:i:s'),
        ])->assertSessionHasErrors('driver_id');
    }

    /**
     * Trip has no duration/end time, so the double-booking rule is scoped to
     * the calendar date rather than "ever" — the same vehicle can be
     * dispatched again on a different day.
     */
    public function test_a_vehicle_can_be_booked_again_on_a_different_date(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $driver = Driver::factory()->create();
        $customer = Customer::factory()->create();
        Trip::factory()->create(['vehicle_id' => $vehicle->id, 'status' => Trip::STATUS_SCHEDULED, 'scheduled_at' => now()->addDay()]);

        $this->actingAs($user)->post(route('module.transportation.trips.store'), [
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'customer_id' => $customer->id,
            'origin' => 'Jakarta',
            'destination' => 'Bandung',
            'scheduled_at' => now()->addDays(5)->format('Y-m-d H:i:s'),
        ])->assertSessionHasNoErrors();
    }

    /**
     * @return array<string, mixed>
     */
    private function dispatchPayload(int $vehicleId, int $driverId, int $customerId): array
    {
        return [
            'vehicle_id' => $vehicleId,
            'driver_id' => $driverId,
            'customer_id' => $customerId,
            'origin' => 'Jakarta',
            'destination' => 'Bandung',
            'scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
        ];
    }

    public function test_a_vehicle_in_maintenance_cannot_be_dispatched(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_MAINTENANCE]);
        $driver = Driver::factory()->create();
        $customer = Customer::factory()->create();

        $this->actingAs($user)->post(route('module.transportation.trips.store'), $this->dispatchPayload($vehicle->id, $driver->id, $customer->id))
            ->assertSessionHasErrors('vehicle_id');
    }

    public function test_a_vehicle_with_an_expired_stnk_cannot_be_dispatched(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create(['stnk_expires_at' => now()->subDay()]);
        $driver = Driver::factory()->create();
        $customer = Customer::factory()->create();

        $this->actingAs($user)->post(route('module.transportation.trips.store'), $this->dispatchPayload($vehicle->id, $driver->id, $customer->id))
            ->assertSessionHasErrors('vehicle_id');
    }

    public function test_an_unavailable_driver_cannot_be_dispatched(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $driver = Driver::factory()->create(['status' => Driver::STATUS_ON_LEAVE]);
        $customer = Customer::factory()->create();

        $this->actingAs($user)->post(route('module.transportation.trips.store'), $this->dispatchPayload($vehicle->id, $driver->id, $customer->id))
            ->assertSessionHasErrors('driver_id');
    }

    public function test_a_driver_with_an_expired_sim_cannot_be_dispatched(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $driver = Driver::factory()->create(['license_expires_at' => now()->subDay()]);
        $customer = Customer::factory()->create();

        $this->actingAs($user)->post(route('module.transportation.trips.store'), $this->dispatchPayload($vehicle->id, $driver->id, $customer->id))
            ->assertSessionHasErrors('driver_id');
    }

    public function test_a_null_expiry_does_not_block_dispatch(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create(['stnk_expires_at' => null, 'kir_expires_at' => null]);
        $driver = Driver::factory()->create(['license_expires_at' => null]);
        $customer = Customer::factory()->create();

        $this->actingAs($user)->post(route('module.transportation.trips.store'), $this->dispatchPayload($vehicle->id, $driver->id, $customer->id))
            ->assertSessionHasNoErrors();
    }

    public function test_starting_a_scheduled_trip_moves_it_to_in_progress(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create(['status' => Trip::STATUS_SCHEDULED]);

        $this->actingAs($user)->post(route('module.transportation.trips.start', $trip))
            ->assertRedirect();

        $trip->refresh();
        $this->assertSame(Trip::STATUS_IN_PROGRESS, $trip->status);
        $this->assertNotNull($trip->started_at);
    }

    public function test_a_trip_that_is_not_scheduled_cannot_be_started(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create(['status' => Trip::STATUS_IN_PROGRESS, 'started_at' => now()]);

        $this->actingAs($user)->post(route('module.transportation.trips.start', $trip))
            ->assertSessionHas('error');

        $this->assertSame(Trip::STATUS_IN_PROGRESS, $trip->fresh()->status);
    }

    public function test_completing_an_in_progress_trip_marks_it_completed(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create(['status' => Trip::STATUS_IN_PROGRESS, 'started_at' => now()]);

        $this->actingAs($user)->post(route('module.transportation.trips.complete', $trip))
            ->assertRedirect();

        $trip->refresh();
        $this->assertSame(Trip::STATUS_COMPLETED, $trip->status);
        $this->assertNotNull($trip->completed_at);
    }

    public function test_a_scheduled_trip_cannot_be_completed_directly(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create(['status' => Trip::STATUS_SCHEDULED]);

        $this->actingAs($user)->post(route('module.transportation.trips.complete', $trip))
            ->assertSessionHas('error');

        $this->assertSame(Trip::STATUS_SCHEDULED, $trip->fresh()->status);
    }

    public function test_a_scheduled_trip_can_be_cancelled_with_a_reason(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create(['status' => Trip::STATUS_SCHEDULED]);

        $this->actingAs($user)->post(route('module.transportation.trips.cancel', $trip), [
            'cancelled_reason' => 'Customer cancelled the order',
        ])->assertRedirect();

        $trip->refresh();
        $this->assertSame(Trip::STATUS_CANCELLED, $trip->status);
        $this->assertSame('Customer cancelled the order', $trip->cancelled_reason);
    }

    public function test_cancelling_a_trip_requires_a_reason(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create(['status' => Trip::STATUS_SCHEDULED]);

        $this->actingAs($user)->post(route('module.transportation.trips.cancel', $trip), [])
            ->assertSessionHasErrors('cancelled_reason');
    }

    public function test_a_completed_trip_cannot_be_cancelled(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->completed()->create();

        $this->actingAs($user)->post(route('module.transportation.trips.cancel', $trip), [
            'cancelled_reason' => 'Too late',
        ])->assertSessionHas('error');

        $this->assertSame(Trip::STATUS_COMPLETED, $trip->fresh()->status);
    }

    public function test_a_checkpoint_can_be_logged_and_removed_for_an_in_progress_trip(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->inProgress()->create();

        $this->actingAs($user)->post(route('module.transportation.trips.checkpoints.store', $trip), [
            'latitude' => -6.2,
            'longitude' => 106.8,
            'recorded_at' => now()->format('Y-m-d H:i:s'),
        ])->assertRedirect(route('module.transportation.trips.show', $trip));

        $this->assertDatabaseHas('trip_checkpoints', ['trip_id' => $trip->id]);

        $checkpoint = $trip->checkpoints()->first();
        $this->actingAs($user)->delete(route('module.transportation.trips.checkpoints.destroy', [$trip, $checkpoint]))
            ->assertRedirect(route('module.transportation.trips.show', $trip));

        $this->assertDatabaseMissing('trip_checkpoints', ['id' => $checkpoint->id]);
    }

    public function test_an_in_progress_trip_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->inProgress()->create();

        $this->actingAs($user)->delete(route('module.transportation.trips.destroy', $trip))
            ->assertSessionHas('error');

        $this->assertDatabaseHas('trips', ['id' => $trip->id]);
    }
}
