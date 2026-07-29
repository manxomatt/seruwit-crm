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
                ->exists(),
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
}
