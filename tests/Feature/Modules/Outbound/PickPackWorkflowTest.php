<?php

namespace Tests\Feature\Modules\Outbound;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;
use Modules\Orders\Models\PodItem;
use Modules\Orders\Models\ProofOfDelivery;
use Modules\Outbound\Models\Pack;
use Modules\Outbound\Models\PickList;
use Modules\Outbound\Models\PickListItem;
use Modules\Outbound\Support\PickListGenerator;
use Modules\Outbound\Support\PickPackWorkflow;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PickPackWorkflowTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * @return array{warehouse: Warehouse, product: Product, order: DeliveryOrder, location: WarehouseLocation}
     */
    private function seededOrder(float $qty = 10, float $onHand = 50): array
    {
        $warehouse = Warehouse::factory()->create(['status' => 'active']);
        $warehouse->createDefaultLocations();
        $location = $warehouse->locations()->where('code', 'STOCK')->first();

        $product = Product::factory()->create([
            'category' => 'merchandise',
            'warehouse_id' => $warehouse->id,
        ]);

        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $location->id,
            'batch_number' => 'LOT-OUT-1',
            'expiry_date' => now()->addMonths(2)->toDateString(),
            'on_hand' => $onHand,
            'reserved' => 0,
        ]);

        $order = DeliveryOrder::factory()->confirmed()->create();
        DeliveryOrderItem::factory()->create([
            'delivery_order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => $qty,
        ]);

        return compact('warehouse', 'product', 'order', 'location');
    }

    public function test_generating_pick_list_from_do_suggests_fefo_location(): void
    {
        ['warehouse' => $warehouse, 'order' => $order, 'location' => $location] = $this->seededOrder();

        $this->actingAs($this->createAdminUser())->post(route('module.outbound.pick-lists.store', [], false), [
            'delivery_order_id' => $order->id,
            'warehouse_id' => $warehouse->id,
        ])->assertRedirect();

        $pickList = PickList::query()->first();
        $this->assertNotNull($pickList);
        $this->assertSame(PickList::STATUS_OPEN, $pickList->status);

        $item = $pickList->items()->first();
        $this->assertSame($location->id, $item->suggested_location_id);
        $this->assertSame('LOT-OUT-1', $item->suggested_batch_number);
    }

    public function test_confirm_complete_pack_seal_and_dispatch_deducts_stock(): void
    {
        ['warehouse' => $warehouse, 'product' => $product, 'order' => $order, 'location' => $location] = $this->seededOrder(10, 50);

        $user = $this->createAdminUser();
        $this->actingAs($user);

        $pickList = PickListGenerator::generate($order, $warehouse);
        $item = $pickList->items()->first();

        PickPackWorkflow::confirmItem($item, [
            'quantity_picked' => 10,
            'location_id' => $location->id,
            'batch_number' => 'LOT-OUT-1',
        ]);

        PickPackWorkflow::completePicking($pickList->fresh());

        $pack = PickPackWorkflow::createPack($pickList->fresh(), [
            'items' => [
                ['pick_list_item_id' => $item->id, 'quantity' => 10],
            ],
        ]);

        $this->assertSame(Pack::STATUS_OPEN, $pack->status);
        $this->assertNotEmpty($pack->label_code);

        PickPackWorkflow::sealPack($pack);
        $this->assertSame(PickList::STATUS_PACKED, $pickList->fresh()->status);

        PickPackWorkflow::dispatch($pickList->fresh());

        $this->assertSame(PickList::STATUS_DISPATCHED, $pickList->fresh()->status);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => 'out',
            'source_type' => 'outbound_dispatch',
            'reference_code' => $pickList->code,
        ]);

        $level = StockLevel::query()
            ->where('product_id', $product->id)
            ->where('batch_number', 'LOT-OUT-1')
            ->first();
        $this->assertEquals(40, (float) $level->on_hand);
    }

    public function test_pod_skips_stock_out_when_already_dispatched_via_outbound(): void
    {
        ['warehouse' => $warehouse, 'product' => $product, 'order' => $order, 'location' => $location] = $this->seededOrder(5, 20);

        $this->actingAs($this->createAdminUser());

        $pickList = PickListGenerator::generate($order, $warehouse);
        $item = $pickList->items()->first();
        PickPackWorkflow::confirmItem($item, [
            'quantity_picked' => 5,
            'location_id' => $location->id,
            'batch_number' => 'LOT-OUT-1',
        ]);
        PickPackWorkflow::completePicking($pickList->fresh());
        $pack = PickPackWorkflow::createPack($pickList->fresh(), [
            'items' => [['pick_list_item_id' => $item->id, 'quantity' => 5]],
        ]);
        PickPackWorkflow::sealPack($pack);
        PickPackWorkflow::dispatch($pickList->fresh());

        $outsBefore = StockMovement::query()->where('type', 'out')->count();

        $orderItem = $order->items()->first();
        $pod = ProofOfDelivery::factory()->create(['delivery_order_id' => $order->id]);
        PodItem::factory()->create([
            'proof_of_delivery_id' => $pod->id,
            'delivery_order_item_id' => $orderItem->id,
            'accepted_quantity' => 5,
            'returned_quantity' => 0,
        ]);

        $this->assertSame($outsBefore, StockMovement::query()->where('type', 'out')->count());
        $this->assertEquals(15, (float) StockLevel::query()->where('product_id', $product->id)->where('batch_number', 'LOT-OUT-1')->value('on_hand'));
    }

    public function test_cannot_generate_second_active_pick_list_for_same_do(): void
    {
        ['warehouse' => $warehouse, 'order' => $order] = $this->seededOrder();
        $this->actingAs($this->createAdminUser());

        PickListGenerator::generate($order, $warehouse);

        $this->post(route('module.outbound.pick-lists.store', [], false), [
            'delivery_order_id' => $order->id,
            'warehouse_id' => $warehouse->id,
        ])->assertSessionHasErrors('delivery_order_id');
    }

    public function test_short_pick_can_complete_and_pack_partial(): void
    {
        ['warehouse' => $warehouse, 'order' => $order, 'location' => $location] = $this->seededOrder(10, 50);
        $this->actingAs($this->createAdminUser());

        $pickList = PickListGenerator::generate($order, $warehouse);
        $item = $pickList->items()->first();

        PickPackWorkflow::confirmItem($item, [
            'quantity_picked' => 4,
            'location_id' => $location->id,
        ]);

        $this->assertSame(PickListItem::STATUS_SHORT, $item->fresh()->status);

        PickPackWorkflow::completePicking($pickList->fresh());
        $pack = PickPackWorkflow::createPack($pickList->fresh(), [
            'items' => [['pick_list_item_id' => $item->id, 'quantity' => 4]],
        ]);
        PickPackWorkflow::sealPack($pack);

        $this->assertSame(PickList::STATUS_PACKED, $pickList->fresh()->status);
    }
}
