<?php

namespace Tests\Feature\Modules\Payables;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Warehouse;
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

class SupplierBillTaxTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_bill_from_grn_applies_tax_from_settings(): void
    {
        Setting::query()->updateOrCreate(
            ['key' => 'ecommerce.tax_enabled'],
            ['group' => 'ecommerce', 'value' => '1', 'type' => 'boolean', 'label' => 'Enable Tax']
        );
        Setting::query()->updateOrCreate(
            ['key' => 'ecommerce.tax_rate'],
            ['group' => 'ecommerce', 'value' => '11', 'type' => 'number', 'label' => 'Tax Rate']
        );

        $supplier = Partner::factory()->supplier()->create();
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $product = Product::factory()->create();

        $po = PurchaseOrder::factory()->approved()->create([
            'partner_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
        ]);
        $poItem = PurchaseOrderItem::factory()->create([
            'purchase_order_id' => $po->id,
            'product_id' => $product->id,
            'quantity_ordered' => 10,
            'unit_price' => 1000,
        ]);

        $grn = GoodReceiptNote::factory()->create([
            'purchase_order_id' => $po->id,
            'warehouse_id' => $warehouse->id,
            'status' => GoodReceiptNote::STATUS_DRAFT,
        ]);
        GoodReceiptNoteItem::factory()->create([
            'good_receipt_note_id' => $grn->id,
            'po_item_id' => $poItem->id,
            'quantity_received' => 10,
        ]);

        app(GrnConfirmationService::class)->confirm($grn);

        $bill = app(PurchaseBillService::class)->createFromGrn($grn->fresh(['items']));

        $this->assertTrue($bill->tax_enabled);
        $this->assertEquals(11, (float) $bill->tax_rate);
        $this->assertEquals(10000, (float) $bill->subtotal);
        $this->assertEquals(1100, (float) $bill->tax_amount);
        $this->assertEquals(11100, (float) $bill->total);
        $this->assertSame(SupplierBill::STATUS_DRAFT, $bill->status);
    }
}
