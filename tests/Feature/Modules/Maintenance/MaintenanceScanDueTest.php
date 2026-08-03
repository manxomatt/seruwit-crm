<?php

namespace Tests\Feature\Modules\Maintenance;

use App\Models\Setting;
use App\Notifications\GenericNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\MaintenanceSchedule;
use Modules\Maintenance\Models\MaintenanceScheduleReminder;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Maintenance\Support\MaintenanceDueScanner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class MaintenanceScanDueTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    private function category(): MaintenanceCategory
    {
        return MaintenanceCategory::query()->create([
            'key' => 'oil',
            'name' => 'Oil Change',
            'color' => 'blue',
            'sort_order' => 1,
        ]);
    }

    public function test_calendar_due_soon_notifies_once(): void
    {
        Notification::fake();
        $admin = $this->createAdminUser();
        $category = $this->category();
        $vehicle = Vehicle::factory()->create(['odometer_km' => 10_000]);

        MaintenanceSchedule::query()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'name' => 'Servis 6 bulan',
            'interval_type' => MaintenanceSchedule::INTERVAL_CALENDAR,
            'interval_value' => 180,
            'last_service_date' => now()->subDays(170)->toDateString(),
            'next_service_date' => now()->addDays(10)->toDateString(),
            'is_active' => true,
        ]);

        Setting::query()->updateOrCreate(
            ['key' => 'maintenance.alert_days_before'],
            ['group' => 'maintenance', 'value' => '14', 'type' => 'number', 'label' => 'Alert days'],
        );

        $scanner = app(MaintenanceDueScanner::class);
        $this->assertSame(1, $scanner->scan()['reminders']);
        $this->assertSame(0, $scanner->scan()['reminders']);

        $this->assertDatabaseHas('maintenance_schedule_reminders', [
            'kind' => MaintenanceScheduleReminder::KIND_DUE_SOON,
        ]);

        Notification::assertSentTo($admin, GenericNotification::class);
        $this->assertSame(0, WorkOrder::query()->count());
    }

    public function test_overdue_mileage_can_auto_create_draft_work_order(): void
    {
        Notification::fake();
        $this->createAdminUser();
        $category = $this->category();
        $vehicle = Vehicle::factory()->create(['odometer_km' => 50_500]);

        MaintenanceSchedule::query()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'name' => 'Ganti oli 10k',
            'interval_type' => MaintenanceSchedule::INTERVAL_MILEAGE,
            'interval_value' => 10_000,
            'last_service_odometer' => 40_000,
            'next_service_odometer' => 50_000,
            'is_active' => true,
        ]);

        Setting::query()->updateOrCreate(
            ['key' => 'maintenance.auto_create_wo'],
            ['group' => 'maintenance', 'value' => '1', 'type' => 'boolean', 'label' => 'Auto WO'],
        );

        $result = app(MaintenanceDueScanner::class)->scan();

        $this->assertSame(1, $result['reminders']);
        $this->assertSame(1, $result['work_orders']);

        $this->assertDatabaseHas('work_orders', [
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'title' => 'Ganti oli 10k',
            'status' => WorkOrder::STATUS_DRAFT,
            'type' => WorkOrder::TYPE_PREVENTIVE,
        ]);

        $this->assertSame(0, app(MaintenanceDueScanner::class)->scan()['work_orders']);
        $this->assertSame(1, WorkOrder::query()->count());
    }

    public function test_far_future_schedule_raises_nothing(): void
    {
        Notification::fake();

        $category = $this->category();
        $vehicle = Vehicle::factory()->create(['odometer_km' => 1_000]);

        MaintenanceSchedule::query()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'name' => 'Far service',
            'interval_type' => MaintenanceSchedule::INTERVAL_CALENDAR,
            'interval_value' => 365,
            'last_service_date' => now()->toDateString(),
            'next_service_date' => now()->addDays(200)->toDateString(),
            'is_active' => true,
        ]);

        $this->assertSame(
            ['reminders' => 0, 'work_orders' => 0],
            app(MaintenanceDueScanner::class)->scan(),
        );
        Notification::assertNothingSent();
    }

    public function test_dashboard_includes_schedules_due_count(): void
    {
        $user = $this->createAdminUser();
        $category = $this->category();
        $vehicle = Vehicle::factory()->create(['odometer_km' => 10_000]);

        MaintenanceSchedule::query()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'name' => 'Due soon',
            'interval_type' => MaintenanceSchedule::INTERVAL_CALENDAR,
            'interval_value' => 180,
            'next_service_date' => now()->addDays(3)->toDateString(),
            'is_active' => true,
        ]);

        Setting::query()->updateOrCreate(
            ['key' => 'maintenance.alert_days_before'],
            ['group' => 'maintenance', 'value' => '14', 'type' => 'number', 'label' => 'Alert days'],
        );

        $this->actingAs($user)
            ->get(route('module.maintenance.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Maintenance/Index')
                ->where('summary.schedules_due', 1)
            );
    }
}
