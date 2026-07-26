<?php

namespace Tests\Feature\Modules\Sales;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class SalesOrderTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * @return array{0: Warehouse, 1: WarehouseLocation}
     */
    private function warehouseWithStockLocation(): array
    {
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $stockLocation = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        return [$warehouse, $stockLocation];
    }

    private function seedStock(int $productId, int $warehouseId, int $locationId, float $onHand): void
    {
        StockLevel::factory()->create([
            'product_id' => $productId,
            'warehouse_id' => $warehouseId,
            'location_id' => $locationId,
            'on_hand' => $onHand,
            'reserved' => 0,
        ]);
    }

    public function test_admin_can_create_draft_sales_order(): void
    {
        $user = $this->createAdminUser();
        $customer = Partner::factory()->create(['customer_rank' => 1, 'supplier_rank' => 0]);
        [$warehouse] = $this->warehouseWithStockLocation();
        $product = Product::factory()->create(['unit' => 'karton', 'price' => 95000]);

        $response = $this->actingAs($user)->post(route('module.sales.sales-orders.store', [], false), [
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'ordered_at' => now()->toDateString(),
            'promised_at' => now()->addDays(5)->toDateString(),
            'notes' => 'Test SO',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity_ordered' => 100,
                    'unit_price' => 95000,
                    'unit' => 'karton',
                ],
            ],
        ]);

        $so = SalesOrder::query()->first();
        $this->assertNotNull($so);
        $response->assertRedirect(route('module.sales.sales-orders.show', $so, false));
        $this->assertSame(SalesOrder::STATUS_DRAFT, $so->status);
        $this->assertMatchesRegularExpression('/^SO-\d{4}-\d{4}$/', $so->so_number);
        $this->assertEquals(9500000, (float) $so->fresh()->total_amount);
        $this->assertDatabaseHas('sales_order_items', [
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity_ordered' => 100,
        ]);
    }

    public function test_user_without_create_permission_is_blocked(): void
    {
        $user = $this->createUserWithRole();
        $customer = Partner::factory()->create(['customer_rank' => 1]);
        [$warehouse] = $this->warehouseWithStockLocation();
        $product = Product::factory()->create();

        $this->actingAs($user)->post(route('module.sales.sales-orders.store', [], false), [
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'ordered_at' => now()->toDateString(),
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity_ordered' => 10,
                    'unit_price' => 1000,
                    'unit' => 'pcs',
                ],
            ],
        ])->assertForbidden();
    }

    public function test_only_draft_can_be_updated_or_deleted(): void
    {
        $user = $this->createAdminUser();
        $so = SalesOrder::factory()->confirmed()->create();
        SalesOrderItem::factory()->create(['sales_order_id' => $so->id]);

        $this->actingAs($user)->patch(route('module.sales.sales-orders.update', $so, false), [
            'partner_id' => $so->partner_id,
            'warehouse_id' => $so->warehouse_id,
            'ordered_at' => now()->toDateString(),
            'items' => [
                ['product_id' => Product::factory()->create()->id, 'quantity_ordered' => 5, 'unit_price' => 10, 'unit' => 'pcs'],
            ],
        ])->assertSessionHas('error');

        $this->actingAs($user)
            ->delete(route('module.sales.sales-orders.destroy', $so, false))
            ->assertSessionHas('error');

        $this->assertDatabaseHas('sales_orders', ['id' => $so->id]);
    }

    public function test_confirm_requires_items_and_sufficient_stock(): void
    {
        $user = $this->createAdminUser();
        [$warehouse, $stockLocation] = $this->warehouseWithStockLocation();
        $product = Product::factory()->create();

        $emptySo = SalesOrder::factory()->create([
            'warehouse_id' => $warehouse->id,
            'status' => SalesOrder::STATUS_DRAFT,
        ]);

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.confirm', $emptySo, false))
            ->assertSessionHas('error');

        $so = SalesOrder::factory()->create([
            'warehouse_id' => $warehouse->id,
            'status' => SalesOrder::STATUS_DRAFT,
        ]);
        SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity_ordered' => 50,
            'unit_price' => 1000,
        ]);

        $this->seedStock($product->id, $warehouse->id, $stockLocation->id, 10);

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.confirm', $so, false))
            ->assertSessionHas('error');

        $this->assertSame(SalesOrder::STATUS_DRAFT, $so->fresh()->status);

        StockLevel::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->update(['on_hand' => 100]);

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.confirm', $so, false))
            ->assertSessionHas('success');

        $this->assertSame(SalesOrder::STATUS_CONFIRMED, $so->fresh()->status);

        $level = StockLevel::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();
        $this->assertEquals(50, (float) $level->reserved);
        $this->assertEquals(100, (float) $level->on_hand);
    }

    public function test_cancel_confirmed_without_gin_ok_with_confirmed_gin_blocked(): void
    {
        $user = $this->createAdminUser();
        [$warehouse, $stockLocation] = $this->warehouseWithStockLocation();
        $product = Product::factory()->create();

        $so = SalesOrder::factory()->confirmed()->create(['warehouse_id' => $warehouse->id]);
        $item = SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity_ordered' => 20,
        ]);

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.cancel', $so, false))
            ->assertSessionHas('success');

        $this->assertSame(SalesOrder::STATUS_CANCELLED, $so->fresh()->status);

        $so2 = SalesOrder::factory()->confirmed()->create(['warehouse_id' => $warehouse->id]);
        $item2 = SalesOrderItem::factory()->create([
            'sales_order_id' => $so2->id,
            'product_id' => $product->id,
            'quantity_ordered' => 20,
        ]);

        $this->seedStock($product->id, $warehouse->id, $stockLocation->id, 100);

        $this->actingAs($user)->post(route('module.sales.sales-orders.gin.store', $so2, false), [
            'warehouse_id' => $warehouse->id,
            'issued_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                ['so_item_id' => $item2->id, 'quantity_issued' => 5],
            ],
        ])->assertSessionHas('success');

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.cancel', $so2, false))
            ->assertSessionHas('error');

        $this->assertSame(SalesOrder::STATUS_PARTIAL_DELIVERED, $so2->fresh()->status);
    }

    public function test_total_amount_is_calculated_from_items(): void
    {
        $user = $this->createAdminUser();
        $customer = Partner::factory()->create(['customer_rank' => 1]);
        [$warehouse] = $this->warehouseWithStockLocation();
        $productA = Product::factory()->create();
        $productB = Product::factory()->create();

        $this->actingAs($user)->post(route('module.sales.sales-orders.store', [], false), [
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'ordered_at' => now()->toDateString(),
            'items' => [
                ['product_id' => $productA->id, 'quantity_ordered' => 100, 'unit_price' => 85000, 'unit' => 'karton'],
                ['product_id' => $productB->id, 'quantity_ordered' => 200, 'unit_price' => 19500, 'unit' => 'pack'],
            ],
        ]);

        $so = SalesOrder::query()->first();
        $this->assertEquals(12400000, (float) $so->total_amount);
    }

    public function test_non_customer_partner_is_rejected(): void
    {
        $user = $this->createAdminUser();
        $supplier = Partner::factory()->supplier()->create();
        [$warehouse] = $this->warehouseWithStockLocation();
        $product = Product::factory()->create();

        $this->actingAs($user)->post(route('module.sales.sales-orders.store', [], false), [
            'partner_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
            'ordered_at' => now()->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'quantity_ordered' => 1, 'unit_price' => 100, 'unit' => 'pcs'],
            ],
        ])->assertSessionHasErrors('partner_id');
    }

    public function test_packaging_mismatch_returns_validation_error(): void
    {
        $user = $this->createAdminUser();
        $customer = Partner::factory()->create(['customer_rank' => 1]);
        [$warehouse] = $this->warehouseWithStockLocation();
        $productA = Product::factory()->create();
        $productB = Product::factory()->create();
        $packaging = \Modules\Product\Models\ProductPackaging::factory()->create(['product_id' => $productB->id]);

        $this->actingAs($user)->post(route('module.sales.sales-orders.store', [], false), [
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'ordered_at' => now()->toDateString(),
            'items' => [
                [
                    'product_id' => $productA->id,
                    'product_packaging_id' => $packaging->id,
                    'quantity_ordered' => 1,
                    'unit_price' => 100,
                    'unit' => 'pcs',
                ],
            ],
        ])->assertSessionHasErrors('items.0.product_packaging_id');
    }

    public function test_create_invoice_from_confirmed_sales_order(): void
    {
        if (! Schema::hasTable('invoices')) {
            $this->markTestSkipped('Invoicing tables are not available.');
        }

        \App\Models\Setting::query()->updateOrCreate(
            ['key' => 'ecommerce.tax_enabled'],
            ['group' => 'ecommerce', 'value' => '0', 'type' => 'boolean', 'label' => 'Enable Tax']
        );

        $user = $this->createAdminUser();
        [$warehouse, $stockLocation] = $this->warehouseWithStockLocation();
        $customer = Partner::factory()->create(['customer_rank' => 1]);
        $product = Product::factory()->create(['name' => 'Widget', 'unit' => 'pcs']);

        $so = SalesOrder::factory()->create([
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'status' => SalesOrder::STATUS_DRAFT,
        ]);
        $item = SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity_ordered' => 10,
            'unit_price' => 5000,
            'unit' => 'pcs',
        ]);
        $so->recalculateTotal();

        $this->seedStock($product->id, $warehouse->id, $stockLocation->id, 100);

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.confirm', $so, false))
            ->assertSessionHas('success');

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.invoice', $so, false))
            ->assertSessionHas('error');

        $this->actingAs($user)->post(route('module.sales.sales-orders.gin.store', $so, false), [
            'warehouse_id' => $warehouse->id,
            'issued_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                ['so_item_id' => $item->id, 'quantity_issued' => 4],
            ],
        ])->assertSessionHas('success');

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.invoice', $so, false))
            ->assertRedirect();

        $invoice = Invoice::query()->latest('id')->first();
        $this->assertNotNull($invoice);
        $this->assertSame($customer->id, $invoice->partner_id);
        $this->assertSame(Invoice::STATUS_DRAFT, $invoice->status);
        $this->assertEquals(20000, (float) $invoice->total);

        $ginItem = \Modules\Sales\Models\GoodsIssueNoteItem::query()->first();
        $this->assertNotNull($ginItem);

        $line = InvoiceLine::query()->where('invoice_id', $invoice->id)->first();
        $this->assertNotNull($line);
        $this->assertSame($ginItem->getMorphClass(), $line->source_type);
        $this->assertSame($ginItem->id, $line->source_id);

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.invoice', $so, false))
            ->assertSessionHas('error');

        $this->actingAs($user)->post(route('module.sales.sales-orders.gin.store', $so, false), [
            'warehouse_id' => $warehouse->id,
            'issued_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                ['so_item_id' => $item->id, 'quantity_issued' => 6],
            ],
        ])->assertSessionHas('success');

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.invoice', $so, false))
            ->assertRedirect();

        $second = Invoice::query()->latest('id')->first();
        $this->assertNotNull($second);
        $this->assertNotSame($invoice->id, $second->id);
        $this->assertEquals(30000, (float) $second->total);
    }
}
