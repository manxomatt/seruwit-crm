<?php

namespace Tests\Feature\Modules\Receivables;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Partners\Models\Partner;
use Modules\Receivables\Models\Payment;
use Modules\Receivables\Support\ReceivablesStatusBoard;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ReceivablesDashboardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    private function issuedInvoice(Partner $partner, float $total, ?string $dueDate = null): Invoice
    {
        $invoice = Invoice::factory()->issued()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'tax_rate' => 0,
            'subtotal' => $total,
            'tax_amount' => 0,
            'total' => $total,
            'amount_paid' => 0,
            'due_date' => $dueDate,
        ]);

        InvoiceLine::factory()->create([
            'invoice_id' => $invoice->id,
            'amount' => $total,
            'description' => 'Test line',
        ]);

        return $invoice->fresh();
    }

    public function test_guests_cannot_access_receivables_dashboard(): void
    {
        $this->get(route('module.receivables.dashboard'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_receivables_dashboard(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.receivables.dashboard'))->assertForbidden();
    }

    public function test_receivables_dashboard_shows_status_board(): void
    {
        $partner = Partner::factory()->create([
            'customer_rank' => 1,
            'credit_limit' => 100_000,
        ]);

        $this->issuedInvoice($partner, 500_000, now()->subDays(10)->toDateString());
        $this->issuedInvoice($partner, 200_000, now()->addDays(15)->toDateString());

        Payment::factory()->create([
            'partner_id' => $partner->id,
            'amount' => 50_000,
            'status' => Payment::STATUS_POSTED,
            'payment_date' => now()->toDateString(),
        ]);

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.receivables.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Receivables/Dashboard/Index')
                ->where('board.summary.open_ar', 700000)
                ->where('board.summary.open_invoices', 2)
                ->where('board.summary.posted_this_month', 50000)
                ->where('board.aging.overdue_count', 1)
                ->where('board.aging.overdue_amount', 500000)
                ->where('board.alerts.over_limit', 1)
                ->has('board.top_partners', 1)
                ->has('board.recent', 1)
                ->where('can.create', true)
            );
    }

    public function test_status_board_buckets_current_and_overdue(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $this->issuedInvoice($partner, 100_000, now()->addDays(5)->toDateString());
        $this->issuedInvoice($partner, 250_000, now()->subDays(45)->toDateString());

        $board = app(ReceivablesStatusBoard::class)->build();

        $this->assertSame(350000.0, $board['summary']['open_ar']);
        $this->assertSame(100000.0, $board['aging']['buckets']['current']);
        $this->assertSame(250000.0, $board['aging']['buckets']['31_60']);
        $this->assertSame(1, $board['aging']['overdue_count']);
    }

    public function test_payments_index_still_works(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.receivables.payments.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Receivables/Payments/Index'));
    }
}
