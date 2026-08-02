<?php

namespace Tests\Feature\Modules\Purchasing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Support\PurchasingStatusBoard;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PurchasingDashboardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_purchasing_dashboard(): void
    {
        $this->get(route('module.purchasing.dashboard'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_purchasing_dashboard(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.purchasing.dashboard'))->assertForbidden();
    }

    public function test_purchasing_dashboard_shows_status_board(): void
    {
        PurchaseOrder::factory()->create([
            'status' => PurchaseOrder::STATUS_DRAFT,
            'total_amount' => 50_000,
            'ordered_at' => now()->toDateString(),
        ]);

        PurchaseOrder::factory()->submitted()->create([
            'total_amount' => 80_000,
            'ordered_at' => now()->toDateString(),
        ]);

        $overdue = PurchaseOrder::factory()->approved()->create([
            'total_amount' => 500_000,
            'ordered_at' => now()->toDateString(),
            'expected_at' => now()->subDays(3)->toDateString(),
        ]);

        PurchaseOrder::factory()->approved()->create([
            'total_amount' => 200_000,
            'ordered_at' => now()->toDateString(),
            'expected_at' => now()->addDays(7)->toDateString(),
        ]);

        GoodReceiptNote::factory()->create([
            'purchase_order_id' => $overdue->id,
            'warehouse_id' => $overdue->warehouse_id,
            'status' => GoodReceiptNote::STATUS_DRAFT,
            'received_at' => now()->toDateString(),
        ]);

        GoodReceiptNote::factory()->confirmed()->create([
            'purchase_order_id' => $overdue->id,
            'warehouse_id' => $overdue->warehouse_id,
            'received_at' => now()->toDateString(),
        ]);

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.purchasing.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Purchasing/Dashboard/Index')
                ->where('board.summary.open_pipeline', 4)
                ->where('board.summary.awaiting_receipt', 2)
                ->where('board.summary.open_amount', 700000)
                ->where('board.summary.draft_count', 1)
                ->where('board.summary.submitted_count', 1)
                ->where('board.summary.ordered_this_month', 4)
                ->where('board.summary.ordered_this_month_amount', 830000)
                ->where('board.receipts.overdue_count', 1)
                ->where('board.receipts.overdue_amount', 500000)
                ->where('board.receipts.grn_draft', 1)
                ->where('board.receipts.grn_confirmed_this_month', 1)
                ->where('board.by_status.draft', 1)
                ->where('board.by_status.submitted', 1)
                ->where('board.by_status.approved', 2)
                ->where('board.alerts.attention', 3)
                ->has('board.recent', 4)
                ->where('can.create', true)
            );
    }

    public function test_status_board_counts_overdue_receipts(): void
    {
        PurchaseOrder::factory()->approved()->create([
            'total_amount' => 100_000,
            'expected_at' => now()->addDays(5)->toDateString(),
        ]);

        PurchaseOrder::factory()->create([
            'status' => PurchaseOrder::STATUS_PARTIAL_RECEIVED,
            'total_amount' => 250_000,
            'expected_at' => now()->subDays(2)->toDateString(),
        ]);

        $board = app(PurchasingStatusBoard::class)->build();

        $this->assertSame(2, $board['summary']['awaiting_receipt']);
        $this->assertSame(1, $board['receipts']['overdue_count']);
        $this->assertSame(250000.0, $board['receipts']['overdue_amount']);
        $this->assertSame(350000.0, $board['summary']['open_amount']);
    }

    public function test_purchase_orders_index_still_works(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.purchasing.purchase-orders.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Purchasing/PurchaseOrders/Index'));
    }
}
