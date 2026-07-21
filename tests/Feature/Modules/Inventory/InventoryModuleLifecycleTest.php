<?php

namespace Tests\Feature\Modules\Inventory;

use App\Modules\ModuleInstaller;
use Illuminate\Foundation\Testing\LazyLoadingViolationException;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\StockOpname;
use Modules\Inventory\Models\Warehouse;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class InventoryModuleLifecycleTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_inventory_tables_are_created_on_install(): void
    {
        $installer = app(ModuleInstaller::class);
        $installer->install('inventory');

        $this->assertDatabaseHasTable('warehouses');
        $this->assertDatabaseHasTable('stock_movements');
        $this->assertDatabaseHasTable('stock_levels');
        $this->assertDatabaseHasTable('stock_opnames');
        $this->assertDatabaseHasTable('stock_opname_items');
    }

    public function test_inventory_permissions_are_seeded(): void
    {
        $installer = app(ModuleInstaller::class);
        $installer->install('inventory');

        $this->assertDatabaseHas('permissions', ['module' => 'inventory', 'action' => 'view']);
        $this->assertDatabaseHas('permissions', ['module' => 'inventory', 'action' => 'create']);
        $this->assertDatabaseHas('permissions', ['module' => 'inventory', 'action' => 'update']);
        $this->assertDatabaseHas('permissions', ['module' => 'inventory', 'action' => 'adjust']);
    }

    public function test_warehouse_creation(): void
    {
        $warehouse = Warehouse::factory()->create();

        $this->assertDatabaseHas('warehouses', [
            'id' => $warehouse->id,
            'name' => $warehouse->name,
            'status' => 'active',
        ]);
    }

    public function test_stock_movement_creates_stock_level_cache(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = \Modules\Product\Models\Product::factory()->create();

        StockMovement::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'in',
            'quantity' => 100,
        ]);

        $level = StockLevel::where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();

        $this->assertNotNull($level);
        $this->assertEquals(100, $level->on_hand);
    }

    public function test_stock_level_available_quantity(): void
    {
        $level = StockLevel::factory()->create([
            'on_hand' => 100,
            'reserved' => 30,
        ]);

        $this->assertEquals(70, $level->getAvailableAttribute());
    }

    public function test_stock_opname_creation(): void
    {
        $warehouse = Warehouse::factory()->create();
        $user = \App\Models\User::factory()->create();

        $opname = StockOpname::factory()->create([
            'warehouse_id' => $warehouse->id,
            'created_by' => $user->id,
            'status' => 'draft',
        ]);

        $this->assertDatabaseHas('stock_opnames', [
            'id' => $opname->id,
            'status' => 'draft',
        ]);
    }
}
