<?php

namespace Tests\Feature\Modules\Invoicing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Support\InvoicingStatusBoard;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class InvoicingDashboardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_invoicing_dashboard(): void
    {
        $this->get(route('module.invoicing.dashboard'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_invoicing_dashboard(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.invoicing.dashboard'))->assertForbidden();
    }

    public function test_invoicing_dashboard_shows_status_board(): void
    {
        $partner = Partner::factory()->create();

        Invoice::factory()->create([
            'partner_id' => $partner->id,
            'status' => Invoice::STATUS_DRAFT,
            'total' => 50_000,
        ]);

        Invoice::factory()->issued()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'tax_rate' => 0,
            'subtotal' => 500_000,
            'tax_amount' => 0,
            'total' => 500_000,
            'amount_paid' => 0,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->subDays(5)->toDateString(),
        ]);

        Invoice::factory()->issued()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'tax_rate' => 0,
            'subtotal' => 200_000,
            'tax_amount' => 0,
            'total' => 200_000,
            'amount_paid' => 0,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(10)->toDateString(),
        ]);

        Invoice::factory()->paid()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'tax_rate' => 0,
            'subtotal' => 75_000,
            'tax_amount' => 0,
            'total' => 75_000,
            'amount_paid' => 75_000,
            'paid_at' => now(),
            'issue_date' => now()->toDateString(),
        ]);

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.invoicing.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Invoicing/Dashboard/Index')
                ->where('board.summary.outstanding', 700000)
                ->where('board.summary.open_count', 2)
                ->where('board.summary.draft_count', 1)
                ->where('board.summary.paid_this_month', 75000)
                ->where('board.summary.issued_this_month', 3)
                ->where('board.aging.overdue_count', 1)
                ->where('board.aging.overdue_amount', 500000)
                ->where('board.aging.current_count', 1)
                ->where('board.aging.current_amount', 200000)
                ->where('board.by_status.draft', 1)
                ->where('board.by_status.issued', 2)
                ->where('board.by_status.paid', 1)
                ->where('board.alerts.attention', 2)
                ->has('board.recent', 2)
                ->where('can.create', true)
            );
    }

    public function test_status_board_counts_current_and_overdue(): void
    {
        $partner = Partner::factory()->create();

        Invoice::factory()->issued()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'total' => 100_000,
            'amount_paid' => 0,
            'due_date' => now()->addDays(5)->toDateString(),
        ]);

        Invoice::factory()->partiallyPaid(40_000)->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'total' => 100_000,
            'due_date' => now()->subDays(3)->toDateString(),
        ]);

        $board = app(InvoicingStatusBoard::class)->build();

        $this->assertSame(160000.0, $board['summary']['outstanding']);
        $this->assertSame(1, $board['aging']['overdue_count']);
        $this->assertSame(60000.0, $board['aging']['overdue_amount']);
        $this->assertSame(1, $board['aging']['current_count']);
        $this->assertSame(100000.0, $board['aging']['current_amount']);
    }

    public function test_invoices_index_still_works(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.invoicing.invoices.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Invoicing/Invoices/Index'));
    }
}
