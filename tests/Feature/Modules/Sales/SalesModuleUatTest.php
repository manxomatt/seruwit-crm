<?php

namespace Tests\Feature\Modules\Sales;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;
use Tests\TestCase;
use Tests\Traits\WithRoles;

/**
 * End-to-end UAT coverage for the Sales module happy path and key guards.
 */
class SalesModuleUatTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_uat_full_sales_cycle_from_draft_to_closed_with_invoice(): void
    {
        \App\Models\Setting::query()->updateOrCreate(
            ['key' => 'ecommerce.tax_enabled'],
            ['group' => 'ecommerce', 'value' => '0', 'type' => 'boolean', 'label' => 'Enable Tax']
        );

        $user = $this->createAdminUser();
        $customer = Partner::factory()->create([
            'customer_rank' => 1,
            'credit_limit' => null,
            'name' => 'UAT Customer',
        ]);
        $warehouse = Warehouse::factory()->create(['status' => 'active']);
        $warehouse->createDefaultLocations();
        $stockLocation = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        $product = Product::factory()->create([
            'status' => 'active',
            'name' => 'UAT Product',
            'price' => 25000,
            'category' => 'merchandise',
            'is_storable' => true,
        ]);

        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $stockLocation->id,
            'on_hand' => 200,
            'reserved' => 0,
        ]);

        $this->actingAs($user)
            ->get(route('module.sales.sales-orders.index', [], false))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Sales/SalesOrders/Index'));

        $this->actingAs($user)
            ->get(route('module.sales.sales-orders.create', [], false))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Sales/SalesOrders/Create')
                ->has('customers')
                ->has('products')
                ->has('warehouses'));

        $this->actingAs($user)->post(route('module.sales.sales-orders.store', [], false), [
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'ordered_at' => now()->toDateString(),
            'promised_at' => now()->addDays(3)->toDateString(),
            'notes' => 'UAT sales order',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity_ordered' => 40,
                    'unit_price' => 25000,
                    'unit' => 'pcs',
                ],
            ],
        ])->assertSessionHas('success');

        $so = SalesOrder::query()->where('notes', 'UAT sales order')->firstOrFail();
        $this->assertSame(SalesOrder::STATUS_DRAFT, $so->status);
        $this->assertEquals(1_000_000, (float) $so->total_amount);

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.confirm', $so, false))
            ->assertSessionHas('success');

        $this->assertSame(SalesOrder::STATUS_CONFIRMED, $so->fresh()->status);

        $this->actingAs($user)
            ->get(route('module.sales.sales-orders.gin.create', $so, false))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Sales/GoodsIssueNotes/Create')
                ->has('deliverableItems', 1)
                ->where('defaultStockLocationId', $stockLocation->id));

        $item = $so->items()->firstOrFail();

        $this->actingAs($user)->post(route('module.sales.sales-orders.gin.store', $so, false), [
            'warehouse_id' => $warehouse->id,
            'issued_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                [
                    'so_item_id' => $item->id,
                    'quantity_issued' => 25,
                    'location_id' => $stockLocation->id,
                ],
            ],
        ])->assertSessionHas('success');

        $so->refresh();
        $this->assertSame(SalesOrder::STATUS_PARTIAL_DELIVERED, $so->status);
        $this->assertEquals(25, (float) $item->fresh()->quantity_delivered);
        $this->assertEquals(1, GoodsIssueNote::query()->where('sales_order_id', $so->id)->count());
        $this->assertEquals(1, StockMovement::query()->where('source_type', 'gin')->count());
        $this->assertEquals(175, (float) StockLevel::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->where('location_id', $stockLocation->id)
            ->value('on_hand'));

        $this->actingAs($user)->post(route('module.sales.sales-orders.gin.store', $so, false), [
            'warehouse_id' => $warehouse->id,
            'issued_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                [
                    'so_item_id' => $item->id,
                    'quantity_issued' => 15,
                    'location_id' => $stockLocation->id,
                ],
            ],
        ])->assertSessionHas('success');

        $this->assertSame(SalesOrder::STATUS_FULLY_DELIVERED, $so->fresh()->status);
        $this->assertEquals(40, (float) $item->fresh()->quantity_delivered);

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.invoice', $so, false))
            ->assertRedirect();

        $invoice = Invoice::query()->where('partner_id', $customer->id)->latest('id')->firstOrFail();
        $this->assertSame(Invoice::STATUS_DRAFT, $invoice->status);
        $this->assertEquals(1_000_000, (float) $invoice->total);
        $this->assertEquals(2, InvoiceLine::query()->where('invoice_id', $invoice->id)->count());
        $this->assertTrue(
            InvoiceLine::query()
                ->where('invoice_id', $invoice->id)
                ->where('source_type', (new \Modules\Sales\Models\GoodsIssueNoteItem)->getMorphClass())
                ->exists()
        );

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.close', $so, false))
            ->assertSessionHas('success');

        $this->assertSame(SalesOrder::STATUS_CLOSED, $so->fresh()->status);

        $gin = GoodsIssueNote::query()->where('sales_order_id', $so->id)->latest('id')->firstOrFail();
        $this->actingAs($user)
            ->get(route('module.sales.gin.show', $gin, false))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Sales/GoodsIssueNotes/Show'));

        $movementsResponse = $this->actingAs($user)
            ->get(route('module.inventory.stock-movements.index', [], false))
            ->assertOk();

        $movementRows = collect($movementsResponse->viewData('page')['props']['movements']['data']);
        $this->assertTrue(
            $movementRows->contains(fn (array $row): bool => ($row['source_type'] ?? null) === 'gin' && ($row['gin_id'] ?? null) === $gin->id),
            'Stock movements index should deep-link the latest GIN.',
        );
    }

    public function test_uat_confirm_blocks_when_stock_is_insufficient(): void
    {
        $user = $this->createAdminUser();
        $customer = Partner::factory()->create(['customer_rank' => 1, 'credit_limit' => null]);
        $warehouse = Warehouse::factory()->create(['status' => 'active']);
        $warehouse->createDefaultLocations();
        $location = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();
        $product = Product::factory()->create(['status' => 'active', 'price' => 10000]);

        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $location->id,
            'on_hand' => 5,
            'reserved' => 0,
        ]);

        $so = SalesOrder::factory()->create([
            'partner_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'status' => SalesOrder::STATUS_DRAFT,
        ]);

        SalesOrderItem::factory()->create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'quantity_ordered' => 20,
            'unit_price' => 10000,
        ]);

        $this->actingAs($user)
            ->post(route('module.sales.sales-orders.confirm', $so, false))
            ->assertSessionHas('error');

        $this->assertSame(SalesOrder::STATUS_DRAFT, $so->fresh()->status);
    }
}
