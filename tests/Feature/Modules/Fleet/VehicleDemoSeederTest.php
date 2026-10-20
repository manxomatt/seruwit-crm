<?php

namespace Tests\Feature\Modules\Fleet;

use Database\Seeders\TenantVehicleDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class VehicleDemoSeederTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpRoles();
    }

    public function test_seeds_thirty_demo_vehicles(): void
    {
        $this->seed(TenantVehicleDemoSeeder::class);

        $this->assertSame(
            30,
            Vehicle::query()
                ->where('plate_number', 'like', TenantVehicleDemoSeeder::PLATE_PREFIX.' %')
                ->count(),
        );

        $this->assertSame(
            25,
            Vehicle::query()
                ->where('plate_number', 'like', TenantVehicleDemoSeeder::PLATE_PREFIX.' %')
                ->where('status', Vehicle::STATUS_ACTIVE)
                ->count(),
        );

        $this->assertTrue(
            Vehicle::query()
                ->where('plate_number', 'BE VD 01')
                ->whereNotNull('capacity_kg')
                ->whereNotNull('cost_per_km')
                ->whereNotNull('color')
                ->whereNotNull('rental_class')
                ->exists(),
        );

        // Ownership and investor scheme coverage
        $this->assertSame(
            20,
            Vehicle::query()->where('ownership_type', 'owned')->count(),
        );
        $this->assertSame(
            6,
            Vehicle::query()->where('ownership_type', 'investor_revenue_share')->count(),
        );
        $this->assertSame(
            4,
            Vehicle::query()->where('ownership_type', 'investor_fixed_rent')->count(),
        );

        // Strictly rental vehicle types (minibus/van, mpv, suv) - no trucks or buses
        $this->assertSame(
            0,
            Vehicle::query()
                ->where('plate_number', 'like', TenantVehicleDemoSeeder::PLATE_PREFIX.' %')
                ->whereIn('type', ['truck', 'bus'])
                ->count(),
        );

        $this->assertSame(
            30,
            Vehicle::query()
                ->where('plate_number', 'like', TenantVehicleDemoSeeder::PLATE_PREFIX.' %')
                ->whereIn('rental_class', ['mpv', 'suv', 'van', 'premium'])
                ->count(),
        );
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantVehicleDemoSeeder::class);
        $this->seed(TenantVehicleDemoSeeder::class);

        $this->assertSame(
            30,
            Vehicle::query()
                ->where('plate_number', 'like', TenantVehicleDemoSeeder::PLATE_PREFIX.' %')
                ->count(),
        );
    }

    public function test_uninstall_cleans_up_vehicles_and_settlements(): void
    {
        $this->seed(TenantVehicleDemoSeeder::class);

        $seeder = new TenantVehicleDemoSeeder;
        $seeder->uninstall();

        $this->assertFalse($seeder->isInstalled());
        $this->assertSame(
            0,
            Vehicle::query()
                ->where('plate_number', 'like', TenantVehicleDemoSeeder::PLATE_PREFIX.' %')
                ->count(),
        );
    }
}
