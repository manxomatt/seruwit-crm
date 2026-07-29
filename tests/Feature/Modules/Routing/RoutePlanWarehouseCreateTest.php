<?php

namespace Tests\Feature\Modules\Routing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Support\WarehouseKind;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Routing\Models\RoutePlan;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RoutePlanWarehouseCreateTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_create_page_lists_warehouses_and_scopes_orders(): void
    {
        $warehouse = Warehouse::factory()->create([
            'status' => 'active',
            'name' => 'Depo Utara',
            'latitude' => -6.1,
            'longitude' => 106.8,
        ]);
        Warehouse::factory()->asShowroom()->create([
            'status' => 'active',
            'name' => 'Showroom Kota',
            'latitude' => -6.2,
            'longitude' => 106.9,
        ]);

        $date = now()->toDateString();
        $visible = DeliveryOrder::factory()->confirmed()->create([
            'order_date' => $date,
            'delivery_lat' => -6.15,
            'delivery_lng' => 106.85,
        ]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.routing.plans.create', [
                'planned_date' => $date,
                'warehouse_id' => $warehouse->id,
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Routing/Plans/Create')
                ->has('warehouses', 1)
                ->where('warehouses.0.id', $warehouse->id)
                ->where('defaults.warehouse_id', $warehouse->id)
                ->where('defaults.depot_lat', -6.1)
                ->where('defaults.depot_lng', 106.8)
                ->has('orders', 1)
                ->where('orders.0.id', $visible->id)
            );
    }

    public function test_store_rejects_warehouse_without_coordinates(): void
    {
        $warehouse = Warehouse::factory()->create([
            'status' => 'active',
            'latitude' => null,
            'longitude' => null,
        ]);
        $order = DeliveryOrder::factory()->confirmed()->create([
            'order_date' => now()->toDateString(),
            'delivery_lat' => -6.21,
            'delivery_lng' => 106.81,
        ]);

        $this->actingAs($this->createAdminUser())
            ->from(route('module.routing.plans.create'))
            ->post(route('module.routing.plans.store'), [
                'warehouse_id' => $warehouse->id,
                'planned_date' => now()->toDateString(),
                'objective' => RoutePlan::OBJECTIVE_FUEL_COST,
                'delivery_order_ids' => [$order->id],
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('warehouse_id');
    }

    public function test_store_forces_depot_coords_from_warehouse(): void
    {
        $warehouse = Warehouse::factory()->create([
            'status' => 'active',
            'kind' => WarehouseKind::Store,
            'latitude' => -6.3012345,
            'longitude' => 106.8012345,
            'name' => 'Toko Selatan',
            'location' => 'Jl. Merdeka 1',
        ]);
        $order = DeliveryOrder::factory()->confirmed()->create([
            'order_date' => now()->toDateString(),
            'delivery_lat' => -6.31,
            'delivery_lng' => 106.81,
            'demand_kg' => 50,
        ]);

        \Modules\Fleet\Models\Vehicle::factory()->create([
            'status' => \Modules\Fleet\Models\Vehicle::STATUS_ACTIVE,
            'capacity_kg' => 2000,
            'cost_per_km' => 2000,
            'stnk_expires_at' => now()->addYear(),
            'kir_expires_at' => now()->addYear(),
        ]);
        \Modules\Fleet\Models\Driver::factory()->create([
            'status' => \Modules\Fleet\Models\Driver::STATUS_AVAILABLE,
            'license_expires_at' => now()->addYear(),
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.routing.plans.store'), [
                'warehouse_id' => $warehouse->id,
                'planned_date' => now()->toDateString(),
                'objective' => RoutePlan::OBJECTIVE_DISTANCE,
                'depot_lat' => -1.0,
                'depot_lng' => 1.0,
                'delivery_order_ids' => [$order->id],
            ])
            ->assertRedirect();

        $plan = RoutePlan::query()->first();
        $this->assertNotNull($plan);
        $this->assertSame($warehouse->id, $plan->warehouse_id);
        $this->assertEqualsWithDelta(-6.3012345, (float) $plan->depot_lat, 0.0000001);
        $this->assertEqualsWithDelta(106.8012345, (float) $plan->depot_lng, 0.0000001);
        $this->assertStringContainsString('Toko Selatan', (string) $plan->depot_address);
    }
}
