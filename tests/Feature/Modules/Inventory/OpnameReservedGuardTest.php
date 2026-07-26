<?php

namespace Tests\Feature\Modules\Inventory;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockOpname;
use Modules\Inventory\Models\StockOpnameItem;
use Modules\Inventory\Models\Warehouse;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class OpnameReservedGuardTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_finalize_rejects_actual_below_reserved(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create();
        $level = StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 100,
            'reserved' => 40,
        ]);

        $opname = StockOpname::factory()->create([
            'warehouse_id' => $warehouse->id,
            'status' => 'in_progress',
        ]);

        StockOpnameItem::factory()->create([
            'opname_id' => $opname->id,
            'product_id' => $product->id,
            'location_id' => $level->location_id,
            'batch_number' => $level->batch_number ?? '',
            'system_qty' => 100,
            'actual_qty' => 20,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.inventory.stock-opnames.finalize', $opname, false))
            ->assertSessionHas('error');

        $this->assertSame('in_progress', $opname->fresh()->status);
        $this->assertEquals(100, (float) $level->fresh()->on_hand);
    }

    public function test_stock_movement_blocked_while_opname_in_progress(): void
    {
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $location = $warehouse->locations()->where('code', 'STOCK')->firstOrFail();
        $product = Product::factory()->create();

        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $location->id,
            'on_hand' => 50,
            'reserved' => 0,
        ]);

        StockOpname::factory()->create([
            'warehouse_id' => $warehouse->id,
            'status' => 'in_progress',
        ]);

        $this->expectException(\RuntimeException::class);

        \Modules\Inventory\Support\StockMovementRecorder::record([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $location->id,
            'type' => 'out',
            'quantity' => 1,
            'source_type' => 'manual',
            'allocate' => false,
        ]);
    }
}
