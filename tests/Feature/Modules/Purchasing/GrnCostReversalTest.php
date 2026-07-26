<?php

namespace Tests\Feature\Modules\Purchasing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\GoodReceiptNoteItem;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Models\PurchaseOrderItem;
use Modules\Purchasing\Support\GrnConfirmationService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class GrnCostReversalTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_void_grn_reverses_moving_average_cost(): void
    {
        $user = $this->createAdminUser();
        $supplier = Partner::factory()->supplier()->create();
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $input = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'INPUT')
            ->firstOrFail();

        $product = Product::factory()->create(['cost' => 1000]);
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $input->id,
            'on_hand' => 10,
            'reserved' => 0,
        ]);

        $po = PurchaseOrder::factory()->approved()->create([
            'partner_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
        ]);
        $poItem = PurchaseOrderItem::factory()->create([
            'purchase_order_id' => $po->id,
            'product_id' => $product->id,
            'quantity_ordered' => 10,
            'unit_price' => 2000,
        ]);

        $grn = GoodReceiptNote::factory()->create([
            'purchase_order_id' => $po->id,
            'warehouse_id' => $warehouse->id,
            'status' => GoodReceiptNote::STATUS_DRAFT,
        ]);
        GoodReceiptNoteItem::factory()->create([
            'good_receipt_note_id' => $grn->id,
            'po_item_id' => $poItem->id,
            'location_id' => $input->id,
            'quantity_received' => 10,
        ]);

        app(GrnConfirmationService::class)->confirm($grn);
        $this->assertEquals(1500, (float) $product->fresh()->cost);

        $this->actingAs($user)
            ->post(route('module.purchasing.grn.void', $grn, false))
            ->assertSessionHas('success');

        $this->assertEquals(1000, (float) $product->fresh()->cost);
    }
}
