<?php

namespace Tests\Feature\Modules\Purchasing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Warehouse;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\GoodReceiptNoteItem;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Models\PurchaseOrderItem;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PurchasingPdfTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_approved_po_streams_pdf(): void
    {
        $user = $this->createAdminUser();
        $po = PurchaseOrder::factory()->create([
            'partner_id' => Partner::factory()->create(['supplier_rank' => 1])->id,
            'warehouse_id' => Warehouse::factory()->create()->id,
            'status' => PurchaseOrder::STATUS_APPROVED,
        ]);
        PurchaseOrderItem::factory()->create([
            'purchase_order_id' => $po->id,
            'product_id' => Product::factory()->create()->id,
        ]);

        $this->actingAs($user)
            ->get(route('module.purchasing.purchase-orders.pdf', $po, false))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_draft_po_has_no_pdf(): void
    {
        $user = $this->createAdminUser();
        $po = PurchaseOrder::factory()->create([
            'status' => PurchaseOrder::STATUS_DRAFT,
        ]);

        $this->actingAs($user)
            ->get(route('module.purchasing.purchase-orders.pdf', $po, false))
            ->assertRedirect();
    }

    public function test_confirmed_grn_streams_pdf(): void
    {
        $user = $this->createAdminUser();
        $po = PurchaseOrder::factory()->create(['status' => PurchaseOrder::STATUS_APPROVED]);
        $item = PurchaseOrderItem::factory()->create(['purchase_order_id' => $po->id]);
        $grn = GoodReceiptNote::factory()->create([
            'purchase_order_id' => $po->id,
            'warehouse_id' => $po->warehouse_id,
            'status' => GoodReceiptNote::STATUS_CONFIRMED,
        ]);
        GoodReceiptNoteItem::factory()->create([
            'good_receipt_note_id' => $grn->id,
            'po_item_id' => $item->id,
            'quantity_received' => 5,
        ]);

        $this->actingAs($user)
            ->get(route('module.purchasing.grn.pdf', $grn, false))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }
}
