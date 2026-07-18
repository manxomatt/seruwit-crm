<?php

namespace Tests\Feature\Modules\Orders;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Models\DeliveryOrder;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class DeliveryOrderAssignmentTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_a_confirmed_order_can_be_assigned_to_a_scheduled_trip(): void
    {
        $user = $this->createAdminUser();
        $order = DeliveryOrder::factory()->confirmed()->create();
        $trip = Trip::factory()->create();

        $this->actingAs($user)->post(route('module.orders.assign-trip', $order), [
            'trip_id' => $trip->id,
        ])->assertSessionHas('success');

        $order->refresh();
        $this->assertSame(DeliveryOrder::STATUS_ASSIGNED, $order->status);
        $this->assertSame($trip->id, $order->trip_id);

        $stop = TripStop::where('delivery_order_id', $order->id)->first();
        $this->assertNotNull($stop);
        $this->assertSame($trip->id, $stop->trip_id);
        $this->assertSame(TripStop::TYPE_DROPOFF, $stop->type);
        $this->assertSame($order->delivery_address, $stop->address);
        $this->assertSame(1, $stop->sequence);
    }

    public function test_the_dropoff_stop_is_appended_after_existing_stops(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();
        TripStop::factory()->create(['trip_id' => $trip->id, 'sequence' => 1]);
        $order = DeliveryOrder::factory()->confirmed()->create();

        $this->actingAs($user)->post(route('module.orders.assign-trip', $order), [
            'trip_id' => $trip->id,
        ]);

        $stop = TripStop::where('delivery_order_id', $order->id)->first();
        $this->assertSame(2, $stop->sequence);
    }

    public function test_a_draft_order_cannot_be_assigned(): void
    {
        $user = $this->createAdminUser();
        $order = DeliveryOrder::factory()->create();
        $trip = Trip::factory()->create();

        $this->actingAs($user)->post(route('module.orders.assign-trip', $order), [
            'trip_id' => $trip->id,
        ])->assertSessionHas('error');

        $this->assertNull($order->fresh()->trip_id);
    }

    public function test_an_order_cannot_be_assigned_to_a_trip_that_already_started(): void
    {
        $user = $this->createAdminUser();
        $order = DeliveryOrder::factory()->confirmed()->create();
        $trip = Trip::factory()->inProgress()->create();

        $this->actingAs($user)->post(route('module.orders.assign-trip', $order), [
            'trip_id' => $trip->id,
        ])->assertSessionHasErrors('trip_id');

        $this->assertNull($order->fresh()->trip_id);
    }

    public function test_an_assigned_order_can_be_unassigned_while_the_trip_is_scheduled(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();
        $order = DeliveryOrder::factory()->assigned($trip)->create();
        $stop = TripStop::factory()->create([
            'trip_id' => $trip->id,
            'delivery_order_id' => $order->id,
        ]);

        $this->actingAs($user)->post(route('module.orders.unassign-trip', $order))->assertSessionHas('success');

        $order->refresh();
        $this->assertSame(DeliveryOrder::STATUS_CONFIRMED, $order->status);
        $this->assertNull($order->trip_id);
        $this->assertDatabaseMissing('trip_stops', ['id' => $stop->id]);
    }

    public function test_an_order_cannot_be_unassigned_once_the_trip_started(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->inProgress()->create();
        $order = DeliveryOrder::factory()->assigned($trip)->create();

        $this->actingAs($user)->post(route('module.orders.unassign-trip', $order))->assertSessionHas('error');

        $this->assertSame($trip->id, $order->fresh()->trip_id);
    }
}
