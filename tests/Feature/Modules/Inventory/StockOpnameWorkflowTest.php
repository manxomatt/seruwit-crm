<?php

namespace Tests\Feature\Modules\Inventory;

use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\StockOpname;
use Modules\Inventory\Models\StockOpnameItem;
use Modules\Inventory\Models\Warehouse;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class StockOpnameWorkflowTest extends TestCase
{
    use WithRoles, WithTenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpRoles();
    }

    public function test_opname_can_be_created_in_draft_status(): void
    {
        $warehouse = Warehouse::factory()->create();
        $user = $this->createAdminUser();

        $response = $this->actingAs($user)->post(route('inventory.stock-opnames.store', [], false), [
            'warehouse_id' => $warehouse->id,
            'opname_date' => now()->toDateString(),
        ]);

        $this->assertDatabaseHas('stock_opnames', [
            'warehouse_id' => $warehouse->id,
            'status' => 'draft',
        ]);
    }

    public function test_opname_finalization_records_variance_adjustments(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create(['warehouse_id' => $warehouse->id]);

        // Setup initial stock
        $level = StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 100,
            'reserved' => 0,
        ]);

        // Create opname
        $opname = StockOpname::factory()->create([
            'warehouse_id' => $warehouse->id,
            'status' => 'in_progress',
        ]);

        // Create opname item with variance (system: 100, actual: 95)
        StockOpnameItem::factory()->create([
            'opname_id' => $opname->id,
            'product_id' => $product->id,
            'system_qty' => 100,
            'actual_qty' => 95,
        ]);

        // Finalize opname
        $this->actingAs($this->createAdminUser())->post(
            route('inventory.stock-opnames.finalize', $opname, false),
            ['items' => [['product_id' => $product->id, 'system_qty' => 100, 'actual_qty' => 95]]]
        );

        // Verify adjustment movement created (OUT for shortage)
        $movement = StockMovement::where('source_type', 'opname')
            ->where('source_id', $opname->id)
            ->first();

        $this->assertNotNull($movement);
        $this->assertEquals('out', $movement->type);
        $this->assertEquals(5, $movement->quantity);

        // Verify stock level updated (100 - 5 = 95)
        $level->refresh();
        $this->assertEquals(95, $level->on_hand);

        // Verify opname marked completed
        $opname->refresh();
        $this->assertEquals('completed', $opname->status);
        $this->assertNotNull($opname->completed_at);
    }

    public function test_opname_handles_stock_surplus(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create(['warehouse_id' => $warehouse->id]);

        $level = StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 100,
            'reserved' => 0,
        ]);

        $opname = StockOpname::factory()->create([
            'warehouse_id' => $warehouse->id,
            'status' => 'in_progress',
        ]);

        StockOpnameItem::factory()->create([
            'opname_id' => $opname->id,
            'product_id' => $product->id,
            'system_qty' => 100,
            'actual_qty' => 105,
        ]);

        // Finalize
        $this->actingAs($this->createAdminUser())->post(
            route('inventory.stock-opnames.finalize', $opname, false),
            ['items' => [['product_id' => $product->id, 'system_qty' => 100, 'actual_qty' => 105]]]
        );

        // Verify IN movement for surplus
        $movement = StockMovement::where('source_type', 'opname')
            ->where('source_id', $opname->id)
            ->first();

        $this->assertEquals('in', $movement->type);
        $this->assertEquals(5, $movement->quantity);

        // Verify stock updated (100 + 5 = 105)
        $level->refresh();
        $this->assertEquals(105, $level->on_hand);
    }

    public function test_opname_ignores_zero_variance(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create(['warehouse_id' => $warehouse->id]);

        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 100,
        ]);

        $opname = StockOpname::factory()->create([
            'warehouse_id' => $warehouse->id,
            'status' => 'in_progress',
        ]);

        StockOpnameItem::factory()->create([
            'opname_id' => $opname->id,
            'product_id' => $product->id,
            'system_qty' => 100,
            'actual_qty' => 100,
        ]);

        // Finalize
        $this->actingAs($this->createAdminUser())->post(
            route('inventory.stock-opnames.finalize', $opname, false),
            ['items' => [['product_id' => $product->id, 'system_qty' => 100, 'actual_qty' => 100]]]
        );

        // Verify no movement created
        $movements = StockMovement::where('source_type', 'opname')->count();
        $this->assertEquals(0, $movements);
    }
}
