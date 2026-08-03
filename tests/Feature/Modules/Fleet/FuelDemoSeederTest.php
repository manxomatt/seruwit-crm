<?php

namespace Tests\Feature\Modules\Fleet;

use Database\Seeders\TenantFuelDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;
use Tests\TestCase;

class FuelDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_ten_demo_fuel_fills(): void
    {
        $this->seed(TenantFuelDemoSeeder::class);

        $this->assertSame(
            10,
            FuelLog::query()->where('receipt_number', 'like', TenantFuelDemoSeeder::RECEIPT_PREFIX.'%')->count(),
        );

        $withConsumption = FuelLog::query()
            ->where('receipt_number', 'like', TenantFuelDemoSeeder::RECEIPT_PREFIX.'%')
            ->whereNotNull('km_per_liter')
            ->count();

        $this->assertGreaterThanOrEqual(5, $withConsumption);
        $this->assertGreaterThanOrEqual(1, Vehicle::query()->count());
        $this->assertTrue(app(TenantFuelDemoSeeder::class)->isInstalled());
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantFuelDemoSeeder::class);
        $this->seed(TenantFuelDemoSeeder::class);

        $this->assertSame(
            10,
            FuelLog::query()->where('receipt_number', 'like', TenantFuelDemoSeeder::RECEIPT_PREFIX.'%')->count(),
        );
    }

    public function test_uninstall_removes_demo_fills_and_fallback_vehicles(): void
    {
        $seeder = app(TenantFuelDemoSeeder::class);
        $seeder->run();

        $this->assertTrue($seeder->isInstalled());
        $this->assertSame(
            2,
            Vehicle::query()->where('notes', 'like', '%'.TenantFuelDemoSeeder::TAG.'%')->count(),
        );

        $seeder->uninstall();

        $this->assertFalse($seeder->isInstalled());
        $this->assertSame(
            0,
            FuelLog::query()->where('receipt_number', 'like', TenantFuelDemoSeeder::RECEIPT_PREFIX.'%')->count(),
        );
        $this->assertSame(
            0,
            Vehicle::query()->where('notes', 'like', '%'.TenantFuelDemoSeeder::TAG.'%')->count(),
        );
    }
}
