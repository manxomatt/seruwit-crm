<?php

namespace Tests\Feature\Modules\Inventory;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Support\AccessibleWarehouses;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class WarehouseAccessScopeTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_warehouse_head_only_sees_assigned_site(): void
    {
        $mine = Warehouse::factory()->create(['name' => 'Toko Saya']);
        $other = Warehouse::factory()->create(['name' => 'Gudang Lain']);

        $head = $this->createScopedUser(AccessibleWarehouses::ROLE_HEAD, [$mine->id]);

        $this->actingAs($head)
            ->get(route('module.inventory.warehouses.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('warehouses', 1)
                ->where('warehouses.0.name', 'Toko Saya'));

        $this->actingAs($head)
            ->get(route('module.inventory.warehouses.show', $other))
            ->assertForbidden();

        $this->actingAs($head)
            ->get(route('module.inventory.warehouses.show', $mine))
            ->assertOk();
    }

    public function test_warehouse_manager_sees_multiple_assigned_sites(): void
    {
        $a = Warehouse::factory()->create(['name' => 'Site A']);
        $b = Warehouse::factory()->create(['name' => 'Site B']);
        Warehouse::factory()->create(['name' => 'Site C']);

        $manager = $this->createScopedUser(AccessibleWarehouses::ROLE_MANAGER, [$a->id, $b->id]);

        $this->actingAs($manager)
            ->get(route('module.inventory.warehouses.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('warehouses', 2)
                ->where('warehouses', fn ($warehouses) => collect($warehouses)->pluck('name')->sort()->values()->all() === ['Site A', 'Site B']));
    }

    public function test_warehouse_head_cannot_be_assigned_two_sites(): void
    {
        $admin = $this->createAdminUser();
        $role = Role::query()->where('slug', AccessibleWarehouses::ROLE_HEAD)->firstOrFail();
        $a = Warehouse::factory()->create();
        $b = Warehouse::factory()->create();

        $this->actingAs($admin)->post(route('module.users.store'), [
            'name' => 'Kepala Toko',
            'email' => 'head@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'roles' => [$role->id],
            'warehouse_ids' => [$a->id, $b->id],
        ])->assertSessionHasErrors('warehouse_ids');
    }

    public function test_sales_order_rejects_unassigned_warehouse_for_head(): void
    {
        $mine = Warehouse::factory()->create();
        $other = Warehouse::factory()->create();
        $head = $this->createScopedUser(AccessibleWarehouses::ROLE_HEAD, [$mine->id]);
        $customer = \Modules\Partners\Models\Partner::factory()->create(['customer_rank' => 1, 'supplier_rank' => 0]);
        $product = \Modules\Product\Models\Product::factory()->create(['status' => 'active']);

        $this->actingAs($head)->post(route('module.sales.sales-orders.store'), [
            'partner_id' => $customer->id,
            'warehouse_id' => $other->id,
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

    public function test_admin_remains_unrestricted(): void
    {
        Warehouse::factory()->count(3)->create();
        $admin = $this->createAdminUser();

        $this->actingAs($admin)
            ->get(route('module.inventory.warehouses.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('warehouses', 3));
    }

    /**
     * @param  list<int>  $warehouseIds
     */
    protected function createScopedUser(string $roleSlug, array $warehouseIds): User
    {
        $user = User::factory()->create();
        $role = Role::query()->where('slug', $roleSlug)->firstOrFail();
        $user->assignRole($role);
        $user->warehouses()->sync($warehouseIds);

        return $user;
    }
}
