<?php

namespace Tests\Feature\Modules\Sales;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockReservation;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\GoodsIssueNoteItem;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;
use Modules\Sales\Models\SalesReturn;
use Modules\Sales\Support\GinConfirmationService;
use Modules\Sales\Support\SalesOrderConfirmationService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class SalesReturnRereserveAndVoidTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * @return array{0: GoodsIssueNote, 1: GoodsIssueNoteItem, 2: SalesOrderItem, 3: WarehouseLocation, 4: SalesOrder}
     */
    private function confirmedGin(): array
    {
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

        $ginItem = GoodsIssueNoteItem::factory()->create([
            'goods_issue_note_id' => $gin->id,
            'so_item_id' => $soItem->id,
            'location_id' => $stockLocation->id,
            'quantity_issued' => 40,
        ]);

        app(GinConfirmationService::class)->confirm($gin);

        return [$gin->fresh(), $ginItem->fresh(), $soItem->fresh(), $stockLocation, $so->fresh()];
    }

    public function test_sales_return_re_reserves_stock_for_open_order(): void
    {
        Setting::query()->updateOrCreate(
            ['key' => 'ecommerce.tax_enabled'],
            ['group' => 'ecommerce', 'value' => '0', 'type' => 'boolean', 'label' => 'Enable Tax']
        );

        $user = $this->createAdminUser();
        [$gin, $ginItem, $soItem, $location] = $this->confirmedGin();

        $this->assertEquals(0, (float) StockLevel::query()
            ->where('product_id', $soItem->product_id)
            ->where('location_id', $location->id)
            ->value('reserved'));

        $this->actingAs($user)->post(route('module.sales.gin.return.store', $gin, false), [
            'returned_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                [
                    'gin_item_id' => $ginItem->id,
                    'so_item_id' => $soItem->id,
                    'quantity_returned' => 15,
                    'location_id' => $location->id,
                ],
            ],
        ])->assertSessionHas('success');

        $this->assertEquals(15, (float) StockLevel::query()
            ->where('product_id', $soItem->product_id)
            ->where('location_id', $location->id)
            ->value('reserved'));

        $this->assertEquals(15, (float) StockReservation::query()
            ->where('sales_order_item_id', $soItem->id)
            ->where('status', StockReservation::STATUS_OPEN)
            ->sum('quantity'));
    }

    public function test_void_sales_return_releases_reservation_and_voids_credit(): void
    {
        if (! \Illuminate\Support\Facades\Schema::hasTable('invoices')) {
            $this->markTestSkipped('Invoicing tables are not available.');
        }

        Setting::query()->updateOrCreate(
            ['key' => 'ecommerce.tax_enabled'],
            ['group' => 'ecommerce', 'value' => '0', 'type' => 'boolean', 'label' => 'Enable Tax']
        );

        $user = $this->createAdminUser();
        [$gin, $ginItem, $soItem, $location] = $this->confirmedGin();

        $this->actingAs($user)->post(route('module.sales.gin.return.store', $gin, false), [
            'returned_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                [
                    'gin_item_id' => $ginItem->id,
                    'so_item_id' => $soItem->id,
                    'quantity_returned' => 10,
                    'location_id' => $location->id,
                ],
            ],
        ])->assertSessionHas('success');

        $salesReturn = SalesReturn::query()->latest('id')->firstOrFail();
        $credit = Invoice::query()->latest('id')->firstOrFail();
        $this->assertSame(Invoice::STATUS_ISSUED, $credit->status);

        $this->actingAs($user)
            ->post(route('module.sales.returns.void', $salesReturn, false))
            ->assertSessionHas('success');

        $this->assertSame(SalesReturn::STATUS_VOIDED, $salesReturn->fresh()->status);
        $this->assertSame(Invoice::STATUS_VOID, $credit->fresh()->status);
        $this->assertEquals(40, (float) $soItem->fresh()->quantity_delivered);
        $this->assertEquals(0, (float) StockLevel::query()
            ->where('product_id', $soItem->product_id)
            ->where('location_id', $location->id)
            ->value('reserved'));
    }
}
