<?php

namespace Tests\Feature\Modules\Inventory;

use Database\Seeders\TenantWarehouseDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Tests\TestCase;

class TenantWarehouseDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_five_warehouses_with_default_and_rack_locations(): void
    {
        $this->seed(TenantWarehouseDemoSeeder::class);

        $warehouses = Warehouse::query()->with('locations')->get();

        $this->assertCount(5, $warehouses);
        $this->assertTrue(
            $warehouses->every(fn (Warehouse $warehouse) => $warehouse->status === 'active'),
        );
        $this->assertTrue(
            $warehouses->every(fn (Warehouse $warehouse) => filled($warehouse->location)),
        );
        $this->assertTrue(
            $warehouses->every(fn (Warehouse $warehouse) => $warehouse->locations->contains('code', 'STOCK')),
            'Every warehouse should have a default STOCK location.',
        );
        $this->assertTrue(
            $warehouses->every(fn (Warehouse $warehouse) => $warehouse->locations->count() >= 5),
            'Every warehouse should have default locations plus at least two racks.',
        );
        $this->assertGreaterThan(
            5,
            WarehouseLocation::query()->where('is_default', false)->count(),
        );
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantWarehouseDemoSeeder::class);
        $this->seed(TenantWarehouseDemoSeeder::class);

        $this->assertSame(5, Warehouse::query()->count());
    }
}
