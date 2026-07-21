<?php

namespace Tests\Feature\Modules\Inventory;

use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;
use Modules\Orders\Models\PodItem;
use Modules\Orders\Models\ProofOfDelivery;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithTenant;

class PodInventoryIntegrationTest extends TestCase
{
    use WithTenant;

    public function test_pod_creation_records_merchandise_stock_out(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create([
            'category' => 'merchandise',
            'warehouse_id' => $warehouse->id,
        ]);

        // Setup initial stock
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 100,
            'reserved' => 0,
        ]);

        // Create delivery order with item
        $order = DeliveryOrder::factory()->create();
        $orderItem = DeliveryOrderItem::factory()->create([
            'delivery_order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 10,
        ]);

        // Create POD with accepted quantity
        $pod = ProofOfDelivery::factory()->create([
            'delivery_order_id' => $order->id,
        ]);

        PodItem::factory()->create([
            'proof_of_delivery_id' => $pod->id,
            'delivery_order_item_id' => $orderItem->id,
            'accepted_quantity' => 10,
            'rejected_quantity' => 0,
            'returned_quantity' => 0,
        ]);

        // Trigger observer
        $pod->refresh();
        $pod->createEvent('created');

        // Verify stock movement
        $movement = StockMovement::where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->where('type', 'out')
            ->first();

        $this->assertNotNull($movement);
        $this->assertEquals(10, $movement->quantity);
        $this->assertEquals('pod', $movement->source_type);

        // Verify stock level updated
        $level = StockLevel::where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();
        $this->assertEquals(90, $level->on_hand);
    }

    public function test_pod_creation_records_merchandise_stock_return(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create([
            'category' => 'merchandise',
            'warehouse_id' => $warehouse->id,
        ]);

        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 100,
            'reserved' => 0,
        ]);

        // Create delivery order with item
        $order = DeliveryOrder::factory()->create();
        $orderItem = DeliveryOrderItem::factory()->create([
            'delivery_order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 10,
        ]);

        // Create POD with returned quantity
        $pod = ProofOfDelivery::factory()->create([
            'delivery_order_id' => $order->id,
        ]);

        PodItem::factory()->create([
            'proof_of_delivery_id' => $pod->id,
            'delivery_order_item_id' => $orderItem->id,
            'accepted_quantity' => 8,
            'rejected_quantity' => 0,
            'returned_quantity' => 2,
            'reason' => 'rusak',
        ]);

        // Trigger observer
        $pod->refresh();
        $pod->createEvent('created');

        // Verify OUT movement for accepted
        $outMovement = StockMovement::where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->where('type', 'out')
            ->first();
        $this->assertNotNull($outMovement);
        $this->assertEquals(8, $outMovement->quantity);

        // Verify IN movement for return
        $inMovement = StockMovement::where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->where('type', 'in')
            ->first();
        $this->assertNotNull($inMovement);
        $this->assertEquals(2, $inMovement->quantity);
        $this->assertStringContainsString('retur', $inMovement->notes);

        // Verify final stock level (100 - 8 + 2 = 94)
        $level = StockLevel::where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();
        $this->assertEquals(94, $level->on_hand);
    }

    public function test_pod_creation_ignores_non_merchandise_products(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create([
            'category' => 'fleet_sparepart',
            'warehouse_id' => $warehouse->id,
        ]);

        // Create delivery order (shouldn't happen, but test defensive code)
        $order = DeliveryOrder::factory()->create();
        $orderItem = DeliveryOrderItem::factory()->create([
            'delivery_order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 10,
        ]);

        // Create POD
        $pod = ProofOfDelivery::factory()->create([
            'delivery_order_id' => $order->id,
        ]);

        PodItem::factory()->create([
            'proof_of_delivery_id' => $pod->id,
            'delivery_order_item_id' => $orderItem->id,
            'accepted_quantity' => 10,
        ]);

        // Trigger observer
        $pod->refresh();
        $pod->createEvent('created');

        // Verify no movements created
        $movements = StockMovement::where('product_id', $product->id)->count();
        $this->assertEquals(0, $movements);
    }
}
