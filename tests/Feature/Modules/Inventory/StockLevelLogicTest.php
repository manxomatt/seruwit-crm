<?php

namespace Tests\Feature\Modules\Inventory;

use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithTenant;

class StockLevelLogicTest extends TestCase
{
    use WithTenant;

    public function test_stock_level_is_low_when_available_below_threshold(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create(['reorder_threshold' => 20]);

        $level = StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 15,
            'reserved' => 0,
        ]);

        $this->assertTrue($level->isLowStock());
    }

    public function test_stock_level_is_not_low_when_available_above_threshold(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create(['reorder_threshold' => 20]);

        $level = StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 50,
            'reserved' => 0,
        ]);

        $this->assertFalse($level->isLowStock());
    }

    public function test_available_quantity_respects_reserved_stock(): void
    {
        $level = StockLevel::factory()->create([
            'on_hand' => 100,
            'reserved' => 30,
        ]);

        $this->assertEquals(70, $level->getAvailableAttribute());
    }

    public function test_warehouse_active_status_check(): void
    {
        $activeWarehouse = Warehouse::factory()->create(['status' => 'active']);
        $inactiveWarehouse = Warehouse::factory()->create(['status' => 'inactive']);

        $this->assertTrue($activeWarehouse->isActive());
        $this->assertFalse($inactiveWarehouse->isActive());
    }
}
