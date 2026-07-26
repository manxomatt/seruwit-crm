<?php

namespace Tests\Feature\Modules\Inventory;

use App\Models\User;
use Database\Seeders\TenantWarehouseUsersDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Support\AccessibleWarehouses;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class WarehouseUsersDemoSeederTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpRoles();
    }

    public function test_seeds_warehouse_head_and_manager_with_site_assignments(): void
    {
        $pusat = Warehouse::factory()->create(['name' => 'Gudang Pusat']);
        $cabang = Warehouse::factory()->create(['name' => 'Gudang Cabang']);
        Warehouse::factory()->create(['name' => 'Gudang Lain']);

        $this->seed(TenantWarehouseUsersDemoSeeder::class);

        $head = User::query()->where('email', TenantWarehouseUsersDemoSeeder::HEAD_EMAIL)->first();
        $manager = User::query()->where('email', TenantWarehouseUsersDemoSeeder::MANAGER_EMAIL)->first();

        $this->assertNotNull($head);
        $this->assertNotNull($manager);
        $this->assertTrue($head->hasRole(AccessibleWarehouses::ROLE_HEAD));
        $this->assertTrue($manager->hasRole(AccessibleWarehouses::ROLE_MANAGER));
        $this->assertEqualsCanonicalizing([$pusat->id], $head->warehouses()->pluck('warehouses.id')->all());
        $this->assertEqualsCanonicalizing(
            [$pusat->id, $cabang->id],
            $manager->warehouses()->pluck('warehouses.id')->all(),
        );
    }

    public function test_seeder_is_idempotent(): void
    {
        Warehouse::factory()->count(2)->create();

        $this->seed(TenantWarehouseUsersDemoSeeder::class);
        $this->seed(TenantWarehouseUsersDemoSeeder::class);

        $this->assertSame(
            1,
            User::query()->where('email', TenantWarehouseUsersDemoSeeder::HEAD_EMAIL)->count(),
        );
        $this->assertSame(
            1,
            User::query()->where('email', TenantWarehouseUsersDemoSeeder::MANAGER_EMAIL)->count(),
        );
    }
}
