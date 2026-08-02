<?php

namespace Tests\Feature\Modules\Payables;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Partners\Models\Partner;
use Modules\Payables\Models\BillPayment;
use Modules\Payables\Models\SupplierBill;
use Modules\Payables\Support\PayablesStatusBoard;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PayablesDashboardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    private function createOpenBill(Partner $partner, float $total, ?string $dueDate = null, string $status = SupplierBill::STATUS_ISSUED): SupplierBill
    {
        return SupplierBill::query()->create([
            'partner_id' => $partner->id,
            'code' => SupplierBill::nextCode(),
            'status' => $status,
            'bill_date' => now()->toDateString(),
            'due_date' => $dueDate,
            'subtotal' => $total,
            'tax_amount' => 0,
            'total' => $total,
            'amount_paid' => 0,
        ]);
    }

    public function test_guests_cannot_access_payables_dashboard(): void
    {
        $this->get(route('module.payables.dashboard'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_payables_dashboard(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.payables.dashboard'))->assertForbidden();
    }

    public function test_payables_dashboard_shows_status_board(): void
    {
        $supplier = Partner::factory()->supplier()->create();

        $this->createOpenBill($supplier, 500_000, now()->subDays(10)->toDateString());
        $this->createOpenBill($supplier, 200_000, now()->addDays(15)->toDateString());
        $this->createOpenBill($supplier, 75_000, now()->toDateString(), SupplierBill::STATUS_DRAFT);

        BillPayment::query()->create([
            'partner_id' => $supplier->id,
            'code' => BillPayment::nextCode(),
            'payment_date' => now()->toDateString(),
            'amount' => 50_000,
            'wht_amount' => 0,
            'method' => BillPayment::METHOD_TRANSFER,
            'status' => BillPayment::STATUS_POSTED,
        ]);

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.payables.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Payables/Dashboard/Index')
                ->where('board.summary.open_ap', 700000)
                ->where('board.summary.open_bills', 2)
                ->where('board.summary.draft_bills', 1)
                ->where('board.summary.posted_this_month', 50000)
                ->where('board.aging.overdue_count', 1)
                ->where('board.aging.overdue_amount', 500000)
                ->where('board.alerts.draft_bills', 1)
                ->has('board.top_partners', 1)
                ->has('board.recent', 1)
                ->where('can.create', true)
            );
    }

    public function test_status_board_buckets_current_and_overdue(): void
    {
        $supplier = Partner::factory()->supplier()->create();
        $this->createOpenBill($supplier, 100_000, now()->addDays(5)->toDateString());
        $this->createOpenBill($supplier, 250_000, now()->subDays(45)->toDateString());

        $board = app(PayablesStatusBoard::class)->build();

        $this->assertSame(350000.0, $board['summary']['open_ap']);
        $this->assertSame(100000.0, $board['aging']['buckets']['current']);
        $this->assertSame(250000.0, $board['aging']['buckets']['31_60']);
        $this->assertSame(1, $board['aging']['overdue_count']);
    }

    public function test_bills_index_still_works(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.payables.bills.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Payables/Bills/Index'));
    }
}
