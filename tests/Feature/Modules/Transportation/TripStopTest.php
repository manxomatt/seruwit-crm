<?php

namespace Tests\Feature\Modules\Transportation;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TripStopTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_stops_are_added_to_a_scheduled_trip_with_auto_incrementing_sequence(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();

        $this->actingAs($user)->post(route('module.transportation.trips.stops.store', $trip), [
            'type' => 'pickup',
            'address' => 'Gudang A, Jakarta',
        ])->assertRedirect(route('module.transportation.trips.show', $trip));

        $this->actingAs($user)->post(route('module.transportation.trips.stops.store', $trip), [
            'type' => 'dropoff',
            'address' => 'Toko B, Bandung',
        ]);

        $this->assertSame([1, 2], $trip->stops()->pluck('sequence')->all());
    }

    public function test_stops_cannot_be_added_once_the_trip_started(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->inProgress()->create();

        $this->actingAs($user)->post(route('module.transportation.trips.stops.store', $trip), [
            'type' => 'dropoff',
            'address' => 'Toko B, Bandung',
        ])->assertSessionHas('error');

        $this->assertSame(0, $trip->stops()->count());
    }

    public function test_a_pending_stop_can_be_updated_and_deleted(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();
        $stop = TripStop::factory()->create(['trip_id' => $trip->id]);

        $this->actingAs($user)->patch(route('module.transportation.trips.stops.update', [$trip, $stop]), [
            'address' => 'Alamat Baru',
        ])->assertRedirect(route('module.transportation.trips.show', $trip));

        $this->assertSame('Alamat Baru', $stop->fresh()->address);

        $this->actingAs($user)->delete(route('module.transportation.trips.stops.destroy', [$trip, $stop]))
            ->assertRedirect(route('module.transportation.trips.show', $trip));

        $this->assertDatabaseMissing('trip_stops', ['id' => $stop->id]);
    }

    public function test_a_stop_owned_by_a_delivery_order_cannot_be_deleted_directly(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();
        $stop = TripStop::factory()->create(['trip_id' => $trip->id, 'delivery_order_id' => 123]);

        $this->actingAs($user)->delete(route('module.transportation.trips.stops.destroy', [$trip, $stop]))
            ->assertSessionHas('error');

        $this->assertDatabaseHas('trip_stops', ['id' => $stop->id]);
    }

    public function test_stops_can_only_be_worked_while_the_trip_is_in_progress(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();
        $stop = TripStop::factory()->create(['trip_id' => $trip->id]);

        $this->actingAs($user)->post(route('module.transportation.trips.stops.arrive', [$trip, $stop]))
            ->assertSessionHas('error');

        $this->assertSame(TripStop::STATUS_PENDING, $stop->fresh()->status);
    }

    public function test_a_stop_can_be_arrived_and_completed_during_the_trip(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->inProgress()->create();
        $stop = TripStop::factory()->create(['trip_id' => $trip->id]);

        $this->actingAs($user)->post(route('module.transportation.trips.stops.arrive', [$trip, $stop]))
            ->assertSessionHas('success');

        $stop->refresh();
        $this->assertSame(TripStop::STATUS_ARRIVED, $stop->status);
        $this->assertNotNull($stop->arrived_at);

        $this->actingAs($user)->post(route('module.transportation.trips.stops.complete', [$trip, $stop]))
            ->assertSessionHas('success');

        $stop->refresh();
        $this->assertSame(TripStop::STATUS_COMPLETED, $stop->status);
        $this->assertNotNull($stop->completed_at);
    }

    public function test_a_stop_of_another_trip_returns_404(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();
        $otherStop = TripStop::factory()->create();

        $this->actingAs($user)->delete(route('module.transportation.trips.stops.destroy', [$trip, $otherStop]))
            ->assertNotFound();
    }

    public function test_deleting_a_trip_cascades_its_stops(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();
        $stop = TripStop::factory()->create(['trip_id' => $trip->id]);

        $this->actingAs($user)->delete(route('module.transportation.trips.destroy', $trip))
            ->assertRedirect(route('module.transportation.trips.index'));

        $this->assertDatabaseMissing('trip_stops', ['id' => $stop->id]);
    }
}
