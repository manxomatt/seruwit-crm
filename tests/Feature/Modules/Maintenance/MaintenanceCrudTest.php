<?php

namespace Tests\Feature\Modules\Maintenance;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\MaintenanceSchedule;
use Modules\Maintenance\Models\WorkOrder;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class MaintenanceCrudTest extends TestCase
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
        return MaintenanceCategory::create([
            'key' => 'general',
            'name' => 'General',
            'color' => 'blue',
            'sort_order' => 1,
        ]);
    }

    // ── Maintenance Dashboard ──────────────────────────────────────────────

    public function test_guests_cannot_access_maintenance(): void
    {
        $this->get(route('module.maintenance.index'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_maintenance(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.maintenance.index'))->assertForbidden();
    }

    public function test_maintenance_dashboard_shows_summary(): void
    {
        $user = $this->createAdminUser();
        $category = $this->category();

        WorkOrder::factory()->create(['status' => WorkOrder::STATUS_DRAFT, 'category_id' => $category->id]);
        WorkOrder::factory()->create(['status' => WorkOrder::STATUS_PENDING, 'category_id' => $category->id]);
        WorkOrder::factory()->inProgress()->create(['category_id' => $category->id]);

        $this->actingAs($user)->get(route('module.maintenance.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Maintenance/Index')
                ->where('summary.draft', 1)
                ->where('summary.pending', 1)
                ->where('summary.in_progress', 1)
                ->has('recentWorkOrders')
                ->has('can')
            );
    }

    // ── Work Order CRUD ────────────────────────────────────────────────────

    public function test_admin_can_list_work_orders(): void
    {
        $user = $this->createAdminUser();
        $category = $this->category();
        WorkOrder::factory()->create(['category_id' => $category->id]);

        $this->actingAs($user)->get(route('module.maintenance.work-orders.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Maintenance/WorkOrders/Index')
                ->has('workOrders.data', 1)
            );
    }

    public function test_work_orders_can_be_filtered_by_status(): void
    {
        $user = $this->createAdminUser();
        $category = $this->category();
        WorkOrder::factory()->create(['status' => WorkOrder::STATUS_DRAFT, 'category_id' => $category->id]);
        WorkOrder::factory()->inProgress()->create(['category_id' => $category->id]);

        $this->actingAs($user)
            ->get(route('module.maintenance.work-orders.index', ['status' => 'draft']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('workOrders.data', 1));
    }

    public function test_admin_can_create_work_order(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $category = $this->category();

        $this->actingAs($user)->get(route('module.maintenance.work-orders.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Maintenance/WorkOrders/Create'));

        $this->actingAs($user)->post(route('module.maintenance.work-orders.store'), [
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'title' => 'Ganti oli mesin',
            'status' => 'draft',
            'priority' => 'normal',
            'type' => 'scheduled',
            'scheduled_date' => now()->addDays(3)->toDateString(),
            'items' => [
                [
                    'item_type' => 'labor',
                    'name' => 'Jasa ganti oli',
                    'quantity' => 1,
                    'unit_price' => 100000,
                    'total_price' => 100000,
                ],
            ],
        ])->assertRedirect();

        $wo = WorkOrder::where('title', 'Ganti oli mesin')->first();
        $this->assertNotNull($wo);
        $this->assertStringStartsWith('WO-', $wo->reference_number);
        $this->assertEquals($user->id, $wo->created_by);
        $this->assertCount(1, $wo->items);
    }

    public function test_store_rejects_invalid_status(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $category = $this->category();

        $this->actingAs($user)->post(route('module.maintenance.work-orders.store'), [
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'title' => 'Test',
            'status' => 'invalid_status',
            'priority' => 'normal',
            'type' => 'corrective',
        ])->assertSessionHasErrors('status');
    }

    public function test_admin_can_view_work_order(): void
    {
        $user = $this->createAdminUser();
        $category = $this->category();
        $wo = WorkOrder::factory()->create(['category_id' => $category->id]);

        $this->actingAs($user)->get(route('module.maintenance.work-orders.show', $wo))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Maintenance/WorkOrders/Show')
                ->has('workOrder')
                ->has('can')
            );
    }

    public function test_admin_can_edit_work_order(): void
    {
        $user = $this->createAdminUser();
        $category = $this->category();
        $wo = WorkOrder::factory()->create(['category_id' => $category->id]);

        $this->actingAs($user)->get(route('module.maintenance.work-orders.edit', $wo))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Maintenance/WorkOrders/Edit'));
    }

    public function test_admin_can_update_work_order(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $category = $this->category();
        $wo = WorkOrder::factory()->create([
            'status' => WorkOrder::STATUS_DRAFT,
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
        ]);

        $this->actingAs($user)->patch(route('module.maintenance.work-orders.update', $wo), [
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'title' => 'Updated Title',
            'status' => 'pending',
            'priority' => 'high',
            'type' => 'corrective',
        ])->assertRedirect();

        $wo->refresh();
        $this->assertEquals('Updated Title', $wo->title);
        $this->assertEquals(WorkOrder::STATUS_PENDING, $wo->status);
        $this->assertEquals(WorkOrder::PRIORITY_HIGH, $wo->priority);
    }

    public function test_update_to_approved_sets_approver(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $category = $this->category();
        $wo = WorkOrder::factory()->create([
            'status' => WorkOrder::STATUS_PENDING,
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
        ]);

        $this->actingAs($user)->patch(route('module.maintenance.work-orders.update', $wo), [
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'title' => $wo->title,
            'status' => 'approved',
            'priority' => 'normal',
            'type' => 'corrective',
        ])->assertRedirect();

        $wo->refresh();
        $this->assertEquals(WorkOrder::STATUS_APPROVED, $wo->status);
        $this->assertEquals($user->id, $wo->approved_by);
        $this->assertNotNull($wo->approved_at);
    }

    public function test_update_to_in_progress_sets_started_at(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $category = $this->category();
        $wo = WorkOrder::factory()->create([
            'status' => WorkOrder::STATUS_APPROVED,
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'started_at' => null,
        ]);

        $this->actingAs($user)->patch(route('module.maintenance.work-orders.update', $wo), [
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'title' => $wo->title,
            'status' => 'in_progress',
            'priority' => 'normal',
            'type' => 'corrective',
        ])->assertRedirect();

        $this->assertNotNull($wo->fresh()->started_at);
    }

    public function test_update_to_completed_sets_completed_at(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $category = $this->category();
        $wo = WorkOrder::factory()->inProgress()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
        ]);

        $this->actingAs($user)->patch(route('module.maintenance.work-orders.update', $wo), [
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'title' => $wo->title,
            'status' => 'completed',
            'priority' => 'normal',
            'type' => 'corrective',
        ])->assertRedirect();

        $this->assertNotNull($wo->fresh()->completed_at);
    }

    public function test_admin_can_delete_work_order(): void
    {
        $user = $this->createAdminUser();
        $category = $this->category();
        $wo = WorkOrder::factory()->create(['category_id' => $category->id]);

        $this->actingAs($user)->delete(route('module.maintenance.work-orders.destroy', $wo))
            ->assertRedirect();

        $this->assertSoftDeleted('work_orders', ['id' => $wo->id]);
    }

    // ── Permission checks ──────────────────────────────────────────────────

    public function test_read_only_user_cannot_create_work_order(): void
    {
        $user = $this->createUserWithRole();

        $this->actingAs($user)->get(route('module.maintenance.work-orders.create'))
            ->assertForbidden();
    }

    public function test_read_only_user_cannot_delete_work_order(): void
    {
        $user = $this->createUserWithRole();
        $category = $this->category();
        $wo = WorkOrder::factory()->create(['category_id' => $category->id]);

        $this->actingAs($user)->delete(route('module.maintenance.work-orders.destroy', $wo))
            ->assertForbidden();
    }

    // ── Categories CRUD ────────────────────────────────────────────────────

    public function test_admin_can_list_categories(): void
    {
        $user = $this->createAdminUser();
        $this->category();

        $this->actingAs($user)->get(route('module.maintenance.categories.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Maintenance/Categories/Index'));
    }

    public function test_admin_can_create_category(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.maintenance.categories.store'), [
            'key' => 'engine_service',
            'name' => 'Engine Service',
            'color' => 'red',
            'sort_order' => 2,
        ])->assertRedirect();

        $this->assertDatabaseHas('maintenance_categories', ['key' => 'engine_service']);
    }

    public function test_category_key_must_be_unique(): void
    {
        $user = $this->createAdminUser();
        $this->category();

        $this->actingAs($user)->post(route('module.maintenance.categories.store'), [
            'key' => 'general',
            'name' => 'Duplicate',
            'color' => 'red',
            'sort_order' => 0,
        ])->assertSessionHasErrors('key');
    }

    public function test_admin_can_update_category(): void
    {
        $user = $this->createAdminUser();
        $category = $this->category();

        $this->actingAs($user)->patch(route('module.maintenance.categories.update', $category), [
            'name' => 'Updated Category',
            'color' => 'green',
            'sort_order' => 5,
        ])->assertRedirect();

        $this->assertEquals('Updated Category', $category->fresh()->name);
    }

    public function test_cannot_delete_category_with_work_orders(): void
    {
        $user = $this->createAdminUser();
        $category = $this->category();
        WorkOrder::factory()->create(['category_id' => $category->id]);

        $this->actingAs($user)->delete(route('module.maintenance.categories.destroy', $category))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('maintenance_categories', ['id' => $category->id]);
    }

    public function test_can_delete_empty_category(): void
    {
        $user = $this->createAdminUser();
        $category = MaintenanceCategory::create([
            'key' => 'to_delete',
            'name' => 'To Delete',
            'color' => 'gray',
            'sort_order' => 99,
        ]);

        $this->actingAs($user)->delete(route('module.maintenance.categories.destroy', $category))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('maintenance_categories', ['id' => $category->id]);
    }

    // ── Schedules CRUD ─────────────────────────────────────────────────────

    public function test_admin_can_list_schedules(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.maintenance.schedules.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Maintenance/Schedules/Index'));
    }

    public function test_admin_can_create_calendar_schedule(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $category = $this->category();

        $this->actingAs($user)->post(route('module.maintenance.schedules.store'), [
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'name' => 'Oil change every 90 days',
            'interval_type' => 'calendar',
            'interval_value' => 90,
            'last_service_date' => '2026-06-01',
            'is_active' => true,
        ])->assertRedirect();

        $schedule = MaintenanceSchedule::where('name', 'Oil change every 90 days')->first();
        $this->assertNotNull($schedule);
        $this->assertEquals('2026-08-30', $schedule->next_service_date->toDateString());
        $this->assertNull($schedule->next_service_odometer);
    }

    public function test_admin_can_create_mileage_schedule(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $category = $this->category();

        $this->actingAs($user)->post(route('module.maintenance.schedules.store'), [
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'name' => 'Tire rotation every 10000 km',
            'interval_type' => 'mileage',
            'interval_value' => 10000,
            'last_service_odometer' => 50000,
            'is_active' => true,
        ])->assertRedirect();

        $schedule = MaintenanceSchedule::where('name', 'Tire rotation every 10000 km')->first();
        $this->assertNotNull($schedule);
        $this->assertEquals(60000, $schedule->next_service_odometer);
        $this->assertNull($schedule->next_service_date);
    }

    public function test_admin_can_delete_schedule(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $category = $this->category();
        $schedule = MaintenanceSchedule::create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $category->id,
            'name' => 'Temp Schedule',
            'interval_type' => 'calendar',
            'interval_value' => 30,
            'is_active' => true,
        ]);

        $this->actingAs($user)->delete(route('module.maintenance.schedules.destroy', $schedule))
            ->assertRedirect();

        $this->assertDatabaseMissing('maintenance_schedules', ['id' => $schedule->id]);
    }

    // ── Model scopes ───────────────────────────────────────────────────────

    public function test_open_scope_excludes_completed_and_cancelled(): void
    {
        $category = $this->category();
        WorkOrder::factory()->create(['status' => WorkOrder::STATUS_DRAFT, 'category_id' => $category->id]);
        WorkOrder::factory()->create(['status' => WorkOrder::STATUS_PENDING, 'category_id' => $category->id]);
        WorkOrder::factory()->inProgress()->create(['category_id' => $category->id]);
        WorkOrder::factory()->completed()->create(['category_id' => $category->id]);
        WorkOrder::factory()->create(['status' => WorkOrder::STATUS_CANCELLED, 'category_id' => $category->id]);

        $this->assertEquals(3, WorkOrder::open()->count());
    }

    public function test_overdue_scope_returns_past_scheduled_open_work_orders(): void
    {
        $category = $this->category();

        WorkOrder::factory()->create([
            'status' => WorkOrder::STATUS_PENDING,
            'scheduled_date' => now()->subDays(5),
            'category_id' => $category->id,
        ]);
        WorkOrder::factory()->create([
            'status' => WorkOrder::STATUS_DRAFT,
            'scheduled_date' => now()->addDays(5),
            'category_id' => $category->id,
        ]);
        WorkOrder::factory()->completed()->create([
            'scheduled_date' => now()->subDays(10),
            'category_id' => $category->id,
        ]);

        $this->assertEquals(1, WorkOrder::overdue()->count());
    }

    // ── Reference number generation ────────────────────────────────────────

    public function test_reference_number_auto_increments(): void
    {
        $category = $this->category();
        $wo1 = WorkOrder::factory()->create(['category_id' => $category->id]);
        $wo2 = WorkOrder::factory()->create(['category_id' => $category->id]);

        $this->assertStringStartsWith('WO-'.now()->year.'-', $wo1->reference_number);
        $this->assertNotEquals($wo1->reference_number, $wo2->reference_number);
    }
}
