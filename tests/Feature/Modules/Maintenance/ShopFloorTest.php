<?php

namespace Tests\Feature\Modules\Maintenance;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Models\MaintenanceBay;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\WorkOrder;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ShopFloorTest extends TestCase
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

    private function bay(string $code = 'B1', string $name = 'Bay 1'): MaintenanceBay
    {
        return MaintenanceBay::query()->create([
            'code' => $code,
            'name' => $name,
            'is_active' => true,
            'sort_order' => 1,
        ]);
    }

    public function test_admin_can_manage_bays(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.maintenance.bays.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Maintenance/Bays/Index')
                ->where('can.manage', true)
            );

        $this->actingAs($user)
            ->post(route('module.maintenance.bays.store'), [
                'code' => 'bay-a',
                'name' => 'Lift A',
                'is_active' => true,
                'sort_order' => 2,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $bay = MaintenanceBay::query()->where('code', 'BAY-A')->first();
        $this->assertNotNull($bay);
        $this->assertSame('Lift A', $bay->name);

        $this->actingAs($user)
            ->patch(route('module.maintenance.bays.update', $bay), [
                'code' => 'BAY-A',
                'name' => 'Lift A Updated',
                'is_active' => false,
                'sort_order' => 3,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame('Lift A Updated', $bay->fresh()->name);
        $this->assertFalse($bay->fresh()->is_active);

        $this->actingAs($user)
            ->delete(route('module.maintenance.bays.destroy', $bay))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('maintenance_bays', ['id' => $bay->id]);
    }

    public function test_cannot_delete_bay_with_open_work_order(): void
    {
        $user = $this->createAdminUser();
        $bay = $this->bay();
        $category = $this->category();

        WorkOrder::factory()->create([
            'category_id' => $category->id,
            'bay_id' => $bay->id,
            'status' => WorkOrder::STATUS_APPROVED,
        ]);

        $this->actingAs($user)
            ->delete(route('module.maintenance.bays.destroy', $bay))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('maintenance_bays', ['id' => $bay->id]);
    }

    public function test_work_order_can_store_bay_and_estimated_hours(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $category = $this->category();
        $bay = $this->bay();

        $this->actingAs($user)
            ->post(route('module.maintenance.work-orders.store'), [
                'vehicle_id' => $vehicle->id,
                'category_id' => $category->id,
                'title' => 'Brake job',
                'status' => 'draft',
                'priority' => 'normal',
                'type' => 'corrective',
                'service_location' => 'in_house',
                'bay_id' => $bay->id,
                'estimated_hours' => 2.5,
                'items' => [],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('work_orders', [
            'title' => 'Brake job',
            'bay_id' => $bay->id,
            'estimated_hours' => 2.5,
        ]);
    }

    public function test_wip_board_groups_columns_and_supports_quick_actions(): void
    {
        $user = $this->createAdminUser();
        $category = $this->category();
        $bay = $this->bay();

        $bayBusy = $this->bay('B2', 'Bay 2');
        $bayWaiting = $this->bay('B3', 'Bay 3');

        $pending = WorkOrder::factory()->create([
            'category_id' => $category->id,
            'status' => WorkOrder::STATUS_PENDING,
            'bay_id' => $bay->id,
        ]);
        $approved = WorkOrder::factory()->create([
            'category_id' => $category->id,
            'vehicle_id' => Vehicle::factory(),
            'status' => WorkOrder::STATUS_APPROVED,
            'bay_id' => $bay->id,
        ]);
        $inProgress = WorkOrder::factory()->inProgress()->create([
            'category_id' => $category->id,
            'vehicle_id' => Vehicle::factory(),
            'bay_id' => $bayBusy->id,
            'waiting_parts' => false,
        ]);
        $waiting = WorkOrder::factory()->inProgress()->create([
            'category_id' => $category->id,
            'vehicle_id' => Vehicle::factory(),
            'bay_id' => $bayWaiting->id,
            'waiting_parts' => true,
        ]);

        $this->actingAs($user)
            ->get(route('module.maintenance.wip.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Maintenance/Wip/Index')
                ->has('columns.pending', 1)
                ->has('columns.approved', 1)
                ->has('columns.in_progress', 1)
                ->has('columns.waiting_parts', 1)
                ->has('bays', 3)
            );

        $this->actingAs($user)
            ->patch(route('module.maintenance.wip.update', $pending), ['action' => 'approve'])
            ->assertRedirect()
            ->assertSessionHas('success');
        $this->assertSame(WorkOrder::STATUS_APPROVED, $pending->fresh()->status);

        $this->actingAs($user)
            ->patch(route('module.maintenance.wip.update', $approved), ['action' => 'start'])
            ->assertRedirect()
            ->assertSessionHas('success');
        $this->assertSame(WorkOrder::STATUS_IN_PROGRESS, $approved->fresh()->status);

        $this->actingAs($user)
            ->patch(route('module.maintenance.wip.update', $inProgress), ['action' => 'waiting_parts'])
            ->assertRedirect()
            ->assertSessionHas('success');
        $this->assertTrue($inProgress->fresh()->waiting_parts);

        $this->actingAs($user)
            ->patch(route('module.maintenance.wip.update', $waiting), ['action' => 'resume'])
            ->assertRedirect()
            ->assertSessionHas('success');
        $this->assertFalse($waiting->fresh()->waiting_parts);
    }

    public function test_cannot_start_second_in_progress_work_order_on_same_bay(): void
    {
        $user = $this->createAdminUser();
        $category = $this->category();
        $bay = $this->bay();

        WorkOrder::factory()->inProgress()->create([
            'category_id' => $category->id,
            'bay_id' => $bay->id,
        ]);

        $second = WorkOrder::factory()->create([
            'category_id' => $category->id,
            'vehicle_id' => Vehicle::factory(),
            'status' => WorkOrder::STATUS_APPROVED,
            'bay_id' => $bay->id,
        ]);

        $this->actingAs($user)
            ->patch(route('module.maintenance.wip.update', $second), ['action' => 'start'])
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertSame(WorkOrder::STATUS_APPROVED, $second->fresh()->status);
    }

    public function test_outsource_work_order_clears_bay(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $category = $this->category();
        $bay = $this->bay();

        $workOrder = WorkOrder::factory()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'status' => WorkOrder::STATUS_DRAFT,
            'service_location' => WorkOrder::LOCATION_IN_HOUSE,
            'bay_id' => $bay->id,
        ]);

        $this->actingAs($user)
            ->patch(route('module.maintenance.work-orders.update', $workOrder), [
                'vehicle_id' => $vehicle->id,
                'category_id' => $category->id,
                'title' => $workOrder->title,
                'status' => WorkOrder::STATUS_DRAFT,
                'priority' => WorkOrder::PRIORITY_NORMAL,
                'type' => WorkOrder::TYPE_CORRECTIVE,
                'service_location' => WorkOrder::LOCATION_OUTSOURCE,
                'bay_id' => $bay->id,
                'items' => [],
            ])
            ->assertRedirect();

        $this->assertNull($workOrder->fresh()->bay_id);
        $this->assertSame(WorkOrder::LOCATION_OUTSOURCE, $workOrder->fresh()->service_location);
    }
}
