<?php

namespace Tests\Feature\Modules\Inventory;

use Database\Seeders\TenantStockLevelDemoSeeder;
use Database\Seeders\TenantWarehouseDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Product\Models\Product;
use Tests\TestCase;

class TenantStockLevelDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_stock_into_three_warehouses_and_leaves_two_empty(): void
    {
        $this->seed(TenantWarehouseDemoSeeder::class);

        Product::factory()->count(8)->create([
            'status' => 'active',
            'category' => 'merchandise',
            'is_storable' => true,
        ]);

        $this->seed(TenantStockLevelDemoSeeder::class);

        $stocked = [
            'Gudang Pusat Bandar Lampung',
            'Gudang Cabang Metro',
            'Gudang Cold Storage',
        ];
        $empty = [
            'Gudang Transit Bakauheni',
            'Gudang Sparepart Pringsewu',
        ];

        foreach ($stocked as $name) {
            $warehouse = Warehouse::query()->where('name', $name)->firstOrFail();
            $this->assertGreaterThan(
                0,
                StockLevel::query()->where('warehouse_id', $warehouse->id)->count(),
                "{$name} should have stock levels.",
            );
        }

        foreach ($empty as $name) {
            $warehouse = Warehouse::query()->where('name', $name)->firstOrFail();
            $this->assertSame(
                0,
                StockLevel::query()->where('warehouse_id', $warehouse->id)->count(),
                "{$name} should remain empty.",
            );
        }

        $this->assertSame(8 * 3, StockLevel::query()->count());
        $this->assertTrue(
            StockLevel::query()->where('on_hand', '>', 0)->exists(),
        );
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantWarehouseDemoSeeder::class);

        Product::factory()->count(5)->create([
            'status' => 'active',
            'category' => 'merchandise',
            'is_storable' => true,
        ]);

        $this->seed(TenantStockLevelDemoSeeder::class);
        $this->seed(TenantStockLevelDemoSeeder::class);

        $this->assertSame(5 * 3, StockLevel::query()->count());
    }
}
