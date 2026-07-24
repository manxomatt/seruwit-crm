<?php

namespace Tests\Feature\Modules\Fleet;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\FuelLogRecorder;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Support\TripFuelAttribution;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class FuelManagementTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_recording_a_fill_computes_consumption_against_previous_odometer(): void
    {
        $vehicle = Vehicle::factory()->create([
            'odometer_km' => 1000,
            'tank_capacity_liters' => 80,
            'expected_km_per_liter' => 10,
        ]);

        app(FuelLogRecorder::class)->record($vehicle, [
            'filled_at' => now()->subDays(7)->toDateString(),
            'liters' => 40,
            'cost' => 600000,
            'odometer_km' => 1000,
            'odometer_source' => 'manual',
            'is_full_tank' => true,
        ]);

        $second = app(FuelLogRecorder::class)->record($vehicle->fresh(), [
            'filled_at' => now()->toDateString(),
            'liters' => 40,
            'cost' => 620000,
            'odometer_km' => 1400,
            'odometer_source' => 'gps',
            'is_full_tank' => true,
        ]);

        $this->assertSame(400, $second->distance_since_last_km);
        $this->assertEquals(10.0, (float) $second->km_per_liter);
        $this->assertEquals(10.0, (float) $second->liters_per_100km);
        $this->assertNull($second->anomaly_flags);
        $this->assertSame(1400, $vehicle->fresh()->odometer_km);
    }

    public function test_over_capacity_and_odometer_regression_are_flagged(): void
    {
        $vehicle = Vehicle::factory()->create([
            'odometer_km' => 5000,
            'tank_capacity_liters' => 50,
            'expected_km_per_liter' => 8,
        ]);

        app(FuelLogRecorder::class)->record($vehicle, [
            'filled_at' => now()->subDay()->toDateString(),
            'liters' => 40,
            'cost' => 500000,
            'odometer_km' => 5000,
        ]);

        $overfill = app(FuelLogRecorder::class)->record($vehicle->fresh(), [
            'filled_at' => now()->toDateString(),
            'liters' => 90,
            'cost' => 1200000,
            'odometer_km' => 4900,
        ]);

        $codes = collect($overfill->anomaly_flags)->pluck('code')->all();
        $this->assertContains('over_capacity', $codes);
        $this->assertContains('odometer_regression', $codes);
    }

    public function test_efficiency_drop_is_flagged_against_expected_km_per_liter(): void
    {
        $vehicle = Vehicle::factory()->create([
            'odometer_km' => 1000,
            'tank_capacity_liters' => 100,
            'expected_km_per_liter' => 10,
        ]);

        app(FuelLogRecorder::class)->record($vehicle, [
            'filled_at' => now()->subDays(10)->toDateString(),
            'liters' => 40,
            'cost' => 500000,
            'odometer_km' => 1000,
        ]);

        $poor = app(FuelLogRecorder::class)->record($vehicle->fresh(), [
            'filled_at' => now()->toDateString(),
            'liters' => 40,
            'cost' => 500000,
            'odometer_km' => 1200,
        ]);

        $this->assertSame(200, $poor->distance_since_last_km);
        $this->assertEquals(5.0, (float) $poor->km_per_liter);
        $this->assertContains('efficiency_drop', collect($poor->anomaly_flags)->pluck('code'));
    }

    public function test_http_store_uses_recorder_and_fuel_index_lists_logs(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create(['odometer_km' => 2000]);

        $this->actingAs($user)->post(route('module.fleet.vehicles.fuel-logs.store', $vehicle), [
            'filled_at' => now()->toDateString(),
            'liters' => 35.5,
            'cost' => 550000,
            'odometer_km' => 2100,
            'odometer_source' => 'vehicle',
            'station_name' => 'SPBU Dummy',
            'is_full_tank' => true,
        ])->assertRedirect(route('module.fleet.vehicles.show', $vehicle));

        $this->assertDatabaseHas('fuel_logs', [
            'vehicle_id' => $vehicle->id,
            'liters' => 35.5,
            'station_name' => 'SPBU Dummy',
            'odometer_source' => 'vehicle',
        ]);

        $this->actingAs($user)
            ->get(route('module.fleet.fuel.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Fleet/Fuel/Index'));
    }

    public function test_trip_fuel_attribution_estimates_liters_from_fleet_efficiency(): void
    {
        $vehicle = Vehicle::factory()->create([
            'expected_km_per_liter' => 8,
        ]);

        FuelLog::factory()->create([
            'vehicle_id' => $vehicle->id,
            'km_per_liter' => 8,
            'price_per_liter' => 15000,
            'filled_at' => now()->subDay(),
        ]);

        $trip = Trip::factory()->create([
            'vehicle_id' => $vehicle->id,
            'distance_km' => 160,
            'status' => Trip::STATUS_COMPLETED,
            'started_at' => now()->subHours(6),
            'completed_at' => now(),
        ]);
        $trip->setRelation('vehicle', $vehicle);

        $estimate = app(TripFuelAttribution::class)->forTrip($trip);

        $this->assertEquals(20.0, $estimate['estimated_liters']);
        $this->assertEquals(8.0, $estimate['km_per_liter']);
        $this->assertEquals(300000.0, $estimate['estimated_cost']);
        $this->assertSame('fleet_efficiency', $estimate['source']);
    }
}
