<?php

namespace Tests\Feature\Modules\Orders;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Warehouse;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Support\DeliveryOrderTripAssignment;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class WarehousePickupGeoTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_assigning_gin_do_copies_warehouse_coordinates_to_pickup_stop(): void
    {
        $warehouse = Warehouse::factory()->create([
            'location' => 'Gudang Seruwit Cirebon',
            'latitude' => -6.7321000,
            'longitude' => 108.5521000,
        ]);

        $gin = GoodsIssueNote::factory()->create([
            'warehouse_id' => $warehouse->id,
            'status' => GoodsIssueNote::STATUS_CONFIRMED,
        ]);

        $order = DeliveryOrder::factory()->confirmed()->create([
            'goods_issue_note_id' => $gin->id,
            'pickup_address' => $warehouse->location,
        ]);

        $trip = Trip::factory()->create();

        app(DeliveryOrderTripAssignment::class)->assign($order, $trip);

        $pickup = TripStop::query()
            ->where('trip_id', $trip->id)
            ->where('type', TripStop::TYPE_PICKUP)
            ->first();

        $this->assertNotNull($pickup);
        $this->assertEquals(-6.7321000, (float) $pickup->lat);
        $this->assertEquals(108.5521000, (float) $pickup->lng);
    }
}
