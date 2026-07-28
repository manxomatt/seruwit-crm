<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Support\BalanceSheetService;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\JournalService;
use Modules\Accounting\Support\ProfitAndLossService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingFinancialStatementsTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
        app(FiscalCalendarService::class)->ensureYear((int) now()->format('Y'));
    }

    public function test_profit_and_loss_and_balance_sheet_from_posted_activity(): void
    {
        $cash = Account::query()->where('code', '1100')->firstOrFail();
        $modal = Account::query()->where('code', '3100')->firstOrFail();
        $revenue = Account::query()->where('code', '4100')->firstOrFail();
        $cogs = Account::query()->where('code', '5100')->firstOrFail();
        $inventory = Account::query()->where('code', '1300')->firstOrFail();
        $journals = app(JournalService::class);

        $opening = $journals->createDraft([
            'entry_date' => now()->toDateString(),
            'memo' => 'Opening',
            'lines' => [
                ['account_id' => $cash->id, 'debit' => 1000000, 'credit' => 0],
                ['account_id' => $modal->id, 'debit' => 0, 'credit' => 1000000],
            ],
        ]);
        $journals->post($opening);

        $sale = $journals->createDraft([
            'entry_date' => now()->toDateString(),
            'memo' => 'Sale',
            'lines' => [
                ['account_id' => $cash->id, 'debit' => 110000, 'credit' => 0],
                ['account_id' => $revenue->id, 'debit' => 0, 'credit' => 110000],
            ],
        ]);
        $journals->post($sale);

        $cogsEntry = $journals->createDraft([
            'entry_date' => now()->toDateString(),
            'memo' => 'COGS',
            'lines' => [
                ['account_id' => $cogs->id, 'debit' => 40000, 'credit' => 0],
                ['account_id' => $inventory->id, 'debit' => 0, 'credit' => 40000],
            ],
        ]);
        $journals->post($cogsEntry);

        // Seed inventory so BS inventory credit doesn't go weird — buy stock first
        $purchase = $journals->createDraft([
            'entry_date' => now()->toDateString(),
            'memo' => 'Buy stock',
            'lines' => [
                ['account_id' => $inventory->id, 'debit' => 40000, 'credit' => 0],
                ['account_id' => $cash->id, 'debit' => 0, 'credit' => 40000],
            ],
        ]);
        $journals->post($purchase);

        $period = $sale->fiscalPeriod()->first();
        $this->assertNotNull($period);

        $pl = app(ProfitAndLossService::class)->forPeriod($period);
        $this->assertSame(110000.0, $pl['total_revenue']);
        $this->assertSame(40000.0, $pl['total_expense']);
        $this->assertSame(70000.0, $pl['net_income']);

        $bs = app(BalanceSheetService::class)->asOfPeriod($period);
        $this->assertTrue($bs['is_balanced']);
        $this->assertSame(70000.0, $bs['net_income_ytd']);
        // cash: 1000000 + 110000 - 40000 = 1070000
        $this->assertSame(1070000.0, $bs['total_assets']);
        $this->assertSame(1070000.0, round($bs['total_liabilities'] + $bs['total_equity'], 2));

        $user = $this->createAdminUser();
        $this->actingAs($user)
            ->get(route('module.accounting.reports.profit-loss', ['period_id' => $period->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Accounting/Reports/ProfitAndLoss')
                ->where('net_income', 70000));

        $this->actingAs($user)
            ->get(route('module.accounting.reports.balance-sheet', ['period_id' => $period->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Accounting/Reports/BalanceSheet')
                ->where('is_balanced', true)
                ->where('net_income_ytd', 70000));
    }
}
