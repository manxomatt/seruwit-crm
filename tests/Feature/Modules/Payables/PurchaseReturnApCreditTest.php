<?php

namespace Tests\Feature\Modules\Payables;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
use Modules\Purchasing\Support\GrnConfirmationService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PurchaseReturnApCreditTest extends TestCase
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

    public function test_purchase_return_creates_ap_credit_when_grn_was_billed(): void
    {
        $user = $this->createAdminUser();
        $supplier = Partner::factory()->supplier()->create();
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $stock = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        $product = Product::factory()->create(['cost' => 0]);
        $po = PurchaseOrder::factory()->approved()->create([
            'partner_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
        ]);
        $poItem = PurchaseOrderItem::factory()->create([
            'purchase_order_id' => $po->id,
            'product_id' => $product->id,
            'quantity_ordered' => 20,
            'unit_price' => 1000,
        ]);

        $grn = GoodReceiptNote::factory()->create([
            'purchase_order_id' => $po->id,
            'warehouse_id' => $warehouse->id,
            'status' => GoodReceiptNote::STATUS_DRAFT,
        ]);
        $grnItem = GoodReceiptNoteItem::factory()->create([
            'good_receipt_note_id' => $grn->id,
            'po_item_id' => $poItem->id,
            'location_id' => $stock->id,
            'quantity_received' => 20,
        ]);
        app(GrnConfirmationService::class)->confirm($grn);

        $bill = app(PurchaseBillService::class)->createFromGrn($grn->fresh(['items']));
        $bill->update(['status' => SupplierBill::STATUS_ISSUED]);
        $this->assertEquals(20000, (float) $bill->total);

        $this->actingAs($user)->post(route('module.purchasing.grn.return.store', $grn, false), [
            'returned_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                [
                    'grn_item_id' => $grnItem->id,
                    'po_item_id' => $poItem->id,
                    'quantity_returned' => 5,
                    'location_id' => $stock->id,
                ],
            ],
        ])->assertSessionHas('success');

        $credit = SupplierBill::query()->where('total', '<', 0)->latest('id')->first();
        $this->assertNotNull($credit);
        $this->assertSame(SupplierBill::STATUS_ISSUED, $credit->status);
        $this->assertEquals(-5000, (float) $credit->total);
        $this->assertEquals(-5000, $credit->balanceDue());
    }
}
