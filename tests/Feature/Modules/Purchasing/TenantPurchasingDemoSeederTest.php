<?php

namespace Tests\Feature\Modules\Purchasing;

use Database\Seeders\TenantPurchasingDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Models\PurchaseOrderItem;
use Tests\TestCase;

class TenantPurchasingDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_ten_purchase_orders_with_consistent_grns(): void
    {
        Partner::factory()->supplier()->count(3)->create();
        Warehouse::factory()->create(['status' => 'active'])->createDefaultLocations();
        Product::factory()->count(8)->create([
            'status' => 'active',
            'category' => 'merchandise',
            'is_storable' => true,
        ]);

        $this->seed(TenantPurchasingDemoSeeder::class);

        $this->assertSame(10, PurchaseOrder::query()->where('notes', 'like', 'Demo PO #%')->count());

        $receivedStatuses = [
            PurchaseOrder::STATUS_PARTIAL_RECEIVED,
            PurchaseOrder::STATUS_FULLY_RECEIVED,
            PurchaseOrder::STATUS_CLOSED,
        ];

        $receivedOrders = PurchaseOrder::query()
            ->whereIn('status', $receivedStatuses)
            ->withCount('goodReceiptNotes')
            ->get();

        $this->assertGreaterThanOrEqual(4, $receivedOrders->count());
        $this->assertTrue(
            $receivedOrders->every(fn (PurchaseOrder $po): bool => $po->good_receipt_notes_count > 0),
            'Every received/closed PO must have at least one GRN.',
        );
        $this->assertGreaterThan(0, GoodReceiptNote::query()->where('status', GoodReceiptNote::STATUS_CONFIRMED)->count());
        $this->assertGreaterThan(0, StockMovement::query()->where('source_type', 'grn')->count());
        $this->assertSame(2, PurchaseOrder::query()->where('status', PurchaseOrder::STATUS_DRAFT)->count());
        $this->assertSame(1, PurchaseOrder::query()->where('status', PurchaseOrder::STATUS_CLOSED)->count());
    }

    public function test_repairs_received_orders_without_grn(): void
    {
        $supplier = Partner::factory()->supplier()->create();
        $warehouse = Warehouse::factory()->create(['status' => 'active']);
        $warehouse->createDefaultLocations();
        $product = Product::factory()->create(['status' => 'active', 'category' => 'merchandise']);

        $po = PurchaseOrder::factory()->create([
            'partner_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
            'status' => PurchaseOrder::STATUS_PARTIAL_RECEIVED,
            'notes' => 'Orphan received PO',
        ]);

        PurchaseOrderItem::factory()->create([
            'purchase_order_id' => $po->id,
            'product_id' => $product->id,
            'quantity_ordered' => 100,
            'quantity_received' => 40,
            'unit_price' => 1000,
        ]);

        $this->assertSame(0, $po->goodReceiptNotes()->count());

        $this->seed(TenantPurchasingDemoSeeder::class);

        $po->refresh();
        $this->assertGreaterThan(0, $po->goodReceiptNotes()->count());
        $this->assertDatabaseHas('stock_movements', [
            'source_type' => 'grn',
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'in',
            'quantity' => 40,
        ]);
    }

    public function test_repairs_orphan_received_status_without_items(): void
    {
        $supplier = Partner::factory()->supplier()->create();
        $warehouse = Warehouse::factory()->create(['status' => 'active']);

        $po = PurchaseOrder::factory()->create([
            'partner_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
            'status' => PurchaseOrder::STATUS_PARTIAL_RECEIVED,
            'notes' => 'Empty orphan PO',
        ]);

        $this->seed(TenantPurchasingDemoSeeder::class);

        $this->assertDatabaseMissing('purchase_orders', ['id' => $po->id]);
    }

    public function test_seeder_is_idempotent_for_demo_orders(): void
    {
        Partner::factory()->supplier()->count(3)->create();
        Warehouse::factory()->create(['status' => 'active'])->createDefaultLocations();
        Product::factory()->count(8)->create([
            'status' => 'active',
            'category' => 'merchandise',
            'is_storable' => true,
        ]);

        $this->seed(TenantPurchasingDemoSeeder::class);
        $this->seed(TenantPurchasingDemoSeeder::class);

        $this->assertSame(10, PurchaseOrder::query()->where('notes', 'like', 'Demo PO #%')->count());
    }
}
