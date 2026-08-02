<?php

namespace Tests\Feature\Modules\Sales;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\PriceList;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Support\SalesStatusBoard;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class SalesDashboardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_sales_dashboard(): void
    {
        $this->get(route('module.sales.dashboard'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_sales_dashboard(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.sales.dashboard'))->assertForbidden();
    }

    public function test_sales_dashboard_shows_status_board(): void
    {
        SalesOrder::factory()->create([
            'status' => SalesOrder::STATUS_DRAFT,
            'total_amount' => 50_000,
            'ordered_at' => now()->toDateString(),
        ]);

        $overdue = SalesOrder::factory()->confirmed()->create([
            'total_amount' => 500_000,
            'ordered_at' => now()->toDateString(),
            'promised_at' => now()->subDays(3)->toDateString(),
        ]);

        SalesOrder::factory()->confirmed()->create([
            'total_amount' => 200_000,
            'ordered_at' => now()->toDateString(),
            'promised_at' => now()->addDays(7)->toDateString(),
        ]);

        GoodsIssueNote::factory()->create([
            'sales_order_id' => $overdue->id,
            'warehouse_id' => $overdue->warehouse_id,
            'status' => GoodsIssueNote::STATUS_DRAFT,
            'issued_at' => now()->toDateString(),
        ]);

        GoodsIssueNote::factory()->confirmed()->create([
            'sales_order_id' => $overdue->id,
            'warehouse_id' => $overdue->warehouse_id,
            'issued_at' => now()->toDateString(),
        ]);

        PriceList::query()->create([
            'name' => 'Retail',
            'code' => 'PL-0001',
            'is_active' => true,
        ]);

        PriceList::query()->create([
            'name' => 'Inactive',
            'code' => 'PL-0002',
            'is_active' => false,
        ]);

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.sales.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Sales/Dashboard/Index')
                ->where('board.summary.open_pipeline', 3)
                ->where('board.summary.awaiting_issue', 2)
                ->where('board.summary.open_amount', 700000)
                ->where('board.summary.draft_count', 1)
                ->where('board.summary.ordered_this_month', 3)
                ->where('board.summary.ordered_this_month_amount', 750000)
                ->where('board.fulfillment.overdue_count', 1)
                ->where('board.fulfillment.overdue_amount', 500000)
                ->where('board.fulfillment.gin_draft', 1)
                ->where('board.fulfillment.gin_confirmed_this_month', 1)
                ->where('board.price_lists.active', 1)
                ->where('board.price_lists.total', 2)
                ->where('board.by_status.draft', 1)
                ->where('board.by_status.confirmed', 2)
                ->where('board.alerts.attention', 3)
                ->has('board.recent', 3)
                ->where('can.create', true)
            );
    }

    public function test_status_board_counts_overdue_promises(): void
    {
        SalesOrder::factory()->confirmed()->create([
            'total_amount' => 100_000,
            'promised_at' => now()->addDays(5)->toDateString(),
        ]);

        SalesOrder::factory()->partialDelivered()->create([
            'total_amount' => 250_000,
            'promised_at' => now()->subDays(2)->toDateString(),
        ]);

        $board = app(SalesStatusBoard::class)->build();

        $this->assertSame(2, $board['summary']['awaiting_issue']);
        $this->assertSame(1, $board['fulfillment']['overdue_count']);
        $this->assertSame(250000.0, $board['fulfillment']['overdue_amount']);
        $this->assertSame(350000.0, $board['summary']['open_amount']);
    }

    public function test_sales_orders_index_still_works(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.sales.sales-orders.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Sales/SalesOrders/Index'));
    }
}
