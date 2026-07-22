<?php

namespace Tests\Feature\Modules\Maintenance;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Maintenance\Support\MaintenanceStockRecorder;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class WorkOrderStockDeductionTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    private function category(): MaintenanceCategory
    {
        return MaintenanceCategory::create(['key' => 'general', 'name' => 'General', 'sort_order' => 1]);
    }

    private function sparepart(Warehouse $warehouse, int $onHand = 50): Product
    {
        $product = Product::factory()->create([
            'category' => 'fleet_sparepart',
            'warehouse_id' => $warehouse->id,
        ]);

        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => $onHand,
            'reserved' => 0,
        ]);

        return $product;
    }

    public function test_completing_a_work_order_via_the_endpoint_deducts_sparepart_stock(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = $this->sparepart($warehouse, 50);
        $vehicle = Vehicle::factory()->create();
        $category = $this->category();

        $workOrder = WorkOrder::factory()->inProgress()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
        ]);
        $item = $workOrder->items()->create([
            'item_type' => 'part',
            'product_id' => $product->id,
            'name' => 'Kampas rem',
            'quantity' => 4,
            'unit_price' => 0,
            'total_price' => 0,
        ]);

        $this->actingAs($this->createAdminUser())->patch(
            route('module.maintenance.work-orders.update', $workOrder, false),
            [
                'vehicle_id' => $vehicle->id,
                'category_id' => $category->id,
                'title' => $workOrder->title,
                'status' => 'completed',
                'priority' => 'normal',
                'type' => 'corrective',
                'items' => [[
                    'id' => $item->id,
                    'item_type' => 'part',
                    'product_id' => $product->id,
                    'name' => 'Kampas rem',
                    'quantity' => 4,
                    'unit_price' => 0,
                    'total_price' => 0,
                ]],
            ],
        );

        $movement = StockMovement::where('source_type', 'maintenance')
            ->where('source_id', $workOrder->id)
            ->first();

        $this->assertNotNull($movement);
        $this->assertSame('out', $movement->type);
        $this->assertEquals(4, $movement->quantity);

        $this->assertEquals(46, StockLevel::where('product_id', $product->id)->value('on_hand'));
        $this->assertNotNull($workOrder->fresh()->stock_deducted_at);
    }

    public function test_reopening_a_completed_work_order_returns_the_stock(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = $this->sparepart($warehouse, 50);

        $workOrder = WorkOrder::factory()->completed()->create([
            'vehicle_id' => Vehicle::factory(),
            'category_id' => $this->category()->id,
        ]);
        $workOrder->items()->create([
            'item_type' => 'part',
            'product_id' => $product->id,
            'name' => 'Filter oli',
            'quantity' => 6,
            'unit_price' => 0,
            'total_price' => 0,
        ]);

        MaintenanceStockRecorder::deduct($workOrder->load('items.product'));
        $this->assertEquals(44, StockLevel::where('product_id', $product->id)->value('on_hand'));

        MaintenanceStockRecorder::reverse($workOrder->fresh()->load('items.product'));

        $this->assertEquals(50, StockLevel::where('product_id', $product->id)->value('on_hand'));
        $this->assertNull($workOrder->fresh()->stock_deducted_at);
        $this->assertEquals(1, StockMovement::where('source_id', $workOrder->id)->where('type', 'in')->count());
    }

    public function test_free_text_parts_without_a_product_do_not_move_stock(): void
    {
        $workOrder = WorkOrder::factory()->inProgress()->create([
            'vehicle_id' => Vehicle::factory(),
            'category_id' => $this->category()->id,
        ]);
        $workOrder->items()->create([
            'item_type' => 'part',
            'product_id' => null,
            'name' => 'Baut generik',
            'quantity' => 10,
            'unit_price' => 0,
            'total_price' => 0,
        ]);

        MaintenanceStockRecorder::deduct($workOrder->load('items.product'));

        $this->assertEquals(0, StockMovement::count());
    }

    public function test_merchandise_products_are_never_consumed_by_maintenance(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create(['category' => 'merchandise', 'warehouse_id' => $warehouse->id]);
        StockLevel::factory()->create(['product_id' => $product->id, 'warehouse_id' => $warehouse->id, 'on_hand' => 30]);

        $workOrder = WorkOrder::factory()->inProgress()->create([
            'vehicle_id' => Vehicle::factory(),
            'category_id' => $this->category()->id,
        ]);
        $workOrder->items()->create([
            'item_type' => 'part',
            'product_id' => $product->id,
            'name' => 'Barang dagangan',
            'quantity' => 3,
            'unit_price' => 0,
            'total_price' => 0,
        ]);

        MaintenanceStockRecorder::deduct($workOrder->load('items.product'));

        $this->assertEquals(0, StockMovement::count());
        $this->assertEquals(30, StockLevel::where('product_id', $product->id)->value('on_hand'));
    }

    public function test_deduction_is_idempotent(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = $this->sparepart($warehouse, 50);

        $workOrder = WorkOrder::factory()->completed()->create([
            'vehicle_id' => Vehicle::factory(),
            'category_id' => $this->category()->id,
        ]);
        $workOrder->items()->create([
            'item_type' => 'part',
            'product_id' => $product->id,
            'name' => 'Busi',
            'quantity' => 5,
            'unit_price' => 0,
            'total_price' => 0,
        ]);

        MaintenanceStockRecorder::deduct($workOrder->load('items.product'));
        MaintenanceStockRecorder::deduct($workOrder->fresh()->load('items.product'));

        $this->assertEquals(1, StockMovement::where('source_id', $workOrder->id)->count());
        $this->assertEquals(45, StockLevel::where('product_id', $product->id)->value('on_hand'));
    }
}
