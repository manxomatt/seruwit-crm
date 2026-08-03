<?php

namespace Tests\Feature\Modules\Maintenance;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Maintenance\Support\MaintenanceAnalyticsAggregator;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class MaintenanceAnalyticsTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    private function category(string $name = 'Oil'): MaintenanceCategory
    {
        return MaintenanceCategory::query()->create([
            'key' => 'cat_'.Str::lower(Str::random(8)),
            'name' => $name,
            'color' => 'blue',
            'sort_order' => 1,
        ]);
    }

    public function test_analytics_page_aggregates_costs_downtime_and_compliance(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create(['name' => 'Truck A', 'plate_number' => 'B 1 AA']);
        $category = $this->category();
        $vendor = Partner::factory()->create(['name' => 'Bengkel Prima', 'status' => 'active']);

        $onTimeDay = now()->startOfMonth()->addDays(2);
        $lateDay = now()->startOfMonth()->addDays(5);

        WorkOrder::factory()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'status' => WorkOrder::STATUS_COMPLETED,
            'type' => WorkOrder::TYPE_PREVENTIVE,
            'scheduled_date' => $onTimeDay->toDateString(),
            'started_at' => $onTimeDay->copy()->setTime(8, 0),
            'completed_at' => $onTimeDay->copy()->setTime(12, 0),
            'actual_labor_cost' => 200_000,
            'actual_parts_cost' => 100_000,
            'vendor_partner_id' => $vendor->id,
            'vendor_name' => $vendor->name,
        ]);

        WorkOrder::factory()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'status' => WorkOrder::STATUS_COMPLETED,
            'type' => WorkOrder::TYPE_PREVENTIVE,
            'scheduled_date' => $onTimeDay->toDateString(),
            'started_at' => $lateDay->copy()->setTime(9, 0),
            'completed_at' => $lateDay->copy()->setTime(11, 0),
            'actual_labor_cost' => 50_000,
            'actual_parts_cost' => 25_000,
            'vendor_partner_id' => null,
            'vendor_name' => null,
        ]);

        $this->actingAs($user)
            ->get(route('module.maintenance.analytics.index', [
                'from' => now()->startOfMonth()->toDateString(),
                'to' => now()->endOfMonth()->toDateString(),
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Maintenance/Analytics/Index')
                ->where('analytics.summary.work_order_count', 2)
                ->where('analytics.summary.total_cost', 375000)
                ->where('analytics.summary.avg_downtime_hours', 3)
                ->where('analytics.summary.compliance_pct', 50)
                ->has('analytics.by_vehicle', 1)
                ->has('analytics.by_category', 1)
                ->has('analytics.by_vendor', 1)
                ->has('analytics.monthly_costs', 12)
            );
    }

    public function test_aggregator_cost_by_vehicle_matches_completed_work_orders(): void
    {
        $vehicle = Vehicle::factory()->create();
        $category = $this->category('Brake');

        WorkOrder::factory()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'status' => WorkOrder::STATUS_COMPLETED,
            'completed_at' => now()->startOfMonth()->addDay()->setTime(15, 0),
            'started_at' => now()->startOfMonth()->addDay()->setTime(10, 0),
            'actual_labor_cost' => 150_000,
            'actual_parts_cost' => 50_000,
        ]);

        WorkOrder::factory()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'status' => WorkOrder::STATUS_IN_PROGRESS,
            'actual_labor_cost' => 999_999,
        ]);

        $rows = app(MaintenanceAnalyticsAggregator::class)->costByVehicle(
            now()->startOfMonth(),
            now()->endOfMonth()->endOfDay(),
        );

        $this->assertCount(1, $rows);
        $this->assertSame($vehicle->id, $rows->first()->vehicle_id);
        $this->assertEquals(200000.0, (float) $rows->first()->total_cost);
        $this->assertSame(1, (int) $rows->first()->log_count);
    }
}
