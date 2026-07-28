<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\JournalService;
use Modules\Accounting\Support\TrialBalanceService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingTrialBalanceTest extends TestCase
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

    public function test_trial_balance_totals_match_after_posted_journal(): void
    {
        $cash = Account::query()->where('code', '1100')->firstOrFail();
        $modal = Account::query()->where('code', '3100')->firstOrFail();
        $journals = app(JournalService::class);

        $entry = $journals->createDraft([
            'entry_date' => now()->toDateString(),
            'memo' => 'Opening cash',
            'lines' => [
                ['account_id' => $cash->id, 'debit' => 500000, 'credit' => 0],
                ['account_id' => $modal->id, 'debit' => 0, 'credit' => 500000],
            ],
        ]);

        $journals->post($entry);

        $report = app(TrialBalanceService::class)->forPeriod($entry->fiscalPeriod()->first());

        $this->assertTrue($report['is_balanced']);
        $this->assertSame(500000.0, $report['total_debit']);
        $this->assertSame(500000.0, $report['total_credit']);

        $user = $this->createAdminUser();
        $this->actingAs($user)
            ->get(route('module.accounting.reports.trial-balance', ['period_id' => $entry->fiscal_period_id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Accounting/Reports/TrialBalance')
                ->where('is_balanced', true)
                ->where('total_debit', 500000)
                ->where('total_credit', 500000));
    }
}
