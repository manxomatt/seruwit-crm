<?php

namespace Tests\Feature\Modules\ExecutiveDashboard;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Billing\Models\OrderCharge;
use Modules\ExecutiveDashboard\Support\ExecutiveMetricsAggregator;
use Modules\Fleet\Models\Vehicle;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Invoicing\Models\Invoice;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Product\Models\Product;
use Modules\Routing\Models\RoutePlan;
use Modules\Routing\Models\RoutePlanRoute;
use Modules\Routing\Models\RoutePlanStop;
use Modules\TransportationManagement\Models\Trip;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ExecutiveDashboardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_authenticated_user_can_view_executive_dashboard(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.bi.dashboard', ['period' => 'week']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/ExecutiveDashboard/Index')
                ->has('metrics.otd')
                ->has('metrics.fleet_utilization')
                ->has('metrics.aging_ar')
                ->has('metrics.inventory_turnover')
                ->has('metrics.revenue_per_route')
                ->where('period', 'week')
            );
    }

    public function test_otd_rate_counts_on_time_deliveries_against_promised_at(): void
    {
        DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_DELIVERED,
            'promised_at' => now()->addHour(),
            'delivered_at' => now()->subMinutes(30),
        ]);
        DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_DELIVERED,
            'promised_at' => now()->subHours(2),
            'delivered_at' => now()->subMinutes(10),
        ]);
        DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_DELIVERED,
            'promised_at' => null,
            'delivered_at' => now(),
        ]);

        $range = $this->weekRange();
        $otd = app(ExecutiveMetricsAggregator::class)->otdRate($range);

        $this->assertNotNull($otd);
        $this->assertSame(1, $otd['on_time']);
        $this->assertSame(2, $otd['with_sla']);
        $this->assertSame(1, $otd['late']);
        $this->assertSame(50.0, $otd['rate']);
        $this->assertSame(3, $otd['delivered']);
    }

    public function test_fleet_utilization_uses_trip_days_over_capacity(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        Trip::factory()->create([
            'vehicle_id' => $vehicle->id,
            'status' => Trip::STATUS_COMPLETED,
            'scheduled_at' => now()->startOfWeek()->addDay()->setTime(8, 0),
        ]);
        Trip::factory()->create([
            'vehicle_id' => $vehicle->id,
            'status' => Trip::STATUS_COMPLETED,
            'scheduled_at' => now()->startOfWeek()->addDays(2)->setTime(8, 0),
        ]);

        $range = $this->weekRange();
        $fleet = app(ExecutiveMetricsAggregator::class)->fleetUtilization($range);

        $this->assertNotNull($fleet);
        $this->assertSame(2, $fleet['active_vehicles']);
        $this->assertSame(2, $fleet['trip_days']);
        $this->assertSame(14, $fleet['capacity_days']);
        $this->assertSame(14.3, $fleet['rate']);
    }

    public function test_aging_ar_reuses_receivables_report(): void
    {
        Invoice::factory()->issued()->create([
            'total' => 1_000_000,
            'amount_paid' => 0,
            'due_date' => now()->subDays(45)->toDateString(),
        ]);

        $aging = app(ExecutiveMetricsAggregator::class)->agingAr();

        $this->assertNotNull($aging);
        $this->assertSame(1, $aging['overdue_count']);
        $this->assertEquals(1_000_000.0, $aging['overdue_amount']);
        $this->assertEquals(1_000_000.0, $aging['buckets']['31_60']);
    }

    public function test_inventory_turnover_divides_cogs_by_stock_value(): void
    {
        $product = Product::factory()->create(['cost' => 1000]);
        $warehouse = Warehouse::factory()->create();

        StockLevel::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 100,
        ]);

        StockMovement::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'out',
            'quantity' => 50,
            'recorded_at' => now(),
        ]);

        $range = $this->weekRange();
        $inventory = app(ExecutiveMetricsAggregator::class)->inventoryTurnover($range);

        $this->assertNotNull($inventory);
        $this->assertEquals(50_000.0, $inventory['cogs']);
        $this->assertEquals(100_000.0, $inventory['inventory_value']);
        $this->assertEquals(0.5, $inventory['turnover']);
    }

    public function test_revenue_per_route_sums_order_charges_on_applied_plans(): void
    {
        $vehicle = Vehicle::factory()->create();
        $orderA = DeliveryOrder::factory()->create();
        $orderB = DeliveryOrder::factory()->create();

        OrderCharge::factory()->create(['delivery_order_id' => $orderA->id, 'amount' => 200_000]);
        OrderCharge::factory()->create(['delivery_order_id' => $orderB->id, 'amount' => 100_000]);

        $plan = RoutePlan::query()->create([
            'code' => 'RP-BI-1',
            'status' => RoutePlan::STATUS_APPLIED,
            'objective' => RoutePlan::OBJECTIVE_DISTANCE,
            'planned_date' => now()->toDateString(),
            'depot_lat' => -6.2,
            'depot_lng' => 106.8,
            'applied_at' => now(),
        ]);

        $route = RoutePlanRoute::query()->create([
            'route_plan_id' => $plan->id,
            'sequence' => 1,
            'vehicle_id' => $vehicle->id,
            'load_kg' => 100,
            'estimated_distance_km' => 40,
        ]);

        RoutePlanStop::query()->create([
            'route_plan_route_id' => $route->id,
            'delivery_order_id' => $orderA->id,
            'sequence' => 1,
            'address' => 'Stop A',
            'lat' => -6.21,
            'lng' => 106.81,
            'demand_kg' => 50,
        ]);
        RoutePlanStop::query()->create([
            'route_plan_route_id' => $route->id,
            'delivery_order_id' => $orderB->id,
            'sequence' => 2,
            'address' => 'Stop B',
            'lat' => -6.22,
            'lng' => 106.82,
            'demand_kg' => 50,
        ]);

        $range = $this->weekRange();
        $revenue = app(ExecutiveMetricsAggregator::class)->revenuePerRoute($range);

        $this->assertNotNull($revenue);
        $this->assertSame(1, $revenue['route_count']);
        $this->assertEquals(300_000.0, $revenue['total_revenue']);
        $this->assertEquals(300_000.0, $revenue['average']);
        $this->assertTrue($revenue['billing_available']);
    }

    /**
     * @return array{start: Carbon, end: Carbon, previous_start: Carbon, previous_end: Carbon}
     */
    private function weekRange(): array
    {
        $now = Carbon::now();

        return [
            'start' => $now->copy()->startOfWeek(),
            'end' => $now->copy()->endOfWeek(),
            'previous_start' => $now->copy()->subWeek()->startOfWeek(),
            'previous_end' => $now->copy()->subWeek()->endOfWeek(),
        ];
    }
}
