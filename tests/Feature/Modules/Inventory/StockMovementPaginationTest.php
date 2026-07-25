<?php

namespace Tests\Feature\Modules\Inventory;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class StockMovementPaginationTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_stock_movements_index_paginates_results(): void
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
            ->get(route('module.inventory.stock-movements.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Inventory/StockMovements/Index')
                ->has('movements.data', 15)
                ->where('movements.total', 20)
                ->where('movements.per_page', 15)
                ->where('movements.current_page', 1)
            );

        $this->actingAs($user)
            ->get(route('module.inventory.stock-movements.index', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('movements.data', 5)
                ->where('movements.current_page', 2)
            );
    }
}
