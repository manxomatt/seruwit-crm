<?php

namespace Tests\Feature\Modules\Fleet;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\FleetStatusBoard;
use Modules\Fleet\Support\FuelAnalyticsAggregator;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class FleetAnalyticsTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_fleet_dashboard_shows_status_board(): void
    {
        Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        Vehicle::factory()->create(['status' => Vehicle::STATUS_MAINTENANCE]);
        Vehicle::factory()->create(['status' => Vehicle::STATUS_INACTIVE]);

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.fleet.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Dashboard/Index')
                ->where('board.counts.active', 1)
                ->where('board.counts.maintenance', 1)
                ->where('board.counts.inactive', 1)
                ->where('board.counts.total', 3)
                ->has('board.vehicles', 3)
            );
    }

    public function test_status_board_includes_last_fuel_odometer(): void
    {
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'odometer_km' => 12000,
        ]);

        FuelLog::factory()->create([
            'vehicle_id' => $vehicle->id,
            'filled_at' => now()->subDay()->toDateString(),
            'odometer_km' => 11950,
            'liters' => 40,
            'cost' => 500000,
        ]);

        $board = app(FleetStatusBoard::class)->build();
        $row = collect($board['vehicles'])->firstWhere('id', $vehicle->id);

        $this->assertNotNull($row);
        $this->assertSame(12000, $row['odometer_km']);
        $this->assertSame(11950, $row['last_fuel_odometer']);
    }

    public function test_fuel_analytics_page_renders_with_summary(): void
    {
        $vehicle = Vehicle::factory()->create(['expected_km_per_liter' => 10]);
        $driver = Driver::factory()->create();

        FuelLog::factory()->create([
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'filled_at' => now()->toDateString(),
            'liters' => 40,
            'cost' => 600000,
            'km_per_liter' => 11.5,
            'anomaly_flags' => [
                ['code' => 'efficiency_drop', 'message' => 'Low efficiency', 'severity' => 'warning'],
            ],
        ]);

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.fleet.fuel.analytics', ['period' => 'month']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Fuel/Analytics')
                ->where('analytics.summary.fill_count', 1)
                ->where('analytics.summary.total_cost', 600000)
                ->where('analytics.summary.anomaly_count', 1)
                ->has('analytics.fleet_ranking', 1)
                ->has('analytics.driver_performance', 1)
                ->has('analytics.anomalies', 1)
            );
    }

    public function test_driver_performance_compares_against_vehicle_baseline(): void
    {
        $vehicle = Vehicle::factory()->create();
        $goodDriver = Driver::factory()->create(['name' => 'Good Driver']);
        $badDriver = Driver::factory()->create(['name' => 'Bad Driver']);

        FuelLog::factory()->create([
            'vehicle_id' => $vehicle->id,
            'driver_id' => $goodDriver->id,
            'filled_at' => now()->toDateString(),
            'km_per_liter' => 12,
            'liters' => 30,
            'cost' => 400000,
        ]);
        FuelLog::factory()->create([
            'vehicle_id' => $vehicle->id,
            'driver_id' => $badDriver->id,
            'filled_at' => now()->toDateString(),
            'km_per_liter' => 8,
            'liters' => 30,
            'cost' => 400000,
        ]);

        $analytics = app(FuelAnalyticsAggregator::class)->build(null, 'month');
        $byDriver = collect($analytics['driver_performance'])->keyBy('driver_id');

        $this->assertEquals(12.0, $byDriver[$goodDriver->id]['avg_km_per_liter']);
        $this->assertEquals(8.0, $byDriver[$badDriver->id]['avg_km_per_liter']);
        $this->assertEquals(10.0, $byDriver[$goodDriver->id]['vehicle_baseline']);
        $this->assertEquals(20.0, $byDriver[$goodDriver->id]['delta_pct']);
        $this->assertEquals(-20.0, $byDriver[$badDriver->id]['delta_pct']);
    }
}
