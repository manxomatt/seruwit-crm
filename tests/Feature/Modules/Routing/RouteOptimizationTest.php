<?php

namespace Tests\Feature\Modules\Routing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Routing\Models\RoutePlan;
use Modules\Routing\Support\ClarkeWrightSolver;
use Modules\Routing\Support\FleetVrpSolver;
use Modules\Routing\Support\Haversine;
use Modules\Routing\Support\RouteOptimizationService;
use Modules\Routing\Support\RoutePlanApplier;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RouteOptimizationTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_haversine_distance_is_symmetric_and_positive(): void
    {
        $a = Haversine::distanceKm(-6.2, 106.8, -6.3, 106.9);
        $b = Haversine::distanceKm(-6.3, 106.9, -6.2, 106.8);

        $this->assertGreaterThan(0, $a);
        $this->assertEqualsWithDelta($a, $b, 0.001);
    }

    public function test_clarke_wright_merges_nearby_stops_within_capacity(): void
    {
        $solver = new ClarkeWrightSolver;
        $routes = $solver->solve(
            -6.2,
            106.8,
            [
                ['id' => 1, 'lat' => -6.21, 'lng' => 106.81, 'demand' => 100],
                ['id' => 2, 'lat' => -6.22, 'lng' => 106.82, 'demand' => 100],
                ['id' => 3, 'lat' => -6.35, 'lng' => 106.95, 'demand' => 100],
            ],
            250,
        );

        $this->assertNotEmpty($routes);
        $this->assertLessThanOrEqual(3, count($routes));
        $this->assertSame(300.0, array_sum(array_column($routes, 'load')));
    }

    public function test_fleet_vrp_prefers_cheaper_vehicle_for_fuel_cost_objective(): void
    {
        $solver = new FleetVrpSolver;
        $result = $solver->solve(
            -6.2,
            106.8,
            [
                ['id' => 1, 'lat' => -6.21, 'lng' => 106.81, 'demand' => 50, 'address' => 'A'],
                ['id' => 2, 'lat' => -6.22, 'lng' => 106.82, 'demand' => 50, 'address' => 'B'],
            ],
            [
                ['id' => 10, 'capacity_kg' => 500, 'cost_per_km' => 9000],
                ['id' => 20, 'capacity_kg' => 500, 'cost_per_km' => 2000],
            ],
            'fuel_cost',
        );

        $this->assertCount(1, $result['routes']);
        $this->assertSame(20, $result['routes'][0]['vehicle_id']);
        $this->assertEmpty($result['unassigned_ids']);
    }

    public function test_optimize_and_apply_creates_trips_with_sequenced_stops(): void
    {
        $user = $this->createAdminUser();

        $cheap = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'capacity_kg' => 2000,
            'cost_per_km' => 2500,
            'stnk_expires_at' => now()->addYear(),
            'kir_expires_at' => now()->addYear(),
        ]);
        Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'capacity_kg' => 2000,
            'cost_per_km' => 8000,
            'stnk_expires_at' => now()->addYear(),
            'kir_expires_at' => now()->addYear(),
        ]);
        $driver = Driver::factory()->create([
            'status' => Driver::STATUS_AVAILABLE,
            'license_expires_at' => now()->addYear(),
        ]);
        Driver::factory()->create([
            'status' => Driver::STATUS_AVAILABLE,
            'license_expires_at' => now()->addYear(),
        ]);

        $date = now()->toDateString();
        $orders = collect([
            DeliveryOrder::factory()->confirmed()->create([
                'order_date' => $date,
                'delivery_lat' => -6.21,
                'delivery_lng' => 106.81,
                'demand_kg' => 100,
            ]),
            DeliveryOrder::factory()->confirmed()->create([
                'order_date' => $date,
                'delivery_lat' => -6.22,
                'delivery_lng' => 106.82,
                'demand_kg' => 120,
            ]),
            DeliveryOrder::factory()->confirmed()->create([
                'order_date' => $date,
                'delivery_lat' => -6.23,
                'delivery_lng' => 106.83,
                'demand_kg' => 80,
            ]),
        ]);

        $response = $this->actingAs($user)->post(route('module.routing.plans.store'), [
            'planned_date' => $date,
            'objective' => RoutePlan::OBJECTIVE_FUEL_COST,
            'depot_address' => 'Gudang Pusat',
            'depot_lat' => -6.2088,
            'depot_lng' => 106.8456,
            'delivery_order_ids' => $orders->pluck('id')->all(),
        ]);

        $plan = RoutePlan::query()->first();
        $this->assertNotNull($plan);
        $response->assertRedirect(route('module.routing.plans.show', $plan));

        $plan->load('routes.stops');
        $this->assertSame(RoutePlan::STATUS_OPTIMIZED, $plan->status);
        $this->assertGreaterThan(0, $plan->routes->count());
        $this->assertTrue($plan->routes->contains('vehicle_id', $cheap->id));
        $this->assertSame(3, $plan->routes->sum(fn ($r) => $r->stops->count()));

        $this->actingAs($user)
            ->post(route('module.routing.plans.apply', $plan))
            ->assertSessionHas('success');

        $plan->refresh();
        $this->assertSame(RoutePlan::STATUS_APPLIED, $plan->status);

        foreach ($orders as $order) {
            $order->refresh();
            $this->assertSame(DeliveryOrder::STATUS_ASSIGNED, $order->status);
            $this->assertNotNull($order->trip_id);
        }

        $this->assertSame($plan->routes->count(), Trip::query()->count());
        $this->assertSame(3, TripStop::query()->count());
        $this->assertTrue(Trip::query()->where('driver_id', $driver->id)->exists());
    }

    public function test_service_leaves_oversized_demand_unassigned(): void
    {
        Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'capacity_kg' => 100,
            'cost_per_km' => 2000,
            'stnk_expires_at' => now()->addYear(),
            'kir_expires_at' => now()->addYear(),
        ]);
        Driver::factory()->create([
            'status' => Driver::STATUS_AVAILABLE,
            'license_expires_at' => now()->addYear(),
        ]);

        $order = DeliveryOrder::factory()->confirmed()->create([
            'order_date' => now()->toDateString(),
            'delivery_lat' => -6.21,
            'delivery_lng' => 106.81,
            'demand_kg' => 500,
        ]);

        $plan = RoutePlan::query()->create([
            'code' => 'RP-TEST',
            'status' => RoutePlan::STATUS_DRAFT,
            'objective' => RoutePlan::OBJECTIVE_DISTANCE,
            'planned_date' => now()->toDateString(),
            'depot_lat' => -6.2,
            'depot_lng' => 106.8,
        ]);

        $optimized = app(RouteOptimizationService::class)->optimize($plan, [$order->id]);

        $this->assertSame(1, $optimized->unassigned_count);
        $this->assertSame(0, $optimized->routes()->count());
    }

    public function test_apply_requires_driver_on_every_route(): void
    {
        $plan = RoutePlan::query()->create([
            'code' => 'RP-NODRIVER',
            'status' => RoutePlan::STATUS_OPTIMIZED,
            'objective' => RoutePlan::OBJECTIVE_FUEL_COST,
            'planned_date' => now()->toDateString(),
            'depot_lat' => -6.2,
            'depot_lng' => 106.8,
        ]);
        $vehicle = Vehicle::factory()->create();
        $plan->routes()->create([
            'sequence' => 1,
            'vehicle_id' => $vehicle->id,
            'driver_id' => null,
            'load_kg' => 10,
            'estimated_distance_km' => 5,
            'estimated_cost' => 10000,
        ]);

        $this->expectException(\RuntimeException::class);
        app(RoutePlanApplier::class)->apply($plan);
    }
}
