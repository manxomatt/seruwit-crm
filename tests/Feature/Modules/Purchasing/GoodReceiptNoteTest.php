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
use Modules\Purchasing\Support\GrnConfirmationService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class GoodReceiptNoteTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * @return array{0: PurchaseOrder, 1: PurchaseOrderItem, 2: PurchaseOrderItem}
     */
    private function approvedPoWithTwoItems(): array
    {
        $supplier = Partner::factory()->supplier()->create();
        $warehouse = Warehouse::factory()->create();
        $productA = Product::factory()->create();
        $productB = Product::factory()->create();

        $po = PurchaseOrder::factory()->approved()->create([
            'partner_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
        ]);

        $itemA = PurchaseOrderItem::factory()->create([
            'purchase_order_id' => $po->id,
            'product_id' => $productA->id,
            'quantity_ordered' => 100,
            'quantity_received' => 0,
            'unit_price' => 1000,
        ]);

        $itemB = PurchaseOrderItem::factory()->create([
            'purchase_order_id' => $po->id,
            'product_id' => $productB->id,
            'quantity_ordered' => 200,
            'quantity_received' => 0,
            'unit_price' => 500,
        ]);

        return [$po, $itemA, $itemB];
    }

    public function test_grn_confirm_creates_stock_movements_and_updates_levels(): void
    {
        $user = $this->createAdminUser();
        [$po, $itemA] = $this->approvedPoWithTwoItems();
        $location = WarehouseLocation::factory()->create(['warehouse_id' => $po->warehouse_id]);

        $this->actingAs($user)->post(route('module.purchasing.purchase-orders.grn.store', $po, false), [
            'warehouse_id' => $po->warehouse_id,
            'received_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                [
                    'po_item_id' => $itemA->id,
                    'quantity_received' => 60,
                    'location_id' => $location->id,
                    'batch_number' => 'LOT-240724',
                    'expiry_date' => now()->addYear()->toDateString(),
                ],
            ],
        ])->assertSessionHas('success');

        $grnItem = GoodReceiptNoteItem::query()->first();
        $this->assertNotNull($grnItem);

        $movement = StockMovement::query()
            ->where('source_type', 'grn')
            ->where('source_id', $grnItem->id)
            ->first();

        $this->assertNotNull($movement);
        $this->assertSame('in', $movement->type);
        $this->assertEquals(60, (float) $movement->quantity);
        $this->assertSame('LOT-240724', $movement->batch_number);
        $this->assertNotNull($movement->expiry_date);

        $level = StockLevel::query()
            ->where('product_id', $itemA->product_id)
            ->where('warehouse_id', $po->warehouse_id)
            ->where('location_id', $location->id)
            ->first();

        $this->assertNotNull($level);
        $this->assertEquals(60, (float) $level->on_hand);
        $this->assertEquals(60, (float) $itemA->fresh()->quantity_received);
        $this->assertSame(PurchaseOrder::STATUS_PARTIAL_RECEIVED, $po->fresh()->status);
    }

    public function test_po_becomes_fully_received_when_all_quantities_met(): void
    {
        $user = $this->createAdminUser();
        [$po, $itemA, $itemB] = $this->approvedPoWithTwoItems();

        $this->actingAs($user)->post(route('module.purchasing.purchase-orders.grn.store', $po, false), [
            'warehouse_id' => $po->warehouse_id,
            'received_at' => now()->toDateString(),
            'confirm' => true,
            'items' => [
                ['po_item_id' => $itemA->id, 'quantity_received' => 100],
                ['po_item_id' => $itemB->id, 'quantity_received' => 200],
            ],
        ])->assertSessionHas('success');

        $this->assertSame(PurchaseOrder::STATUS_FULLY_RECEIVED, $po->fresh()->status);
    }

    public function test_quantity_exceeding_remaining_returns_validation_error(): void
    {
        $user = $this->createAdminUser();
        [$po, $itemA] = $this->approvedPoWithTwoItems();
        $itemA->update(['quantity_received' => 90]);

        $this->actingAs($user)->post(route('module.purchasing.purchase-orders.grn.store', $po, false), [
            'warehouse_id' => $po->warehouse_id,
            'received_at' => now()->toDateString(),
            'items' => [
                ['po_item_id' => $itemA->id, 'quantity_received' => 20],
            ],
        ])->assertSessionHasErrors('items.0.quantity_received');
    }

    public function test_confirmed_grn_cannot_be_confirmed_again(): void
    {
        $user = $this->createAdminUser();
        [$po, $itemA] = $this->approvedPoWithTwoItems();

        $grn = GoodReceiptNote::factory()->create([
            'purchase_order_id' => $po->id,
            'warehouse_id' => $po->warehouse_id,
            'status' => GoodReceiptNote::STATUS_DRAFT,
        ]);

        GoodReceiptNoteItem::factory()->create([
            'good_receipt_note_id' => $grn->id,
            'po_item_id' => $itemA->id,
            'quantity_received' => 10,
        ]);

        $this->actingAs($user);
        app(GrnConfirmationService::class)->confirm($grn);

        $this->actingAs($user)
            ->post(route('module.purchasing.grn.confirm', $grn, false))
            ->assertSessionHas('error');

        $this->assertEquals(1, StockMovement::query()->where('source_type', 'grn')->count());
    }

    public function test_draft_grn_can_be_saved_without_stock_movement(): void
    {
        $user = $this->createAdminUser();
        [$po, $itemA] = $this->approvedPoWithTwoItems();

        $this->actingAs($user)->post(route('module.purchasing.purchase-orders.grn.store', $po, false), [
            'warehouse_id' => $po->warehouse_id,
            'received_at' => now()->toDateString(),
            'confirm' => false,
            'items' => [
                ['po_item_id' => $itemA->id, 'quantity_received' => 25],
            ],
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('good_receipt_notes', [
            'purchase_order_id' => $po->id,
            'status' => GoodReceiptNote::STATUS_DRAFT,
        ]);
        $this->assertEquals(0, StockMovement::query()->count());
        $this->assertEquals(0, (float) $itemA->fresh()->quantity_received);
    }
}
