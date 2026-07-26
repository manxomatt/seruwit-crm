<?php

namespace Tests\Feature\Modules\Purchasing;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Partners\Models\Partner;
use Modules\Payables\Models\SupplierBill;
use Modules\Payables\Support\PurchaseBillService;
use Modules\Product\Models\Product;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\GoodReceiptNoteItem;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Models\PurchaseOrderItem;
use Modules\Purchasing\Models\PurchaseReturn;
use Modules\Purchasing\Support\GrnConfirmationService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PurchaseReturnVoidTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();

        Setting::query()->updateOrCreate(
            ['key' => 'ecommerce.tax_enabled'],
            ['group' => 'ecommerce', 'value' => '0', 'type' => 'boolean', 'label' => 'Enable Tax']
        );
    }

    public function test_void_purchase_return_restores_stock_and_voids_ap_credit(): void
    {
        $user = $this->createAdminUser();
        $supplier = Partner::factory()->supplier()->create();
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $stockLocation = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        $product = Product::factory()->create(['cost' => 800]);
        $po = PurchaseOrder::factory()->approved()->create([
            'partner_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
        ]);

        $poItem = PurchaseOrderItem::factory()->create([
            'purchase_order_id' => $po->id,
            'product_id' => $product->id,
            'quantity_ordered' => 50,
            'quantity_received' => 0,
            'unit_price' => 800,
        ]);

        $grn = GoodReceiptNote::factory()->create([
            'purchase_order_id' => $po->id,
            'warehouse_id' => $warehouse->id,
            'status' => GoodReceiptNote::STATUS_DRAFT,
        ]);

        $grnItem = GoodReceiptNoteItem::factory()->create([
            'good_receipt_note_id' => $grn->id,
            'po_item_id' => $poItem->id,
            'location_id' => $stockLocation->id,
            'quantity_received' => 50,
        ]);

        app(GrnConfirmationService::class)->confirm($grn);
        $bill = app(PurchaseBillService::class)->createFromGrn($grn->fresh(['items']));
        $bill->update(['status' => SupplierBill::STATUS_ISSUED]);

        $this->actingAs($user)->post(route('module.purchasing.grn.return.store', $grn, false), [
            'returned_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                [
                    'grn_item_id' => $grnItem->id,
                    'po_item_id' => $poItem->id,
                    'quantity_returned' => 20,
                    'location_id' => $stockLocation->id,
                ],
            ],
        ])->assertSessionHas('success');

        $purchaseReturn = PurchaseReturn::query()->latest('id')->firstOrFail();
        $credit = SupplierBill::query()
            ->where('id', '!=', $bill->id)
            ->latest('id')
            ->first();
        $this->assertNotNull($credit);
        $this->assertLessThan(0, (float) $credit->total);

        $onHandAfterReturn = (float) StockLevel::query()
            ->where('product_id', $product->id)
            ->where('location_id', $stockLocation->id)
            ->value('on_hand');

        $this->actingAs($user)
            ->post(route('module.purchasing.returns.void', $purchaseReturn, false))
            ->assertSessionHas('success');

        $this->assertSame(PurchaseReturn::STATUS_VOIDED, $purchaseReturn->fresh()->status);
        $this->assertSame(SupplierBill::STATUS_VOID, $credit->fresh()->status);
        $this->assertEquals(50, (float) $poItem->fresh()->quantity_received);
        $this->assertEquals($onHandAfterReturn + 20, (float) StockLevel::query()
            ->where('product_id', $product->id)
            ->where('location_id', $stockLocation->id)
            ->value('on_hand'));
    }
}
