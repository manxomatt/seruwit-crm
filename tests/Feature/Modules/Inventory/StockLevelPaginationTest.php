<?php

namespace Tests\Feature\Modules\Inventory;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class StockLevelPaginationTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_stock_levels_index_paginates_products(): void
    {
        $user = $this->createAdminUser();
        Warehouse::factory()->create(['status' => 'active']);
        Product::factory()->count(20)->create();

        $this->actingAs($user)
            ->get(route('module.inventory.stock-levels.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Inventory/StockLevels/Index')
                ->has('matrix.data', 15)
                ->where('matrix.total', 20)
                ->where('matrix.per_page', 15)
                ->where('matrix.current_page', 1)
            );

        $this->actingAs($user)
            ->get(route('module.inventory.stock-levels.index', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('matrix.data', 5)
                ->where('matrix.current_page', 2)
            );
    }

    public function test_warehouse_show_paginates_stock_levels(): void
    {
        $user = $this->createAdminUser();
        $warehouse = Warehouse::factory()->create();

        StockLevel::factory()->count(20)->create([
            'warehouse_id' => $warehouse->id,
        ]);

        $this->actingAs($user)
            ->get(route('module.inventory.warehouses.show', $warehouse))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Inventory/Warehouses/Show')
                ->has('stockLevels.data', 15)
                ->where('stockLevels.total', 20)
                ->where('stockLevels.per_page', 15)
                ->where('stockLevels.current_page', 1)
                ->missing('warehouse.stock_levels')
            );

        $this->actingAs($user)
            ->get(route('module.inventory.warehouses.show', [
                'warehouse' => $warehouse,
                'stock_page' => 2,
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('stockLevels.data', 5)
                ->where('stockLevels.current_page', 2)
            );
    }

    public function test_warehouse_show_paginates_stock_movements(): void
    {
        $user = $this->createAdminUser();
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create();

        StockMovement::factory()->count(20)->create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'type' => 'in',
        ]);

        $this->actingAs($user)
            ->get(route('module.inventory.warehouses.show', $warehouse))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Inventory/Warehouses/Show')
                ->has('stockMovements.data', 15)
                ->where('stockMovements.total', 20)
                ->where('stockMovements.per_page', 15)
                ->where('stockMovements.current_page', 1)
                ->missing('warehouse.stock_movements')
            );

        $this->actingAs($user)
            ->get(route('module.inventory.warehouses.show', [
                'warehouse' => $warehouse,
                'movement_page' => 2,
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('stockMovements.data', 5)
                ->where('stockMovements.current_page', 2)
            );
    }
}
