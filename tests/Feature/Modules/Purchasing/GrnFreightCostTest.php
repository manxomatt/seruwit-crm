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

class GrnFreightCostTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_freight_is_allocated_into_moving_average_cost(): void
    {
        $supplier = Partner::factory()->supplier()->create();
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $input = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'INPUT')
            ->firstOrFail();

        $product = Product::factory()->create(['cost' => 0]);

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
            'freight_amount' => 500,
        ]);
        GoodReceiptNoteItem::factory()->create([
            'good_receipt_note_id' => $grn->id,
            'po_item_id' => $poItem->id,
            'location_id' => $input->id,
            'quantity_received' => 10,
        ]);

        app(GrnConfirmationService::class)->confirm($grn);

        // (10 * 1000 + 500) / 10 = 1050
        $this->assertEquals(1050, (float) $product->fresh()->cost);
    }

    public function test_void_grn_with_freight_reverses_landed_cost(): void
    {
        $user = $this->createAdminUser();
        $supplier = Partner::factory()->supplier()->create();
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $input = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'INPUT')
            ->firstOrFail();

        $product = Product::factory()->create(['cost' => 800]);
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
            'unit_price' => 1000,
        ]);

        $grn = GoodReceiptNote::factory()->create([
            'purchase_order_id' => $po->id,
            'warehouse_id' => $warehouse->id,
            'status' => GoodReceiptNote::STATUS_DRAFT,
            'freight_amount' => 500,
        ]);
        GoodReceiptNoteItem::factory()->create([
            'good_receipt_note_id' => $grn->id,
            'po_item_id' => $poItem->id,
            'location_id' => $input->id,
            'quantity_received' => 10,
        ]);

        app(GrnConfirmationService::class)->confirm($grn);
        // (10*800 + 10*1050) / 20 = 925
        $this->assertEquals(925, (float) $product->fresh()->cost);

        $this->actingAs($user)
            ->post(route('module.purchasing.grn.void', $grn, false))
            ->assertSessionHas('success');

        $this->assertEquals(800, (float) $product->fresh()->cost);
    }
}
