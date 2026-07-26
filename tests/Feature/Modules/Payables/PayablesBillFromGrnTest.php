<?php

namespace Tests\Feature\Modules\Payables;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Warehouse;
use Modules\Partners\Models\Partner;
use Modules\Payables\Models\SupplierBill;
use Modules\Payables\Support\BillPaymentRecorder;
use Modules\Payables\Support\PurchaseBillService;
use Modules\Product\Models\Product;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\GoodReceiptNoteItem;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Models\PurchaseOrderItem;
use Modules\Purchasing\Support\GrnConfirmationService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PayablesBillFromGrnTest extends TestCase
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

    /**
     * @return array{0: GoodReceiptNote, 1: PurchaseOrderItem}
     */
    private function confirmedGrn(): array
    {
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
            'quantity_received' => 0,
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

        return [$grn->fresh(['items']), $poItem->fresh()];
    }

    public function test_bill_created_from_confirmed_grn_and_payment_settles(): void
    {
        $user = $this->createAdminUser();
        [$grn, $poItem] = $this->confirmedGrn();

        $this->actingAs($user)
            ->post(route('module.payables.grn.bill', $grn, false))
            ->assertRedirect();

        $bill = SupplierBill::query()->latest('id')->first();
        $this->assertNotNull($bill);
        $this->assertSame(SupplierBill::STATUS_DRAFT, $bill->status);
        $this->assertEquals(10000, (float) $bill->total);
        $this->assertSame($grn->id, $bill->good_receipt_note_id);

        $this->actingAs($user)
            ->post(route('module.payables.bills.issue', $bill, false))
            ->assertSessionHas('success');

        $bill->refresh();
        $this->assertSame(SupplierBill::STATUS_ISSUED, $bill->status);

        $payment = BillPaymentRecorder::record([
            'partner_id' => $bill->partner_id,
            'payment_date' => now()->toDateString(),
            'amount' => 10000,
            'method' => 'transfer',
            'allocations' => [
                ['supplier_bill_id' => $bill->id, 'amount' => 10000],
            ],
        ]);

        $this->assertEquals(10000, (float) $payment->amount);
        $bill->refresh();
        $this->assertSame(SupplierBill::STATUS_PAID, $bill->status);
        $this->assertEquals(10000, (float) $bill->amount_paid);

        $this->actingAs($user)
            ->post(route('module.payables.grn.bill', $grn, false))
            ->assertSessionHas('error');

        $this->assertFalse(app(PurchaseBillService::class)->hasBillableReceipt($grn->fresh(['items'])));
        $this->assertSame(1000.0, (float) $poItem->unit_price);
    }
}
