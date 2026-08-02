<?php

namespace Tests\Feature\Modules\Orders;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Support\OrdersStatusBoard;
use Modules\TransportationManagement\Models\Trip;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class OrdersDashboardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_orders_dashboard(): void
    {
        $this->get(route('module.orders.dashboard'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_orders_dashboard(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.orders.dashboard'))->assertForbidden();
    }

    public function test_orders_dashboard_shows_status_board(): void
    {
        DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_DRAFT,
            'demand_kg' => 100,
        ]);

        DeliveryOrder::factory()->confirmed()->create([
            'demand_kg' => 200,
            'promised_at' => now()->subDays(2),
        ]);

        DeliveryOrder::factory()->confirmed()->create([
            'demand_kg' => 50,
            'goods_issue_note_id' => 1,
            'promised_at' => now()->addDays(3),
        ]);

        $trip = Trip::factory()->create();

        DeliveryOrder::factory()->assigned($trip)->create([
            'demand_kg' => 75,
        ]);

        DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_IN_TRANSIT,
            'trip_id' => $trip->id,
            'confirmed_at' => now(),
            'demand_kg' => 25,
        ]);

        DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_DELIVERED,
            'confirmed_at' => now()->subDays(5),
            'delivered_at' => now(),
            'demand_kg' => 300,
        ]);

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.orders.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Orders/Dashboard/Index')
                ->where('board.summary.open_pipeline', 5)
                ->where('board.summary.in_flight', 2)
                ->where('board.summary.ready_from_gin', 1)
                ->where('board.summary.unassigned_confirmed', 2)
                ->where('board.summary.delivered_this_month', 1)
                ->where('board.summary.demand_open_kg', 450)
                ->where('board.summary.demand_delivered_this_month_kg', 300)
                ->where('board.dispatch.overdue_count', 1)
                ->where('board.dispatch.draft_count', 1)
                ->where('board.dispatch.confirmed_count', 2)
                ->where('board.dispatch.assigned_count', 1)
                ->where('board.dispatch.in_transit_count', 1)
                ->where('board.by_status.delivered', 1)
                ->where('board.alerts.attention', 3)
                ->has('board.recent', 5)
                ->where('can.create', true)
            );
    }

    public function test_status_board_counts_overdue_promises(): void
    {
        DeliveryOrder::factory()->confirmed()->create([
            'promised_at' => now()->addDays(5),
        ]);

        DeliveryOrder::factory()->confirmed()->create([
            'promised_at' => now()->subDays(2),
        ]);

        $board = app(OrdersStatusBoard::class)->build();

        $this->assertSame(1, $board['dispatch']['overdue_count']);
        $this->assertSame(2, $board['summary']['unassigned_confirmed']);
    }

    public function test_orders_index_still_works(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.orders.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Orders/Index'));
    }
}
