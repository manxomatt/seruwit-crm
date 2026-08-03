<?php

namespace Tests\Feature\Modules\Maintenance;

use App\Models\User;
use Database\Seeders\TenantMaintenanceDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Models\MaintenanceBay;
use Modules\Maintenance\Models\MaintenanceSchedule;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Maintenance\Models\WorkOrderChecklistItem;
use Tests\TestCase;

class MaintenanceDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_shop_floor_demo_data(): void
    {
        User::factory()->create(['name' => 'Mekanik Demo']);
        Vehicle::factory()->count(3)->create(['odometer_km' => 45000]);

        $this->seed(TenantMaintenanceDemoSeeder::class);

        $this->assertGreaterThanOrEqual(10, WorkOrder::query()->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')->count());
        $this->assertGreaterThanOrEqual(9, MaintenanceSchedule::query()->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')->count());
        $this->assertSame(3, MaintenanceBay::query()->where('code', 'like', TenantMaintenanceDemoSeeder::BAY_CODE_PREFIX.'%')->count());

        $this->assertTrue(
            WorkOrder::query()
                ->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')
                ->where('service_location', WorkOrder::LOCATION_IN_HOUSE)
                ->whereNotNull('bay_id')
                ->exists(),
        );

        $this->assertTrue(
            WorkOrder::query()
                ->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')
                ->where('service_location', WorkOrder::LOCATION_OUTSOURCE)
                ->exists(),
        );

        $this->assertTrue(
            WorkOrder::query()
                ->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')
                ->where('status', WorkOrder::STATUS_IN_PROGRESS)
                ->where('waiting_parts', true)
                ->exists(),
        );

        $this->assertGreaterThanOrEqual(1, WorkOrderChecklistItem::query()->count());
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
        $this->assertSame(3, MaintenanceBay::query()->where('code', 'like', TenantMaintenanceDemoSeeder::BAY_CODE_PREFIX.'%')->count());
    }

    public function test_uninstall_removes_demo_work_orders_schedules_and_bays(): void
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
        $this->assertSame(0, MaintenanceBay::query()->where('code', 'like', TenantMaintenanceDemoSeeder::BAY_CODE_PREFIX.'%')->count());
        $this->assertSame(0, WorkOrderChecklistItem::query()->count());
        $this->assertSame(0, Vehicle::query()->where('notes', 'like', '%'.TenantMaintenanceDemoSeeder::TAG.'%')->count());
    }
}
