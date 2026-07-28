<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\Budget;
use Modules\Accounting\Models\FixedAsset;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\CashFlowService;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\GeneralLedgerService;
use Modules\Accounting\Support\JournalService;
use Modules\Accounting\Support\PartnerStatementService;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingPhaseEReportsAndAssetsTest extends TestCase
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

    public function test_cash_flow_gl_and_partner_statement_pages_and_services(): void
    {
        $user = $this->createAdminUser();
        $cash = Account::query()->where('code', '1100')->firstOrFail();
        $ar = Account::query()->where('system_role', 'ar_control')->firstOrFail();
        $revenue = Account::query()->where('code', '4100')->firstOrFail();
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $journals = app(JournalService::class);

        $sale = $journals->createDraft([
            'entry_date' => now()->toDateString(),
            'memo' => 'Sale',
            'lines' => [
                ['account_id' => $ar->id, 'debit' => 50000, 'credit' => 0, 'partner_id' => $partner->id],
                ['account_id' => $revenue->id, 'debit' => 0, 'credit' => 50000],
            ],
        ], $user->id);
        $journals->post($sale, $user->id);

        $receipt = $journals->createDraft([
            'entry_date' => now()->toDateString(),
            'memo' => 'Receipt',
            'lines' => [
                ['account_id' => $cash->id, 'debit' => 50000, 'credit' => 0],
                ['account_id' => $ar->id, 'debit' => 0, 'credit' => 50000, 'partner_id' => $partner->id],
            ],
        ], $user->id);
        $journals->post($receipt, $user->id);

        $period = $sale->fiscalPeriod()->firstOrFail();

        $cashFlow = app(CashFlowService::class)->forPeriod($period);
        $this->assertEqualsWithDelta(50000.0, $cashFlow['closing_cash'], 0.01);
        $this->assertEqualsWithDelta(50000.0, $cashFlow['net_income'], 0.01);

        $gl = app(GeneralLedgerService::class)->forAccount($cash, $period);
        $this->assertEqualsWithDelta(50000.0, $gl['closing_balance'], 0.01);
        $this->assertNotEmpty($gl['rows']);

        $statement = app(PartnerStatementService::class)->forPartner(
            $partner,
            $period->starts_on->toDateString(),
            $period->ends_on->toDateString(),
        );
        $this->assertCount(2, $statement['rows']);
        $this->assertEqualsWithDelta(0.0, $statement['closing_balance'], 0.01);

        $this->actingAs($user)
            ->get(route('module.accounting.reports.cash-flow', ['period_id' => $period->id]))
            ->assertOk();

        $this->actingAs($user)
            ->get(route('module.accounting.reports.general-ledger', [
                'period_id' => $period->id,
                'account_id' => $cash->id,
            ]))
            ->assertOk();

        $this->actingAs($user)
            ->get(route('module.accounting.reports.partner-statement', [
                'partner_id' => $partner->id,
                'from' => $period->starts_on->toDateString(),
                'to' => $period->ends_on->toDateString(),
            ]))
            ->assertOk();
    }

    public function test_fixed_asset_acquisition_and_depreciation(): void
    {
        $user = $this->createAdminUser();
        $assetAccount = Account::query()->where('system_role', 'fixed_asset')->firstOrFail();
        $accum = Account::query()->where('system_role', 'accum_depreciation')->firstOrFail();
        $expense = Account::query()->where('system_role', 'depreciation_expense')->firstOrFail();
        $cash = Account::query()->where('code', '1100')->firstOrFail();
        $period = app(FiscalCalendarService::class)->periodForDate(now());

        $this->actingAs($user)->post(route('module.accounting.fixed-assets.store'), [
            'code' => 'FA-TRUCK-1',
            'name' => 'Delivery truck',
            'acquisition_date' => now()->toDateString(),
            'acquisition_cost' => 120000,
            'salvage_value' => 0,
            'useful_life_months' => 12,
            'asset_account_id' => $assetAccount->id,
            'accum_depr_account_id' => $accum->id,
            'expense_account_id' => $expense->id,
            'funding_account_id' => $cash->id,
            'post_acquisition' => true,
        ])->assertRedirect(route('module.accounting.fixed-assets.index'));

        $asset = FixedAsset::query()->where('code', 'FA-TRUCK-1')->firstOrFail();
        $this->assertEqualsWithDelta(120000.0, (float) $asset->acquisition_cost, 0.01);
        $this->assertTrue(
            JournalEntry::query()
                ->where('event', 'fixed_asset.acquired')
                ->where('source_id', $asset->id)
                ->where('status', JournalEntry::STATUS_POSTED)
                ->exists()
        );

        $this->actingAs($user)->post(route('module.accounting.fixed-assets.depreciate'), [
            'period_id' => $period->id,
            'fixed_asset_id' => $asset->id,
        ])->assertRedirect();

        $asset->refresh();
        $this->assertEqualsWithDelta(10000.0, (float) $asset->accumulated_depreciation, 0.01);
        $this->assertEqualsWithDelta(110000.0, $asset->bookValue(), 0.01);
    }

    public function test_budget_vs_actual(): void
    {
        $user = $this->createAdminUser();
        $year = app(FiscalCalendarService::class)->ensureYear((int) now()->format('Y'));
        $period = app(FiscalCalendarService::class)->periodForDate(now());
        $opex = Account::query()->where('code', '6100')->firstOrFail();
        $cash = Account::query()->where('code', '1100')->firstOrFail();

        $journals = app(JournalService::class);
        $entry = $journals->createDraft([
            'entry_date' => now()->toDateString(),
            'memo' => 'Opex',
            'lines' => [
                ['account_id' => $opex->id, 'debit' => 8000, 'credit' => 0],
                ['account_id' => $cash->id, 'debit' => 0, 'credit' => 8000],
            ],
        ], $user->id);
        $journals->post($entry, $user->id);

        $this->actingAs($user)->post(route('module.accounting.budgets.store'), [
            'fiscal_year_id' => $year->id,
            'name' => 'FY Budget',
            'is_active' => true,
            'lines' => [
                [
                    'account_id' => $opex->id,
                    'fiscal_period_id' => $period->id,
                    'amount' => 10000,
                ],
            ],
        ])->assertRedirect();

        $budget = Budget::query()->where('name', 'FY Budget')->firstOrFail();

        $this->actingAs($user)
            ->get(route('module.accounting.budgets.index', [
                'year' => $year->year,
                'period_id' => $period->id,
                'budget_id' => $budget->id,
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Accounting/Budgets/Index')
                ->where('total_budget', 10000)
                ->where('total_actual', 8000)
                ->where('total_variance', -2000));
    }
}
