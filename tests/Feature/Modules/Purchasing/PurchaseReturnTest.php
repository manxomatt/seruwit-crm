<?php

namespace Tests\Feature\Modules\Purchasing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\GoodReceiptNoteItem;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Models\PurchaseOrderItem;
use Modules\Purchasing\Models\PurchaseReturn;
use Modules\Purchasing\Support\GrnConfirmationService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PurchaseReturnTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * @return array{0: GoodReceiptNote, 1: GoodReceiptNoteItem, 2: PurchaseOrderItem, 3: WarehouseLocation}
     */
    private function confirmedGrnAtStock(): array
    {
        $supplier = Partner::factory()->supplier()->create();
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $stockLocation = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();

        $product = Product::factory()->create();
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

        return [$grn->fresh(), $grnItem->fresh(), $poItem->fresh(), $stockLocation];
    }

    public function test_purchase_return_reduces_stock_and_received_qty(): void
    {
        $user = $this->createAdminUser();
        [$grn, $grnItem, $poItem, $location] = $this->confirmedGrnAtStock();

        $onHandBefore = (float) StockLevel::query()
            ->where('product_id', $poItem->product_id)
            ->where('location_id', $location->id)
            ->value('on_hand');

        $this->actingAs($user)->post(route('module.purchasing.grn.return.store', $grn, false), [
            'returned_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                [
                    'grn_item_id' => $grnItem->id,
                    'po_item_id' => $poItem->id,
                    'quantity_returned' => 20,
                    'location_id' => $location->id,
                ],
            ],
        ])->assertSessionHas('success');

        $purchaseReturn = PurchaseReturn::query()->latest('id')->first();
        $this->assertNotNull($purchaseReturn);
        $this->assertSame(PurchaseReturn::STATUS_CONFIRMED, $purchaseReturn->status);

        $movement = StockMovement::query()
            ->where('source_type', 'purchase_return')
            ->where('type', 'out')
            ->latest('id')
            ->first();

        $this->assertNotNull($movement);
        $this->assertEquals(20, (float) $movement->quantity);

        $onHandAfter = (float) StockLevel::query()
            ->where('product_id', $poItem->product_id)
            ->where('location_id', $location->id)
            ->value('on_hand');

        $this->assertEquals($onHandBefore - 20, $onHandAfter);
        $this->assertEquals(30, (float) $poItem->fresh()->quantity_received);
    }
}
