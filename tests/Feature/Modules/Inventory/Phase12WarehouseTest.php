<?php

namespace Tests\Feature\Modules\Inventory;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockOpname;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Inventory\Support\PutawayService;
use Modules\Inventory\Support\SellableStock;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class Phase12WarehouseTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_opname_creates_one_line_per_stock_level_grain(): void
    {
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $stock = WarehouseLocation::query()->where('warehouse_id', $warehouse->id)->where('code', 'STOCK')->firstOrFail();
        $input = WarehouseLocation::query()->where('warehouse_id', $warehouse->id)->where('code', 'INPUT')->firstOrFail();
        $product = Product::factory()->create();

        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $stock->id,
            'batch_number' => 'A',
            'on_hand' => 10,
        ]);
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $input->id,
            'batch_number' => 'B',
            'on_hand' => 5,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.inventory.stock-opnames.store', [], false), [
                'warehouse_id' => $warehouse->id,
                'opname_date' => now()->toDateString(),
            ])
            ->assertRedirect();

        $opname = StockOpname::query()->latest('id')->firstOrFail();
        $this->assertEquals(2, $opname->items()->count());
        $this->assertEquals(10, (float) $opname->items()->where('batch_number', 'A')->value('system_qty'));
        $this->assertEquals(5, (float) $opname->items()->where('batch_number', 'B')->value('system_qty'));
    }

    public function test_expired_stock_is_excluded_from_fefo_allocate(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create(['tracking' => 'lot']);

        StockMovementRecorder::record([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'in',
            'quantity' => 20,
            'batch_number' => 'EXPIRED',
            'expiry_date' => now()->subDay()->toDateString(),
            'source_type' => 'manual',
            'recorded_at' => now(),
        ]);

        StockMovementRecorder::record([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'in',
            'quantity' => 15,
            'batch_number' => 'FRESH',
            'expiry_date' => now()->addMonth()->toDateString(),
            'source_type' => 'manual',
            'recorded_at' => now(),
        ]);

        StockMovementRecorder::record([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'out',
            'quantity' => 10,
            'source_type' => 'manual',
            'recorded_at' => now(),
        ]);

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'batch_number' => 'FRESH',
            'on_hand' => 5,
        ]);
        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'batch_number' => 'EXPIRED',
            'on_hand' => 20,
        ]);
    }

    public function test_putaway_moves_input_stock_to_stock_location(): void
    {
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();
        $input = WarehouseLocation::query()->where('warehouse_id', $warehouse->id)->where('code', 'INPUT')->firstOrFail();
        $stock = WarehouseLocation::query()->where('warehouse_id', $warehouse->id)->where('code', 'STOCK')->firstOrFail();
        $product = Product::factory()->create();

        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $input->id,
            'batch_number' => 'LOT1',
            'on_hand' => 40,
            'reserved' => 0,
            'expiry_date' => now()->addMonths(3),
        ]);

        PutawayService::relocate([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'from_location_id' => $input->id,
            'to_location_id' => $stock->id,
            'quantity' => 25,
            'batch_number' => 'LOT1',
            'expiry_date' => now()->addMonths(3)->toDateString(),
        ]);

        $this->assertEquals(15, (float) StockLevel::query()
            ->where('location_id', $input->id)
            ->where('batch_number', 'LOT1')
            ->value('on_hand'));
        $this->assertEquals(25, (float) StockLevel::query()
            ->where('location_id', $stock->id)
            ->where('batch_number', 'LOT1')
            ->value('on_hand'));

        $sellable = (float) SellableStock::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->sum('on_hand');
        $this->assertEquals(25, $sellable);
    }

    public function test_expiry_report_lists_near_expiry_stock(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create();
        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 8,
            'expiry_date' => now()->addDays(5),
        ]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.inventory.expiry-report.index', ['days' => 30], false))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Inventory/ExpiryReport/Index')
                ->has('levels', 1));
    }
}
