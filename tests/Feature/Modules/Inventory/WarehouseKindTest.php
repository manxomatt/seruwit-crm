<?php

namespace Tests\Feature\Modules\Inventory;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Support\WarehouseKind;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class WarehouseKindTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_can_create_store_and_showroom_sites(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.inventory.warehouses.store'), [
            'name' => 'Toko Pusat',
            'location' => 'Bandarlampung',
            'kind' => 'store',
            'status' => 'active',
        ])->assertRedirect(route('module.inventory.warehouses.index'));

        $this->assertDatabaseHas('warehouses', [
            'name' => 'Toko Pusat',
            'kind' => WarehouseKind::Store->value,
        ]);

        $this->actingAs($user)->post(route('module.inventory.warehouses.store'), [
            'name' => 'Showroom Display',
            'location' => 'Bandarlampung',
            'kind' => 'showroom',
            'status' => 'active',
        ])->assertRedirect();

        $this->assertDatabaseHas('warehouses', [
            'name' => 'Showroom Display',
            'kind' => WarehouseKind::Showroom->value,
        ]);
    }

    public function test_index_can_filter_by_kind(): void
    {
        $user = $this->createAdminUser();
        Warehouse::factory()->create(['name' => 'WH', 'kind' => WarehouseKind::Warehouse]);
        Warehouse::factory()->asStore()->create(['name' => 'Toko']);
        Warehouse::factory()->asShowroom()->create(['name' => 'Show']);

        $this->actingAs($user)
            ->get(route('module.inventory.warehouses.index', ['kind' => 'store']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Inventory/Warehouses/Index')
                ->has('warehouses', 1)
                ->where('warehouses.0.name', 'Toko')
                ->where('filters.kind', 'store'));
    }

    public function test_sales_order_rejects_showroom_warehouse(): void
    {
        $user = $this->createAdminUser();
        $customer = Partner::factory()->create(['customer_rank' => 1, 'supplier_rank' => 0]);
        $product = Product::factory()->create(['status' => 'active']);
        $showroom = Warehouse::factory()->asShowroom()->create();

        $this->actingAs($user)->post(route('module.sales.sales-orders.store'), [
            'partner_id' => $customer->id,
            'warehouse_id' => $showroom->id,
            'ordered_at' => now()->toDateString(),
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity_ordered' => 1,
                    'unit_price' => 1000,
                ],
            ],
        ])->assertSessionHasErrors('warehouse_id');
    }

    public function test_purchase_order_rejects_showroom_warehouse(): void
    {
        $user = $this->createAdminUser();
        $supplier = Partner::factory()->create(['supplier_rank' => 1, 'customer_rank' => 0]);
        $product = Product::factory()->create(['status' => 'active']);
        $showroom = Warehouse::factory()->asShowroom()->create();

        $this->actingAs($user)->post(route('module.purchasing.purchase-orders.store'), [
            'partner_id' => $supplier->id,
            'warehouse_id' => $showroom->id,
            'ordered_at' => now()->toDateString(),
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity_ordered' => 1,
                    'unit_price' => 1000,
                ],
            ],
        ])->assertSessionHasErrors('warehouse_id');
    }

    public function test_store_kind_is_allowed_for_sales_and_purchase(): void
    {
        $user = $this->createAdminUser();
        $customer = Partner::factory()->create(['customer_rank' => 1, 'supplier_rank' => 0]);
        $supplier = Partner::factory()->create(['supplier_rank' => 1, 'customer_rank' => 0]);
        $product = Product::factory()->create(['status' => 'active']);
        $store = Warehouse::factory()->asStore()->create();

        $this->actingAs($user)->post(route('module.sales.sales-orders.store'), [
            'partner_id' => $customer->id,
            'warehouse_id' => $store->id,
            'ordered_at' => now()->toDateString(),
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity_ordered' => 1,
                    'unit_price' => 1000,
                ],
            ],
        ])->assertRedirect();

        $this->actingAs($user)->post(route('module.purchasing.purchase-orders.store'), [
            'partner_id' => $supplier->id,
            'warehouse_id' => $store->id,
            'ordered_at' => now()->toDateString(),
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity_ordered' => 1,
                    'unit_price' => 1000,
                ],
            ],
        ])->assertRedirect();
    }

    public function test_sales_create_excludes_showroom_from_warehouse_options(): void
    {
        $user = $this->createAdminUser();
        Warehouse::factory()->create(['name' => 'Gudang']);
        Warehouse::factory()->asStore()->create(['name' => 'Toko']);
        Warehouse::factory()->asShowroom()->create(['name' => 'Showroom']);

        $this->actingAs($user)
            ->get(route('module.sales.sales-orders.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('warehouses', 2)
                ->where('warehouses', fn ($warehouses) => collect($warehouses)->pluck('name')->sort()->values()->all() === ['Gudang', 'Toko']));
    }
}
