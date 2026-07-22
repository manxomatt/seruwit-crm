<?php

namespace Tests\Feature\Modules\Inventory;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Inventory\Support\StockMovementRecorder;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class WarehouseLocationTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_location_create(): void
    {
        $warehouse = Warehouse::factory()->create();

        $this->get(route('module.inventory.warehouses.locations.create', $warehouse))
            ->assertRedirect(route('login'));
    }

    public function test_warehouse_auto_creates_default_locations(): void
    {
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();

        $this->assertDatabaseHas('warehouse_locations', [
            'warehouse_id' => $warehouse->id,
            'code' => 'STOCK',
            'type' => 'internal',
            'is_default' => true,
        ]);
        $this->assertDatabaseHas('warehouse_locations', [
            'warehouse_id' => $warehouse->id,
            'code' => 'INPUT',
            'type' => 'input',
            'is_default' => true,
        ]);
        $this->assertDatabaseHas('warehouse_locations', [
            'warehouse_id' => $warehouse->id,
            'code' => 'OUTPUT',
            'type' => 'output',
            'is_default' => true,
        ]);
    }

    public function test_admin_can_create_a_location(): void
    {
        $user = $this->createAdminUser();
        $warehouse = Warehouse::factory()->create();

        $this->actingAs($user)
            ->post(route('module.inventory.warehouses.locations.store', $warehouse), [
                'name' => 'Rak A1',
                'code' => 'RAK-A1',
                'type' => 'internal',
                'sort_order' => 10,
            ])
            ->assertRedirect(route('module.inventory.warehouses.show', $warehouse));

        $this->assertDatabaseHas('warehouse_locations', [
            'warehouse_id' => $warehouse->id,
            'name' => 'Rak A1',
            'code' => 'RAK-A1',
            'type' => 'internal',
        ]);
    }

    public function test_location_code_must_be_unique_per_warehouse(): void
    {
        $user = $this->createAdminUser();
        $warehouse = Warehouse::factory()->create();
        WarehouseLocation::factory()->create([
            'warehouse_id' => $warehouse->id,
            'code' => 'RAK-A1',
        ]);

        $this->actingAs($user)
            ->post(route('module.inventory.warehouses.locations.store', $warehouse), [
                'name' => 'Rak A1 Duplikat',
                'code' => 'RAK-A1',
                'type' => 'internal',
            ])
            ->assertSessionHasErrors(['code']);
    }

    public function test_same_code_allowed_in_different_warehouse(): void
    {
        $user = $this->createAdminUser();
        $wh1 = Warehouse::factory()->create();
        $wh2 = Warehouse::factory()->create();
        WarehouseLocation::factory()->create(['warehouse_id' => $wh1->id, 'code' => 'RAK-A1']);

        $this->actingAs($user)
            ->post(route('module.inventory.warehouses.locations.store', $wh2), [
                'name' => 'Rak A1',
                'code' => 'RAK-A1',
                'type' => 'internal',
            ])
            ->assertRedirect(route('module.inventory.warehouses.show', $wh2));

        $this->assertDatabaseCount('warehouse_locations', 2);
    }

    public function test_admin_can_create_child_location(): void
    {
        $user = $this->createAdminUser();
        $warehouse = Warehouse::factory()->create();
        $parent = WarehouseLocation::factory()->create([
            'warehouse_id' => $warehouse->id,
            'code' => 'STOCK',
        ]);

        $this->actingAs($user)
            ->post(route('module.inventory.warehouses.locations.store', $warehouse), [
                'name' => 'Rak B2',
                'code' => 'RAK-B2',
                'type' => 'internal',
                'parent_id' => $parent->id,
            ])
            ->assertRedirect(route('module.inventory.warehouses.show', $warehouse));

        $this->assertDatabaseHas('warehouse_locations', [
            'code' => 'RAK-B2',
            'parent_id' => $parent->id,
        ]);
    }

    public function test_admin_can_update_a_location(): void
    {
        $user = $this->createAdminUser();
        $warehouse = Warehouse::factory()->create();
        $location = WarehouseLocation::factory()->create([
            'warehouse_id' => $warehouse->id,
            'name' => 'Old',
        ]);

        $this->actingAs($user)
            ->patch(route('module.inventory.warehouses.locations.update', [$warehouse, $location]), [
                'name' => 'New',
            ])
            ->assertRedirect(route('module.inventory.warehouses.show', $warehouse));

        $this->assertDatabaseHas('warehouse_locations', ['id' => $location->id, 'name' => 'New']);
    }

    public function test_admin_can_delete_a_location(): void
    {
        $user = $this->createAdminUser();
        $warehouse = Warehouse::factory()->create();
        $location = WarehouseLocation::factory()->create([
            'warehouse_id' => $warehouse->id,
            'is_default' => false,
        ]);

        $this->actingAs($user)
            ->delete(route('module.inventory.warehouses.locations.destroy', [$warehouse, $location]))
            ->assertRedirect(route('module.inventory.warehouses.show', $warehouse));

        $this->assertDatabaseMissing('warehouse_locations', ['id' => $location->id]);
    }

    public function test_default_location_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $warehouse = Warehouse::factory()->create();
        $location = WarehouseLocation::factory()->create([
            'warehouse_id' => $warehouse->id,
            'is_default' => true,
        ]);

        $this->actingAs($user)
            ->delete(route('module.inventory.warehouses.locations.destroy', [$warehouse, $location]))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('warehouse_locations', ['id' => $location->id]);
    }

    public function test_location_with_stock_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $warehouse = Warehouse::factory()->create();
        $location = WarehouseLocation::factory()->create([
            'warehouse_id' => $warehouse->id,
            'is_default' => false,
        ]);
        $product = \Modules\Product\Models\Product::factory()->create();

        StockMovementRecorder::record([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $location->id,
            'type' => 'in',
            'quantity' => 50,
            'source_type' => 'manual',
            'source_id' => null,
            'recorded_by' => null,
            'recorded_at' => now(),
        ]);

        $this->actingAs($user)
            ->delete(route('module.inventory.warehouses.locations.destroy', [$warehouse, $location]))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('warehouse_locations', ['id' => $location->id]);
    }

    public function test_location_with_children_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $warehouse = Warehouse::factory()->create();
        $parent = WarehouseLocation::factory()->create([
            'warehouse_id' => $warehouse->id,
            'is_default' => false,
        ]);
        WarehouseLocation::factory()->create([
            'warehouse_id' => $warehouse->id,
            'parent_id' => $parent->id,
        ]);

        $this->actingAs($user)
            ->delete(route('module.inventory.warehouses.locations.destroy', [$warehouse, $parent]))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('warehouse_locations', ['id' => $parent->id]);
    }

    public function test_stock_movement_with_location_updates_correct_level(): void
    {
        $warehouse = Warehouse::factory()->create();
        $location = WarehouseLocation::factory()->create(['warehouse_id' => $warehouse->id]);
        $product = \Modules\Product\Models\Product::factory()->create();

        StockMovementRecorder::record([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $location->id,
            'type' => 'in',
            'quantity' => 100,
            'source_type' => 'manual',
            'source_id' => null,
            'recorded_by' => null,
            'recorded_at' => now(),
        ]);

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'location_id' => $location->id,
            'on_hand' => 100,
        ]);
    }

    public function test_warehouse_show_displays_locations(): void
    {
        $user = $this->createAdminUser();
        $warehouse = Warehouse::factory()->create();
        $warehouse->createDefaultLocations();

        $this->actingAs($user)
            ->get(route('module.inventory.warehouses.show', $warehouse))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Inventory/Warehouses/Show')
                ->has('warehouse.locations', 3)
            );
    }

    public function test_warehouse_store_auto_creates_default_locations(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.inventory.warehouses.store'), [
            'name' => 'Gudang Baru',
            'location' => 'Jakarta',
            'status' => 'active',
        ])->assertRedirect();

        $warehouse = Warehouse::where('name', 'Gudang Baru')->first();
        $this->assertEquals(3, $warehouse->locations()->count());
    }

    public function test_full_code_accessor(): void
    {
        $warehouse = Warehouse::factory()->create();
        $parent = WarehouseLocation::factory()->create([
            'warehouse_id' => $warehouse->id,
            'code' => 'STOCK',
        ]);
        $child = WarehouseLocation::factory()->create([
            'warehouse_id' => $warehouse->id,
            'parent_id' => $parent->id,
            'code' => 'RAK-A1',
        ]);

        $child->load('parent');

        $this->assertEquals('STOCK/RAK-A1', $child->fullCode());
    }
}
