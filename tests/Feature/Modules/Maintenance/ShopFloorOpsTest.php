<?php

namespace Tests\Feature\Modules\Maintenance;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Models\MaintenanceBay;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Maintenance\Models\WorkOrderChecklistItem;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ShopFloorOpsTest extends TestCase
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

    private function bay(): MaintenanceBay
    {
        return MaintenanceBay::query()->create([
            'code' => 'B1',
            'name' => 'Bay 1',
            'is_active' => true,
            'sort_order' => 1,
        ]);
    }

    public function test_checklist_can_be_managed_on_work_order(): void
    {
        $user = $this->createAdminUser();
        $workOrder = WorkOrder::factory()->create([
            'category_id' => $this->category()->id,
            'status' => WorkOrder::STATUS_IN_PROGRESS,
        ]);

        $this->actingAs($user)
            ->post(route('module.maintenance.work-orders.checklist.store', $workOrder), [
                'label' => 'Cek oli mesin',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $item = WorkOrderChecklistItem::query()->where('work_order_id', $workOrder->id)->first();
        $this->assertNotNull($item);
        $this->assertSame('Cek oli mesin', $item->label);
        $this->assertFalse($item->is_done);

        $this->actingAs($user)
            ->patch(route('module.maintenance.work-orders.checklist.update', [$workOrder, $item]), [
                'is_done' => true,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $item->refresh();
        $this->assertTrue($item->is_done);
        $this->assertNotNull($item->done_at);

        $this->actingAs($user)
            ->get(route('module.maintenance.work-orders.show', $workOrder))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Maintenance/WorkOrders/Show')
                ->has('workOrder.checklist_items', 1)
            );

        $this->actingAs($user)
            ->delete(route('module.maintenance.work-orders.checklist.destroy', [$workOrder, $item]))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('work_order_checklist_items', ['id' => $item->id]);
    }

    public function test_job_card_pdf_streams(): void
    {
        $user = $this->createAdminUser();
        $workOrder = WorkOrder::factory()->create([
            'category_id' => $this->category()->id,
            'vehicle_id' => Vehicle::factory(),
            'bay_id' => $this->bay()->id,
        ]);

        WorkOrderChecklistItem::query()->create([
            'work_order_id' => $workOrder->id,
            'label' => 'Inspect brakes',
            'is_done' => false,
            'sort_order' => 1,
        ]);

        $this->actingAs($user)
            ->get(route('module.maintenance.work-orders.job-card', $workOrder, false))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_bay_calendar_groups_scheduled_work_orders(): void
    {
        $user = $this->createAdminUser();
        $bay = $this->bay();
        $category = $this->category();
        $today = now()->toDateString();

        WorkOrder::factory()->create([
            'category_id' => $category->id,
            'bay_id' => $bay->id,
            'scheduled_date' => $today,
            'status' => WorkOrder::STATUS_APPROVED,
            'title' => 'Scheduled service',
        ]);

        WorkOrder::factory()->create([
            'category_id' => $category->id,
            'bay_id' => $bay->id,
            'scheduled_date' => now()->addDays(10)->toDateString(),
            'status' => WorkOrder::STATUS_APPROVED,
            'title' => 'Far future',
        ]);

        $this->actingAs($user)
            ->get(route('module.maintenance.calendar.index', ['start' => $today, 'days' => 7]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Maintenance/Calendar/Index')
                ->has('bays', 1)
                ->has('dates', 7)
                ->where("cells.{$bay->id}.{$today}.0.title", 'Scheduled service')
            );
    }
}
