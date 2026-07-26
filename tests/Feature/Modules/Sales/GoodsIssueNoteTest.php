<?php

namespace Tests\Feature\Modules\Sales;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\GoodsIssueNoteItem;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;
use Modules\Sales\Support\GinConfirmationService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class GoodsIssueNoteTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * @return array{0: SalesOrder, 1: SalesOrderItem, 2: SalesOrderItem, 3: WarehouseLocation}
     */
    private function confirmedSoWithTwoItems(): array
    {
        $customer = Partner::factory()->create(['customer_rank' => 1]);
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $stockLocation = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        $productA = Product::factory()->create();
        $productB = Product::factory()->create();

        StockLevel::factory()->create([
            'product_id' => $productA->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $stockLocation->id,
            'on_hand' => 500,
            'reserved' => 0,
        ]);

        StockLevel::factory()->create([
            'product_id' => $productB->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $stockLocation->id,
            'on_hand' => 500,
            'reserved' => 0,
        ]);

        $so = SalesOrder::factory()->create([
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'status' => SalesOrder::STATUS_DRAFT,
        ]);

        $itemA = SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $productA->id,
            'quantity_ordered' => 100,
            'quantity_delivered' => 0,
            'unit_price' => 1000,
        ]);

        $itemB = SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $productB->id,
            'quantity_ordered' => 200,
            'quantity_delivered' => 0,
            'unit_price' => 500,
        ]);

        $so->recalculateTotal();
        app(\Modules\Sales\Support\SalesOrderConfirmationService::class)->confirm($so);

        return [$so->fresh(), $itemA->fresh(), $itemB->fresh(), $stockLocation];
    }

    public function test_gin_confirm_creates_stock_movements_and_updates_levels(): void
    {
        $user = $this->createAdminUser();
        [$so, $itemA, , $location] = $this->confirmedSoWithTwoItems();

        $this->actingAs($user)->post(route('module.sales.sales-orders.gin.store', $so, false), [
            'warehouse_id' => $so->warehouse_id,
            'issued_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                [
                    'so_item_id' => $itemA->id,
                    'quantity_issued' => 60,
                    'location_id' => $location->id,
                ],
            ],
        ])->assertSessionHas('success');

        $ginItem = GoodsIssueNoteItem::query()->first();
        $this->assertNotNull($ginItem);

        $movement = StockMovement::query()
            ->where('source_type', 'gin')
            ->where('source_id', $ginItem->id)
            ->first();

        $this->assertNotNull($movement);
        $this->assertSame('out', $movement->type);
        $this->assertEquals(60, (float) $movement->quantity);

        $level = StockLevel::query()
            ->where('product_id', $itemA->product_id)
            ->where('warehouse_id', $so->warehouse_id)
            ->where('location_id', $location->id)
            ->first();

        $this->assertNotNull($level);
        $this->assertEquals(440, (float) $level->on_hand);
        $this->assertEquals(40, (float) $level->reserved);
        $this->assertEquals(60, (float) $itemA->fresh()->quantity_delivered);
        $this->assertSame(SalesOrder::STATUS_PARTIAL_DELIVERED, $so->fresh()->status);
    }

    public function test_so_becomes_fully_delivered_when_all_quantities_met(): void
    {
        $user = $this->createAdminUser();
        [$so, $itemA, $itemB] = $this->confirmedSoWithTwoItems();

        $this->actingAs($user)->post(route('module.sales.sales-orders.gin.store', $so, false), [
            'warehouse_id' => $so->warehouse_id,
            'issued_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                ['so_item_id' => $itemA->id, 'quantity_issued' => 100],
                ['so_item_id' => $itemB->id, 'quantity_issued' => 200],
            ],
        ])->assertSessionHas('success');

        $this->assertSame(SalesOrder::STATUS_FULLY_DELIVERED, $so->fresh()->status);
    }

    public function test_quantity_exceeding_remaining_returns_validation_error(): void
    {
        $user = $this->createAdminUser();
        [$so, $itemA] = $this->confirmedSoWithTwoItems();
        $itemA->update(['quantity_delivered' => 90]);

        $this->actingAs($user)->post(route('module.sales.sales-orders.gin.store', $so, false), [
            'warehouse_id' => $so->warehouse_id,
            'issued_at' => now()->toDateString(),
            'items' => [
                ['so_item_id' => $itemA->id, 'quantity_issued' => 20],
            ],
        ])->assertSessionHasErrors('items.0.quantity_issued');
    }

    public function test_confirmed_gin_cannot_be_confirmed_again(): void
    {
        $user = $this->createAdminUser();
        [$so, $itemA] = $this->confirmedSoWithTwoItems();

        $gin = GoodsIssueNote::factory()->create([
            'sales_order_id' => $so->id,
            'warehouse_id' => $so->warehouse_id,
            'status' => GoodsIssueNote::STATUS_DRAFT,
        ]);

        GoodsIssueNoteItem::factory()->create([
            'goods_issue_note_id' => $gin->id,
            'so_item_id' => $itemA->id,
            'quantity_issued' => 10,
        ]);

        $this->actingAs($user);
        app(GinConfirmationService::class)->confirm($gin);

        $this->actingAs($user)
            ->post(route('module.sales.gin.confirm', $gin, false))
            ->assertSessionHas('error');

        $this->assertEquals(1, StockMovement::query()->where('source_type', 'gin')->count());
    }

    public function test_gin_confirm_defaults_location_to_stock(): void
    {
        $user = $this->createAdminUser();
        [$so, $itemA] = $this->confirmedSoWithTwoItems();

        $this->actingAs($user)->post(route('module.sales.sales-orders.gin.store', $so, false), [
            'warehouse_id' => $so->warehouse_id,
            'issued_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                ['so_item_id' => $itemA->id, 'quantity_issued' => 10],
            ],
        ])->assertSessionHas('success');

        $stockLocation = WarehouseLocation::query()
            ->where('warehouse_id', $so->warehouse_id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        $ginItem = GoodsIssueNoteItem::query()->first();
        $this->assertNotNull($ginItem);
        $this->assertSame($stockLocation->id, $ginItem->location_id);

        $movement = StockMovement::query()->where('source_type', 'gin')->first();
        $this->assertNotNull($movement);
        $this->assertSame($stockLocation->id, $movement->location_id);
    }

    public function test_gin_confirm_converts_packaging_quantity_to_base_units(): void
    {
        $user = $this->createAdminUser();
        $customer = Partner::factory()->create(['customer_rank' => 1]);
        $warehouse = Warehouse::factory()->create();
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
            'on_hand' => 500,
            'reserved' => 0,
        ]);

        $packaging = \Modules\Product\Models\ProductPackaging::factory()->create([
            'product_id' => $product->id,
            'name' => 'Karton',
            'qty' => 12,
        ]);

        $so = SalesOrder::factory()->create([
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'status' => SalesOrder::STATUS_DRAFT,
        ]);
        $item = SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'product_packaging_id' => $packaging->id,
            'quantity_ordered' => 5,
            'unit_price' => 24000,
        ]);
        $so->recalculateTotal();
        app(\Modules\Sales\Support\SalesOrderConfirmationService::class)->confirm($so);

        $this->actingAs($user)->post(route('module.sales.sales-orders.gin.store', $so, false), [
            'warehouse_id' => $so->warehouse_id,
            'issued_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                ['so_item_id' => $item->id, 'quantity_issued' => 2],
            ],
        ])->assertSessionHas('success');

        $movement = StockMovement::query()->where('source_type', 'gin')->first();
        $this->assertNotNull($movement);
        $this->assertEquals(24, (float) $movement->quantity);

        $level = StockLevel::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();
        $this->assertEquals(476, (float) $level->on_hand);
        $this->assertEquals(36, (float) $level->reserved);
    }

    public function test_void_confirmed_gin_reverses_stock_and_so_quantities(): void
    {
        $user = $this->createAdminUser();
        [$so, $itemA, , $stockLocation] = $this->confirmedSoWithTwoItems();

        $this->actingAs($user)->post(route('module.sales.sales-orders.gin.store', $so, false), [
            'warehouse_id' => $so->warehouse_id,
            'issued_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                [
                    'so_item_id' => $itemA->id,
                    'quantity_issued' => 40,
                    'location_id' => $stockLocation->id,
                ],
            ],
        ])->assertSessionHas('success');

        $gin = GoodsIssueNote::query()->firstOrFail();
        $this->assertSame(SalesOrder::STATUS_PARTIAL_DELIVERED, $so->fresh()->status);
        $this->assertEquals(460, (float) StockLevel::query()
            ->where('product_id', $itemA->product_id)
            ->where('warehouse_id', $so->warehouse_id)
            ->where('location_id', $stockLocation->id)
            ->value('on_hand'));

        $this->actingAs($user)
            ->post(route('module.sales.gin.void', $gin, false))
            ->assertSessionHas('success');

        $this->assertSame(GoodsIssueNote::STATUS_VOIDED, $gin->fresh()->status);
        $this->assertEquals(0, (float) $itemA->fresh()->quantity_delivered);
        $this->assertSame(SalesOrder::STATUS_CONFIRMED, $so->fresh()->status);
        $level = StockLevel::query()
            ->where('product_id', $itemA->product_id)
            ->where('warehouse_id', $so->warehouse_id)
            ->where('location_id', $stockLocation->id)
            ->first();
        $this->assertEquals(500, (float) $level->on_hand);
        $this->assertEquals(100, (float) $level->reserved);
        $this->assertEquals(1, StockMovement::query()->where('source_type', 'gin_void')->count());
    }

    public function test_void_is_rejected_when_sales_order_is_closed(): void
    {
        $user = $this->createAdminUser();
        [$so, $itemA, , $stockLocation] = $this->confirmedSoWithTwoItems();

        $this->actingAs($user)->post(route('module.sales.sales-orders.gin.store', $so, false), [
            'warehouse_id' => $so->warehouse_id,
            'issued_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                ['so_item_id' => $itemA->id, 'quantity_issued' => 100, 'location_id' => $stockLocation->id],
            ],
        ])->assertSessionHas('success');

        $so->update(['status' => SalesOrder::STATUS_CLOSED]);
        $gin = GoodsIssueNote::query()->firstOrFail();

        $this->actingAs($user)
            ->post(route('module.sales.gin.void', $gin, false))
            ->assertSessionHas('error');

        $this->assertSame(GoodsIssueNote::STATUS_CONFIRMED, $gin->fresh()->status);
    }

    public function test_stock_movements_index_includes_gin_deep_link_id(): void
    {
        $user = $this->createAdminUser();
        [$so, $itemA] = $this->confirmedSoWithTwoItems();

        $this->actingAs($user)->post(route('module.sales.sales-orders.gin.store', $so, false), [
            'warehouse_id' => $so->warehouse_id,
            'issued_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                ['so_item_id' => $itemA->id, 'quantity_issued' => 5],
            ],
        ])->assertSessionHas('success');

        $gin = GoodsIssueNote::query()->firstOrFail();

        $this->actingAs($user)
            ->get(route('module.inventory.stock-movements.index', [], false))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Inventory/StockMovements/Index')
                ->has('movements.data.0', fn ($movement) => $movement
                    ->where('gin_id', $gin->id)
                    ->where('reference_code', $gin->gin_number)
                    ->etc()));
    }
}
