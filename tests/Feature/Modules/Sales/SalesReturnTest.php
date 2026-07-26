<?php

namespace Tests\Feature\Modules\Sales;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
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

class SalesReturnTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * @return array{0: GoodsIssueNote, 1: GoodsIssueNoteItem, 2: SalesOrderItem, 3: WarehouseLocation}
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

        return [$gin->fresh(), $ginItem->fresh(), $soItem->fresh(), $stockLocation];
    }

    public function test_sales_return_restores_stock_and_creates_credit_invoice(): void
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

        $onHandBefore = (float) StockLevel::query()
            ->where('product_id', $soItem->product_id)
            ->where('location_id', $location->id)
            ->value('on_hand');

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

        $salesReturn = SalesReturn::query()->latest('id')->first();
        $this->assertNotNull($salesReturn);
        $this->assertSame(SalesReturn::STATUS_CONFIRMED, $salesReturn->status);

        $movement = StockMovement::query()
            ->where('source_type', 'sales_return')
            ->where('type', 'in')
            ->latest('id')
            ->first();

        $this->assertNotNull($movement);
        $this->assertEquals(15, (float) $movement->quantity);

        $onHandAfter = (float) StockLevel::query()
            ->where('product_id', $soItem->product_id)
            ->where('location_id', $location->id)
            ->value('on_hand');

        $this->assertEquals($onHandBefore + 15, $onHandAfter);
        $this->assertEquals(25, (float) $soItem->fresh()->quantity_delivered);

        $credit = Invoice::query()->latest('id')->first();
        $this->assertNotNull($credit);
        $this->assertLessThan(0, (float) $credit->subtotal);
    }
}
