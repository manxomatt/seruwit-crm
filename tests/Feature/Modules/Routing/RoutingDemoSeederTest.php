<?php

namespace Tests\Feature\Modules\Routing;

use Database\Seeders\TenantRoutingDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Partners\Models\Partner;
use Modules\Routing\Models\RoutePlan;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RoutingDemoSeederTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_seeds_confirmed_geocoded_orders_and_ready_fleet(): void
    {
        Partner::factory()->create(['customer_rank' => 1, 'supplier_rank' => 0]);

        $this->seed(TenantRoutingDemoSeeder::class);

        $date = now()->toDateString();

        $this->assertGreaterThanOrEqual(
            12,
            DeliveryOrder::query()
                ->where('notes', 'like', '%'.TenantRoutingDemoSeeder::TAG.'%')
                ->where('status', DeliveryOrder::STATUS_CONFIRMED)
                ->whereDate('order_date', $date)
                ->whereNotNull('delivery_lat')
                ->whereNotNull('delivery_lng')
                ->whereNotNull('demand_kg')
                ->count(),
        );

        $this->assertGreaterThanOrEqual(4, Vehicle::query()->where('plate_number', 'like', 'BE RT %')->count());
        $this->assertTrue(
            Vehicle::query()
                ->where('plate_number', 'like', 'BE RT %')
                ->where('status', Vehicle::STATUS_ACTIVE)
                ->whereNotNull('capacity_kg')
                ->whereNotNull('cost_per_km')
                ->exists(),
        );
        $this->assertGreaterThanOrEqual(4, Driver::query()->where('name', 'like', 'Sopir Routing%')->count());
    }

    public function test_seeds_thirty_demo_route_plans(): void
    {
        Partner::factory()->create(['customer_rank' => 1, 'supplier_rank' => 0]);

        $this->seed(TenantRoutingDemoSeeder::class);

        $this->assertSame(
            TenantRoutingDemoSeeder::PLAN_COUNT,
            RoutePlan::query()->where('params->demo_tag', TenantRoutingDemoSeeder::TAG)->count(),
        );

        $this->assertGreaterThan(0, RoutePlan::query()->where('status', RoutePlan::STATUS_DRAFT)->count());
        $this->assertGreaterThan(0, RoutePlan::query()->where('status', RoutePlan::STATUS_OPTIMIZED)->count());
        $this->assertGreaterThan(0, RoutePlan::query()->where('status', RoutePlan::STATUS_APPLIED)->count());
    }

    public function test_seeder_is_idempotent(): void
    {
        Partner::factory()->create(['customer_rank' => 1, 'supplier_rank' => 0]);

        $this->seed(TenantRoutingDemoSeeder::class);
        $orderCount = DeliveryOrder::query()->where('notes', 'like', '%'.TenantRoutingDemoSeeder::TAG.'%')->count();
        $planCount = RoutePlan::query()->where('params->demo_tag', TenantRoutingDemoSeeder::TAG)->count();

        $this->seed(TenantRoutingDemoSeeder::class);

        $this->assertSame(
            $orderCount,
            DeliveryOrder::query()->where('notes', 'like', '%'.TenantRoutingDemoSeeder::TAG.'%')->count(),
        );
        $this->assertSame(
            $planCount,
            RoutePlan::query()->where('params->demo_tag', TenantRoutingDemoSeeder::TAG)->count(),
        );
    }

    public function test_plans_index_paginates_demo_results(): void
    {
        Partner::factory()->create(['customer_rank' => 1, 'supplier_rank' => 0]);
        $user = $this->createAdminUser();
        $this->seed(TenantRoutingDemoSeeder::class);

        $this->actingAs($user)
            ->get(route('module.routing.plans.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Routing/Plans/Index')
                ->where('plans.per_page', 15)
                ->where('plans.total', TenantRoutingDemoSeeder::PLAN_COUNT)
                ->where('plans.last_page', 2)
                ->has('plans.data', 15)
                ->has('plans.links')
                ->has('filters')
                ->has('can.create'));

        $this->actingAs($user)
            ->get(route('module.routing.plans.index', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('plans.data', 15));
    }
}
