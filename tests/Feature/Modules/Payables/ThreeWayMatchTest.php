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

class ThreeWayMatchTest extends TestCase
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
        Setting::query()->updateOrCreate(
            ['key' => 'payables.match_tolerance_amount'],
            ['group' => 'payables', 'value' => '0', 'type' => 'number', 'label' => 'Match Tolerance Amount']
        );
    }

    /**
     * @return array{0: SupplierBill, 1: GoodReceiptNote}
     */
    private function draftBillFromGrn(): array
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

        return [$bill, $grn->fresh()];
    }

    public function test_bill_lines_store_expected_amount_from_po_times_grn(): void
    {
        [$bill] = $this->draftBillFromGrn();
        $line = $bill->lines()->firstOrFail();

        $this->assertEquals(10000, (float) $line->amount);
        $this->assertEquals(10000, (float) $line->expected_amount);
    }

    public function test_issue_blocked_when_billed_amount_exceeds_tolerance(): void
    {
        $user = $this->createAdminUser();
        [$bill] = $this->draftBillFromGrn();
        $line = $bill->lines()->firstOrFail();

        $this->actingAs($user)
            ->patch(route('module.payables.bills.lines.update', [$bill, $line], false), [
                'amount' => 11000,
            ])
            ->assertSessionHas('success');

        $this->actingAs($user)
            ->post(route('module.payables.bills.issue', $bill, false))
            ->assertSessionHas('error');

        $this->assertSame(SupplierBill::STATUS_DRAFT, $bill->fresh()->status);
    }

    public function test_issue_allowed_when_variance_within_tolerance(): void
    {
        Setting::query()->updateOrCreate(
            ['key' => 'payables.match_tolerance_amount'],
            ['group' => 'payables', 'value' => '500', 'type' => 'number', 'label' => 'Match Tolerance Amount']
        );

        $user = $this->createAdminUser();
        [$bill] = $this->draftBillFromGrn();
        $line = $bill->lines()->firstOrFail();

        $this->actingAs($user)
            ->patch(route('module.payables.bills.lines.update', [$bill, $line], false), [
                'amount' => 10400,
            ])
            ->assertSessionHas('success');

        $this->actingAs($user)
            ->post(route('module.payables.bills.issue', $bill, false))
            ->assertSessionHas('success');

        $this->assertSame(SupplierBill::STATUS_ISSUED, $bill->fresh()->status);
        $this->assertEquals(10400, (float) $bill->fresh()->total);
    }
}
