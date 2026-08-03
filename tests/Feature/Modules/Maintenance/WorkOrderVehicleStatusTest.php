<?php

namespace Tests\Feature\Modules\Maintenance;

use App\Modules\Facades\Modules;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\MaintenanceSchedule;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class WorkOrderVehicleStatusTest extends TestCase
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
            'key' => 'general',
            'name' => 'General',
            'color' => 'blue',
            'sort_order' => 1,
        ]);
    }

    public function test_starting_work_order_marks_vehicle_maintenance_and_restores_on_complete(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $category = $this->category();

        $workOrder = WorkOrder::factory()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'status' => WorkOrder::STATUS_APPROVED,
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->patch(route('module.maintenance.work-orders.update-status', $workOrder), [
                'status' => WorkOrder::STATUS_IN_PROGRESS,
            ])
            ->assertRedirect();

        $workOrder->refresh();
        $vehicle->refresh();

        $this->assertSame(WorkOrder::STATUS_IN_PROGRESS, $workOrder->status);
        $this->assertSame(Vehicle::STATUS_ACTIVE, $workOrder->vehicle_status_before);
        $this->assertSame(Vehicle::STATUS_MAINTENANCE, $vehicle->status);

        $this->actingAs($user)
            ->patch(route('module.maintenance.work-orders.update-status', $workOrder), [
                'status' => WorkOrder::STATUS_COMPLETED,
            ])
            ->assertRedirect();

        $vehicle->refresh();
        $this->assertSame(Vehicle::STATUS_ACTIVE, $vehicle->status);
    }

    public function test_cannot_start_second_in_progress_work_order_for_same_vehicle(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $category = $this->category();

        WorkOrder::factory()->inProgress()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
        ]);

        $second = WorkOrder::factory()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'status' => WorkOrder::STATUS_APPROVED,
        ]);

        $this->actingAs($user)
            ->patch(route('module.maintenance.work-orders.update-status', $second), [
                'status' => WorkOrder::STATUS_IN_PROGRESS,
            ])
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertSame(WorkOrder::STATUS_APPROVED, $second->fresh()->status);
    }

    public function test_completing_work_order_advances_matching_schedule(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'odometer_km' => 10_000,
        ]);
        $category = $this->category();

        $schedule = MaintenanceSchedule::query()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'name' => 'Oil change',
            'interval_type' => MaintenanceSchedule::INTERVAL_MILEAGE,
            'interval_value' => 5000,
            'last_service_odometer' => 5000,
            'next_service_odometer' => 10_000,
            'is_active' => true,
        ]);

        $workOrder = WorkOrder::factory()->inProgress()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'odometer_at_service' => 10_200,
            'vehicle_status_before' => Vehicle::STATUS_ACTIVE,
        ]);

        $this->actingAs($user)
            ->patch(route('module.maintenance.work-orders.update-status', $workOrder), [
                'status' => WorkOrder::STATUS_COMPLETED,
            ])
            ->assertRedirect();

        $schedule->refresh();
        $this->assertSame(10_200, $schedule->last_service_odometer);
        $this->assertSame(15_200, $schedule->next_service_odometer);
    }

    public function test_store_denormalizes_vendor_and_mechanic_labels(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $category = $this->category();
        $vendor = Partner::factory()->supplier()->create(['name' => 'Bengkel Jaya']);
        $mechanic = $this->createUserWithRole(['name' => 'Andi Mekanik']);

        $this->actingAs($user)->post(route('module.maintenance.work-orders.store'), [
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'title' => 'Servis rutin',
            'status' => 'draft',
            'priority' => 'normal',
            'type' => 'preventive',
            'service_location' => 'in_house',
            'vendor_partner_id' => $vendor->id,
            'mechanic_user_id' => $mechanic->id,
            'items' => [],
        ])->assertRedirect();

        $workOrder = WorkOrder::query()->latest('id')->first();

        $this->assertNotNull($workOrder);
        $this->assertSame($vendor->id, $workOrder->vendor_partner_id);
        $this->assertSame('Bengkel Jaya', $workOrder->vendor_name);
        $this->assertSame($mechanic->id, $workOrder->mechanic_user_id);
        $this->assertSame('Andi Mekanik', $workOrder->mechanic_name);
        $this->assertSame(WorkOrder::LOCATION_IN_HOUSE, $workOrder->service_location);
    }

    public function test_fleet_vehicle_show_uses_work_order_history_when_maintenance_available(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $category = $this->category();

        WorkOrder::factory()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'status' => WorkOrder::STATUS_COMPLETED,
            'title' => 'Ganti kampas rem',
            'completed_at' => now(),
        ]);

        $this->assertTrue(Modules::available('maintenance'));

        $this->actingAs($user)
            ->get(route('module.fleet.vehicles.show', $vehicle))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Vehicles/Show')
                ->where('maintenanceEnabled', true)
                ->has('serviceHistory', 1)
                ->where('serviceHistory.0.title', 'Ganti kampas rem')
            );
    }
}
