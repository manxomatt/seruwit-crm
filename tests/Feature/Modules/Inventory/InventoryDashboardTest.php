<?php

namespace Tests\Feature\Modules\Inventory;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\StockOpname;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Inventory\Support\InventoryStatusBoard;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class InventoryDashboardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_inventory_dashboard(): void
    {
        $this->get(route('module.inventory.dashboard'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_inventory_dashboard(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.inventory.dashboard'))->assertForbidden();
    }

    public function test_inventory_dashboard_shows_status_board(): void
    {
        $warehouse = Warehouse::factory()->create(['status' => 'active', 'kind' => 'warehouse']);
        Warehouse::factory()->asStore()->create(['status' => 'inactive']);
        $warehouse->createDefaultLocations();

        $stock = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'STOCK')
            ->firstOrFail();
        $input = WarehouseLocation::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('code', 'INPUT')
            ->firstOrFail();

        $healthy = Product::factory()->create(['reorder_threshold' => 10]);
        $low = Product::factory()->create(['reorder_threshold' => 20]);

        StockLevel::factory()->create([
            'product_id' => $healthy->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $stock->id,
            'on_hand' => 100,
            'reserved' => 5,
        ]);
        StockLevel::factory()->create([
            'product_id' => $low->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $stock->id,
            'on_hand' => 8,
            'reserved' => 0,
            'expiry_date' => now()->addDays(5)->toDateString(),
        ]);
        StockLevel::factory()->create([
            'product_id' => $healthy->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $input->id,
            'on_hand' => 12,
            'reserved' => 0,
        ]);

        StockMovement::factory()->create([
            'product_id' => $healthy->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'in',
            'quantity' => 10,
            'recorded_at' => now(),
        ]);

        StockOpname::factory()->create([
            'warehouse_id' => $warehouse->id,
            'status' => 'draft',
        ]);

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.inventory.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Inventory/Dashboard/Index')
                ->where('board.warehouses.total', 2)
                ->where('board.warehouses.active', 1)
                ->where('board.warehouses.inactive', 1)
                ->where('board.warehouses.warehouse', 1)
                ->where('board.warehouses.store', 1)
                ->where('board.stock.low_stock', 1)
                ->where('board.stock.lines', 3)
                ->where('board.alerts.putaway_pending', 1)
                ->where('board.alerts.near_expiry', 1)
                ->where('board.alerts.opnames_open', 1)
                ->where('board.activity.movements_today', 1)
                ->has('board.recent', 1)
                ->has('board.sites')
                ->where('can.create', true)
                ->where('can.adjust', true)
            );
    }

    public function test_status_board_counts_expired_lots(): void
    {
        $warehouse = Warehouse::factory()->create();
        $product = Product::factory()->create(['reorder_threshold' => 5]);

        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 4,
            'reserved' => 0,
            'expiry_date' => now()->subDay()->toDateString(),
        ]);

        $board = app(InventoryStatusBoard::class)->build();

        $this->assertSame(1, $board['alerts']['expired']);
        $this->assertSame(1, $board['stock']['low_stock']);
    }

    public function test_warehouses_index_still_works(): void
    {
        Warehouse::factory()->create();
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.inventory.warehouses.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Inventory/Warehouses/Index'));
    }
}
