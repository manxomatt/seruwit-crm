<?php

namespace Tests\Feature\Modules\Expenses;

use App\Modules\Facades\Modules;
use App\Modules\ModuleLayering;
use App\Modules\ModuleTier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\BankTransaction;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Expenses\Models\CashAdvance;
use Modules\Expenses\Models\ExpenseCategory;
use Modules\Expenses\Models\ExpenseClaim;
use Modules\Expenses\Support\ExpenseSchemaInitializer;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ExpensesModuleTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function beforeRefreshingDatabase(): void
    {
        if (Schema::hasTable('accounts') && Schema::hasTable('bank_transactions')) {
            ExpenseSchemaInitializer::ensureReady();
            RefreshDatabaseState::$migrated = true;
        }
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->withoutMiddleware([
            \Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class,
            \Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains::class,
            \App\Http\Middleware\EnsureTenantIsActive::class,
            \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
            \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
            \App\Http\Middleware\RedirectUnfinishedSignup::class,
            \App\Http\Middleware\EnsureCentralUserCanAccessModule::class,
        ]);

        \App\Models\Role::query()->firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Administrator', 'description' => 'Full system access']
        );

        ExpenseSchemaInitializer::ensureReady();
        app(FiscalCalendarService::class)->ensureYear((int) now()->format('Y'));
    }

    public function test_extracted_finance_modules_and_expenses_satisfy_layering_and_registration(): void
    {
        $this->assertSame([], app(ModuleLayering::class)->violations());

        foreach (['cash-bank', 'tax', 'fixed-assets', 'budgeting', 'expenses'] as $moduleKey) {
            $module = Modules::find($moduleKey);
            $this->assertNotNull($module, "Module [{$moduleKey}] should be registered.");
            $this->assertSame(ModuleTier::Foundation, $module->tier());
            $this->assertContains('accounting', $module->requires());
            $this->assertTrue(Modules::installed($moduleKey));
        }
    }

    public function test_default_expense_categories_and_coa_accounts_are_seeded(): void
    {
        $this->assertNotNull(Account::findByCode('1150'));
        $this->assertNotNull(Account::findByCode('6110'));
        $this->assertNotNull(Account::findByCode('6120'));
        $this->assertNotNull(Account::findByCode('6130'));
        $this->assertNotNull(Account::findByCode('6140'));
        $this->assertNotNull(Account::findByCode('6150'));

        $codes = ExpenseCategory::query()->pluck('code')->all();
        $this->assertContains('FUEL', $codes);
        $this->assertContains('TOLL_PARKING', $codes);
        $this->assertContains('MAINTENANCE', $codes);
        $this->assertContains('VEHICLE_DOC', $codes);
        $this->assertContains('MEAL_TRAVEL', $codes);
        $this->assertContains('OFFICE_OPEX', $codes);
    }

    public function test_standalone_extracted_module_routes_are_accessible(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.cash-bank.bank-accounts.index'))
            ->assertOk();

        $this->actingAs($user)
            ->get(route('module.tax.tax-codes.index'))
            ->assertOk();

        $this->actingAs($user)
            ->get(route('module.fixed-assets.index'))
            ->assertOk();

        $this->actingAs($user)
            ->get(route('module.budgeting.index'))
            ->assertOk();

        $this->actingAs($user)
            ->get(route('module.expenses.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Expenses/Dashboard/Index')
                ->has('kpis'));
    }

    public function test_direct_expense_claim_posts_balanced_journal_and_bank_transaction_and_can_be_voided(): void
    {
        $user = $this->createAdminUser();
        $cashAccount = CompanyBankAccount::query()->where('kind', CompanyBankAccount::KIND_CASH)->firstOrFail();
        $fuelCategory = ExpenseCategory::query()->where('code', 'FUEL')->firstOrFail();
        $tollCategory = ExpenseCategory::query()->where('code', 'TOLL_PARKING')->firstOrFail();

        $this->actingAs($user)
            ->post(route('module.expenses.claims.store'), [
                'expense_date' => now()->toDateString(),
                'payment_method' => 'cash',
                'company_bank_account_id' => $cashAccount->id,
                'payee_name' => 'SPBU Pertamina & Jasa Marga',
                'reference' => 'STRUK-001',
                'description' => 'Pengisian BBM & Tol Operasional',
                'post_immediately' => true,
                'lines' => [
                    [
                        'expense_category_id' => $fuelCategory->id,
                        'description' => 'Solar Dexlite 30 Liter',
                        'amount' => 450000,
                    ],
                    [
                        'expense_category_id' => $tollCategory->id,
                        'description' => 'Tol Dalam Kota & Parkir Bandara',
                        'amount' => 75000,
                    ],
                ],
            ])
            ->assertRedirect();

        $claim = ExpenseClaim::query()->firstOrFail();
        $this->assertSame(ExpenseClaim::STATUS_POSTED, $claim->status);
        $this->assertSame('525000.00', (string) $claim->total_amount);
        $this->assertNotNull($claim->journal_entry_id);

        $journal = JournalEntry::query()->with('lines')->findOrFail($claim->journal_entry_id);
        $this->assertSame(JournalEntry::STATUS_POSTED, $journal->status);
        $this->assertSame('expense.posted', $journal->event);
        $this->assertEquals(525000.0, (float) $journal->lines->sum('debit'));
        $this->assertEquals(525000.0, (float) $journal->lines->sum('credit'));

        $this->assertDatabaseHas('bank_transactions', [
            'source_type' => $claim->getMorphClass(),
            'source_id' => $claim->id,
            'company_bank_account_id' => $cashAccount->id,
            'direction' => BankTransaction::DIRECTION_OUT,
            'amount' => 525000,
            'status' => BankTransaction::STATUS_POSTED,
        ]);

        // Void the claim
        $this->actingAs($user)
            ->post(route('module.expenses.claims.void', $claim->id), [
                'reason' => 'Salah input nominal struk',
            ])
            ->assertRedirect();

        $claim->refresh();
        $this->assertSame(ExpenseClaim::STATUS_VOIDED, $claim->status);

        $this->assertDatabaseHas('journal_entries', [
            'event' => 'expense.voided',
            'source_type' => $claim->getMorphClass(),
            'source_id' => $claim->id,
            'status' => JournalEntry::STATUS_POSTED,
        ]);

        $this->assertDatabaseHas('bank_transactions', [
            'source_type' => $claim->getMorphClass(),
            'source_id' => $claim->id,
            'status' => BankTransaction::STATUS_VOIDED,
        ]);
    }

    public function test_cash_advance_disbursement_and_settlement_with_returned_change(): void
    {
        $user = $this->createAdminUser();
        $cashAccount = CompanyBankAccount::query()->where('kind', CompanyBankAccount::KIND_CASH)->firstOrFail();
        $fuelCategory = ExpenseCategory::query()->where('code', 'FUEL')->firstOrFail();
        $mealCategory = ExpenseCategory::query()->where('code', 'MEAL_TRAVEL')->firstOrFail();

        // 1. Create and immediately disburse a Rp 1.000.000 Cash Advance (Uang Jalan)
        $this->actingAs($user)
            ->post(route('module.expenses.advances.store'), [
                'advance_date' => now()->toDateString(),
                'recipient_name' => 'Budi Santoso (Driver)',
                'purpose' => 'Uang Jalan Charter Luar Kota 3 Hari',
                'amount' => 1000000,
                'payment_method' => 'cash',
                'company_bank_account_id' => $cashAccount->id,
                'reference' => 'UJ-001',
                'disburse_immediately' => true,
            ])
            ->assertRedirect();

        $advance = CashAdvance::query()->firstOrFail();
        $this->assertSame(CashAdvance::STATUS_DISBURSED, $advance->status);
        $this->assertNotNull($advance->disbursement_journal_entry_id);

        $disbursementJournal = JournalEntry::query()->with('lines')->findOrFail($advance->disbursement_journal_entry_id);
        $this->assertSame('cash_advance.disbursed', $disbursementJournal->event);
        $this->assertEquals(1000000.0, (float) $disbursementJournal->lines->sum('debit'));
        $this->assertEquals(1000000.0, (float) $disbursementJournal->lines->sum('credit'));

        $this->assertDatabaseHas('bank_transactions', [
            'source_type' => $advance->getMorphClass(),
            'source_id' => $advance->id,
            'direction' => BankTransaction::DIRECTION_OUT,
            'amount' => 1000000,
            'status' => BankTransaction::STATUS_POSTED,
        ]);

        // 2. Settle (LPJ) the Cash Advance with Rp 850.000 spent -> Rp 150.000 returned to Cash
        $this->actingAs($user)
            ->post(route('module.expenses.advances.settle', $advance->id), [
                'settled_date' => now()->toDateString(),
                'payment_method' => 'cash',
                'company_bank_account_id' => $cashAccount->id,
                'reference' => 'LPJ-001',
                'notes' => 'Sisa uang jalan dikembalikan tunai ke kasir',
                'lines' => [
                    [
                        'expense_category_id' => $fuelCategory->id,
                        'description' => 'BBM PP Jakarta - Bandung',
                        'amount' => 600000,
                    ],
                    [
                        'expense_category_id' => $mealCategory->id,
                        'description' => 'Uang Makan Driver 3 Hari',
                        'amount' => 250000,
                    ],
                ],
            ])
            ->assertRedirect();

        $advance->refresh();
        $this->assertSame(CashAdvance::STATUS_SETTLED, $advance->status);
        $this->assertSame('850000.00', (string) $advance->spent_amount);
        $this->assertSame('150000.00', (string) $advance->returned_amount);
        $this->assertSame('0.00', (string) $advance->reimbursed_amount);
        $this->assertNotNull($advance->settlement_journal_entry_id);

        $settlementJournal = JournalEntry::query()->with('lines')->findOrFail($advance->settlement_journal_entry_id);
        $this->assertSame('cash_advance.settled', $settlementJournal->event);
        // Dr Expense 850.000 + Dr Cash 150.000 = 1.000.000 / Cr 1150 Uang Muka 1.000.000
        $this->assertEquals(1000000.0, (float) $settlementJournal->lines->sum('debit'));
        $this->assertEquals(1000000.0, (float) $settlementJournal->lines->sum('credit'));

        // Verify inbound BankTransaction for the Rp 150.000 returned change
        $settlementClaim = ExpenseClaim::query()->where('cash_advance_id', $advance->id)->firstOrFail();
        $this->assertDatabaseHas('bank_transactions', [
            'source_type' => $settlementClaim->getMorphClass(),
            'source_id' => $settlementClaim->id,
            'direction' => BankTransaction::DIRECTION_IN,
            'amount' => 150000,
            'status' => BankTransaction::STATUS_POSTED,
        ]);
    }

    public function test_cash_advance_settlement_with_excess_spending_records_reimbursement_outflow(): void
    {
        $user = $this->createAdminUser();
        $bankAccount = CompanyBankAccount::query()->where('kind', CompanyBankAccount::KIND_BANK)->firstOrFail();
        $maintenanceCategory = ExpenseCategory::query()->where('code', 'MAINTENANCE')->firstOrFail();

        // 1. Create & disburse Rp 500.000 Cash Advance
        $this->actingAs($user)
            ->post(route('module.expenses.advances.store'), [
                'advance_date' => now()->toDateString(),
                'recipient_name' => 'Agus Mekanik',
                'purpose' => 'Beli Sparepart Darurat',
                'amount' => 500000,
                'payment_method' => 'bank_transfer',
                'company_bank_account_id' => $bankAccount->id,
                'disburse_immediately' => true,
            ])
            ->assertRedirect();

        $advance = CashAdvance::query()->firstOrFail();

        // 2. Settle with Rp 650.000 actual spend -> Rp 150.000 reimbursed out from Bank
        $this->actingAs($user)
            ->post(route('module.expenses.advances.settle', $advance->id), [
                'settled_date' => now()->toDateString(),
                'payment_method' => 'bank_transfer',
                'company_bank_account_id' => $bankAccount->id,
                'reference' => 'LPJ-KURANG-01',
                'lines' => [
                    [
                        'expense_category_id' => $maintenanceCategory->id,
                        'description' => 'Kampas Rem & Minyak Rem',
                        'amount' => 650000,
                    ],
                ],
            ])
            ->assertRedirect();

        $advance->refresh();
        $this->assertSame(CashAdvance::STATUS_SETTLED, $advance->status);
        $this->assertSame('650000.00', (string) $advance->spent_amount);
        $this->assertSame('0.00', (string) $advance->returned_amount);
        $this->assertSame('150000.00', (string) $advance->reimbursed_amount);

        $settlementJournal = JournalEntry::query()->with('lines')->findOrFail($advance->settlement_journal_entry_id);
        // Dr Expense 650.000 / Cr 1150 500.000 + Cr Bank 150.000
        $this->assertEquals(650000.0, (float) $settlementJournal->lines->sum('debit'));
        $this->assertEquals(650000.0, (float) $settlementJournal->lines->sum('credit'));

        $settlementClaim = ExpenseClaim::query()->where('cash_advance_id', $advance->id)->firstOrFail();
        $this->assertDatabaseHas('bank_transactions', [
            'source_type' => $settlementClaim->getMorphClass(),
            'source_id' => $settlementClaim->id,
            'direction' => BankTransaction::DIRECTION_OUT,
            'amount' => 150000,
            'status' => BankTransaction::STATUS_POSTED,
        ]);
    }
}
