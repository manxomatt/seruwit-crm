<?php

namespace Tests\Feature\Modules\Sales;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockReservation;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Support\DeliveryOrderStock;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\GoodsIssueNoteItem;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;
use Modules\Sales\Support\GinConfirmationService;
use Modules\Sales\Support\SalesOrderConfirmationService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class GinToDeliveryOrderTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * @return array{0: GoodsIssueNote, 1: SalesOrderItem, 2: WarehouseLocation, 3: float}
     */
    private function confirmedGin(): array
    {
        $customer = Partner::factory()->create([
            'customer_rank' => 1,
            'address' => 'Toko Maju, Cirebon',
        ]);
        $warehouse = Warehouse::factory()->create(['location' => 'Gudang Utama Seruwit']);
        $warehouse->createDefaultLocations();
        $stockLocation = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        $product = Product::factory()->create();
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $stockLocation->id,
            'on_hand' => 100,
            'reserved' => 0,
        ]);

        $so = SalesOrder::factory()->create([
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'status' => SalesOrder::STATUS_DRAFT,
        ]);

        $soItem = SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity_ordered' => 40,
            'quantity_delivered' => 0,
            'unit_price' => 1000,
        ]);

        $so->recalculateTotal();
        app(SalesOrderConfirmationService::class)->confirm($so);

        $gin = GoodsIssueNote::factory()->create([
            'sales_order_id' => $so->id,
            'warehouse_id' => $warehouse->id,
            'status' => GoodsIssueNote::STATUS_DRAFT,
        ]);

        GoodsIssueNoteItem::factory()->create([
            'goods_issue_note_id' => $gin->id,
            'so_item_id' => $soItem->id,
            'location_id' => $stockLocation->id,
            'quantity_issued' => 40,
        ]);

        app(GinConfirmationService::class)->confirm($gin);

        $onHand = (float) StockLevel::query()
            ->where('product_id', $product->id)
            ->where('location_id', $stockLocation->id)
            ->value('on_hand');

        return [$gin->fresh(['items']), $soItem->fresh(), $stockLocation, $onHand];
    }

    public function test_confirmed_gin_creates_draft_delivery_order_without_extra_stock_move(): void
    {
        $user = $this->createAdminUser();
        [$gin, $soItem, $location, $onHandAfterGin] = $this->confirmedGin();

        $this->assertEquals(60, $onHandAfterGin);

        $this->actingAs($user)
            ->post(route('module.sales.gin.delivery-order', $gin, false))
            ->assertRedirect();

        $order = DeliveryOrder::query()->where('goods_issue_note_id', $gin->id)->first();
        $this->assertNotNull($order);
        $this->assertSame(DeliveryOrder::STATUS_DRAFT, $order->status);
        $this->assertSame($gin->salesOrder->partner_id, $order->partner_id);
        $this->assertStringContainsString('Toko Maju', $order->delivery_address);
        $this->assertSame('Gudang Utama Seruwit', $order->pickup_address);
        $this->assertTrue($order->isFromGin());
        $this->assertSame(1, $order->items()->count());
        $this->assertEquals(40, (float) $order->items()->first()->quantity);
        $this->assertSame($gin->items->first()->id, $order->items()->first()->goods_issue_note_item_id);

        $this->assertEquals(60, (float) StockLevel::query()
            ->where('product_id', $soItem->product_id)
            ->where('location_id', $location->id)
            ->value('on_hand'));
    }

    public function test_confirming_gin_sourced_do_does_not_create_reservations_or_change_stock(): void
    {
        $user = $this->createAdminUser();
        [$gin, $soItem, $location, $onHandAfterGin] = $this->confirmedGin();

        $this->actingAs($user)
            ->post(route('module.sales.gin.delivery-order', $gin, false))
            ->assertRedirect();

        $order = DeliveryOrder::query()->where('goods_issue_note_id', $gin->id)->firstOrFail();

        $this->actingAs($user)
            ->post(route('module.orders.confirm', $order, false))
            ->assertSessionHas('success');

        $order->refresh();
        $this->assertSame(DeliveryOrder::STATUS_CONFIRMED, $order->status);
        $this->assertFalse(DeliveryOrderStock::managesInventory($order));
        $this->assertSame(0, StockReservation::query()->where('delivery_order_id', $order->id)->count());
        $this->assertEquals($onHandAfterGin, (float) StockLevel::query()
            ->where('product_id', $soItem->product_id)
            ->where('location_id', $location->id)
            ->value('on_hand'));
    }

    public function test_cannot_create_second_do_or_void_gin_while_do_active(): void
    {
        $user = $this->createAdminUser();
        [$gin] = $this->confirmedGin();

        $this->actingAs($user)
            ->post(route('module.sales.gin.delivery-order', $gin, false))
            ->assertRedirect();

        $this->actingAs($user)
            ->post(route('module.sales.gin.delivery-order', $gin, false))
            ->assertSessionHas('error');

        $this->actingAs($user)
            ->post(route('module.sales.gin.void', $gin, false))
            ->assertSessionHas('error');

        $this->assertSame(GoodsIssueNote::STATUS_CONFIRMED, $gin->fresh()->status);
        $this->assertSame(1, DeliveryOrder::query()->where('goods_issue_note_id', $gin->id)->count());
    }
}
