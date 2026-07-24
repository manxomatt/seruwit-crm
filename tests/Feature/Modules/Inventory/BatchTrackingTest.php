<?php

namespace Tests\Feature\Modules\Inventory;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Inventory\Support\StockPickingStrategy;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class BatchTrackingTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_inbound_with_batch_creates_batch_stock_level(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create(['tracking' => 'lot']);

        StockMovementRecorder::record([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'in',
            'quantity' => 50,
            'batch_number' => 'LOT-A',
            'expiry_date' => now()->addMonths(6)->toDateString(),
            'source_type' => 'manual',
            'recorded_at' => now(),
        ]);

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'batch_number' => 'LOT-A',
            'on_hand' => 50,
        ]);
    }

    public function test_fefo_out_consumes_earliest_expiry_first(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create(['tracking' => 'lot']);

        StockMovementRecorder::record([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'in',
            'quantity' => 30,
            'batch_number' => 'LOT-LATE',
            'expiry_date' => now()->addYear()->toDateString(),
            'source_type' => 'manual',
            'recorded_at' => now(),
        ]);

        StockMovementRecorder::record([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'in',
            'quantity' => 20,
            'batch_number' => 'LOT-EARLY',
            'expiry_date' => now()->addMonth()->toDateString(),
            'source_type' => 'manual',
            'recorded_at' => now(),
        ]);

        StockMovementRecorder::record([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'out',
            'quantity' => 25,
            'source_type' => 'manual',
            'recorded_at' => now(),
        ], StockPickingStrategy::Fefo);

        $early = StockLevel::query()->where('batch_number', 'LOT-EARLY')->first();
        $late = StockLevel::query()->where('batch_number', 'LOT-LATE')->first();

        $this->assertEquals(0, (float) $early->on_hand);
        $this->assertEquals(25, (float) $late->on_hand);

        $outMovements = StockMovement::query()->where('type', 'out')->orderBy('id')->get();
        $this->assertCount(2, $outMovements);
        $this->assertSame('LOT-EARLY', $outMovements[0]->batch_number);
        $this->assertEquals(20, (float) $outMovements[0]->quantity);
        $this->assertSame('LOT-LATE', $outMovements[1]->batch_number);
        $this->assertEquals(5, (float) $outMovements[1]->quantity);
    }

    public function test_fifo_out_consumes_oldest_level_first(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create();

        StockMovementRecorder::record([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'in',
            'quantity' => 10,
            'batch_number' => 'LOT-1',
            'source_type' => 'manual',
            'recorded_at' => now(),
        ]);

        StockMovementRecorder::record([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'in',
            'quantity' => 10,
            'batch_number' => 'LOT-2',
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
        ], StockPickingStrategy::Fifo);

        $this->assertEquals(0, (float) StockLevel::query()->where('batch_number', 'LOT-1')->value('on_hand'));
        $this->assertEquals(10, (float) StockLevel::query()->where('batch_number', 'LOT-2')->value('on_hand'));
    }

    public function test_manual_movement_can_store_batch_via_http(): void
    {
        $warehouse = Warehouse::factory()->create(['status' => 'active']);
        $product = Product::factory()->create();

        $this->actingAs($this->createAdminUser())->post(route('module.inventory.stock-movements.store', [], false), [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'in',
            'quantity' => 15,
            'batch_number' => 'LOT-HTTP',
            'expiry_date' => now()->addMonths(3)->toDateString(),
        ])->assertRedirect();

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'batch_number' => 'LOT-HTTP',
            'type' => 'in',
        ]);

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'batch_number' => 'LOT-HTTP',
            'on_hand' => 15,
        ]);
    }

    public function test_grn_batch_still_lands_on_stock_level(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create();

        StockMovementRecorder::record([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'in',
            'quantity' => 40,
            'batch_number' => 'GRN-LOT',
            'expiry_date' => now()->addMonths(8)->toDateString(),
            'source_type' => 'grn',
            'recorded_at' => now(),
        ]);

        $level = StockLevel::query()
            ->where('product_id', $product->id)
            ->where('batch_number', 'GRN-LOT')
            ->first();

        $this->assertNotNull($level);
        $this->assertEquals(40, (float) $level->on_hand);
        $this->assertNotNull($level->expiry_date);
    }
}
