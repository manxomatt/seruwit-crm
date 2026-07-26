<?php

namespace Tests\Feature\Modules\Routing;

use Database\Seeders\TenantRoutingDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Partners\Models\Partner;
use Tests\TestCase;

class RoutingDemoSeederTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_seeder_is_idempotent_for_orders(): void
    {
        Partner::factory()->create(['customer_rank' => 1, 'supplier_rank' => 0]);

        $this->seed(TenantRoutingDemoSeeder::class);
        $count = DeliveryOrder::query()->where('notes', 'like', '%'.TenantRoutingDemoSeeder::TAG.'%')->count();

        $this->seed(TenantRoutingDemoSeeder::class);

        $this->assertSame(
            $count,
            DeliveryOrder::query()->where('notes', 'like', '%'.TenantRoutingDemoSeeder::TAG.'%')->count(),
        );
    }
}
