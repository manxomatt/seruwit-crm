<?php

namespace Tests\Feature\Modules\Orders;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Models\DeliveryOrder;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class OrderTripSyncTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_starting_a_trip_moves_its_orders_to_in_transit(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();
        $order = DeliveryOrder::factory()->assigned($trip)->create();

        $this->actingAs($user)->post(route('module.transportation.trips.start', $trip));

        $this->assertSame(DeliveryOrder::STATUS_IN_TRANSIT, $order->fresh()->status);
    }

    public function test_a_status_change_notifies_staff_and_fires_the_shipment_event(): void
    {
        \Illuminate\Support\Facades\Event::fake([\Modules\Orders\Events\ShipmentStatusChanged::class]);

        $admin = $this->createAdminUser();
        $trip = Trip::factory()->create();
        $order = DeliveryOrder::factory()->assigned($trip)->create();

        $this->actingAs($admin)->post(route('module.transportation.trips.start', $trip));

        $this->assertGreaterThan(0, $admin->notifications()->count());
        \Illuminate\Support\Facades\Event::assertDispatched(
            \Modules\Orders\Events\ShipmentStatusChanged::class,
            fn ($event) => $event->order->id === $order->id && $event->to === DeliveryOrder::STATUS_IN_TRANSIT,
        );
    }

    public function test_completing_a_dropoff_stop_marks_its_order_delivered(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->inProgress()->create();
        $order = DeliveryOrder::factory()->assigned($trip)->create(['status' => DeliveryOrder::STATUS_IN_TRANSIT]);
        $stop = TripStop::factory()->create([
            'trip_id' => $trip->id,
            'delivery_order_id' => $order->id,
        ]);

        $this->actingAs($user)->post(route('module.transportation.trips.stops.complete', [$trip, $stop]));

        $order->refresh();
        $this->assertSame(DeliveryOrder::STATUS_DELIVERED, $order->status);
        $this->assertNotNull($order->delivered_at);
    }

    public function test_completing_a_trip_sweeps_remaining_in_transit_orders_to_delivered(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->inProgress()->create();
        $order = DeliveryOrder::factory()->assigned($trip)->create(['status' => DeliveryOrder::STATUS_IN_TRANSIT]);

        $this->actingAs($user)->post(route('module.transportation.trips.complete', $trip));

        $order->refresh();
        $this->assertSame(DeliveryOrder::STATUS_DELIVERED, $order->status);
        $this->assertNotNull($order->delivered_at);
    }

    public function test_cancelling_a_trip_releases_its_orders_for_replanning(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();
        $order = DeliveryOrder::factory()->assigned($trip)->create();

        $this->actingAs($user)->post(route('module.transportation.trips.cancel', $trip), [
            'cancelled_reason' => 'Vehicle broke down',
        ]);

        $order->refresh();
        $this->assertSame(DeliveryOrder::STATUS_CONFIRMED, $order->status);
        $this->assertNull($order->trip_id);
    }

    public function test_deleting_a_trip_releases_its_orders(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();
        $order = DeliveryOrder::factory()->assigned($trip)->create();

        $this->actingAs($user)->delete(route('module.transportation.trips.destroy', $trip));

        $order->refresh();
        $this->assertSame(DeliveryOrder::STATUS_CONFIRMED, $order->status);
        $this->assertNull($order->trip_id);
    }
}
