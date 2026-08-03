<?php

namespace Tests\Feature\Modules\Maintenance;

use App\Models\User;
use Database\Seeders\TenantMaintenanceDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Models\MaintenanceSchedule;
use Modules\Maintenance\Models\WorkOrder;
use Tests\TestCase;

class MaintenanceDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_work_orders_and_schedules(): void
    {
        User::factory()->create();
        Vehicle::factory()->count(3)->create(['odometer_km' => 45000]);

        $this->seed(TenantMaintenanceDemoSeeder::class);

        $this->assertGreaterThanOrEqual(10, WorkOrder::query()->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')->count());
        $this->assertGreaterThanOrEqual(9, MaintenanceSchedule::query()->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')->count());
        $this->assertTrue(app(TenantMaintenanceDemoSeeder::class)->isInstalled());
    }

    public function test_seeder_is_idempotent_for_work_orders(): void
    {
        User::factory()->create();
        Vehicle::factory()->count(2)->create(['odometer_km' => 30000]);

        $this->seed(TenantMaintenanceDemoSeeder::class);
        $count = WorkOrder::query()->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')->count();

        $this->seed(TenantMaintenanceDemoSeeder::class);

        $this->assertSame(
            $count,
            WorkOrder::query()->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')->count(),
        );
    }

    public function test_uninstall_removes_demo_work_orders_and_schedules(): void
    {
        User::factory()->create();

        $seeder = app(TenantMaintenanceDemoSeeder::class);
        $seeder->run();

        $this->assertTrue($seeder->isInstalled());
        $this->assertSame(
            5,
            Vehicle::query()->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')->count(),
        );

        $seeder->uninstall();

        $this->assertFalse($seeder->isInstalled());
        $this->assertSame(0, WorkOrder::query()->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')->count());
        $this->assertSame(0, MaintenanceSchedule::query()->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')->count());
        $this->assertSame(0, Vehicle::query()->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')->count());
    }
}
