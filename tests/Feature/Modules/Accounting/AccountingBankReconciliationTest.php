<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Modules\Accounting\Models\BankReconciliation;
use Modules\Accounting\Models\BankStatementLine;
use Modules\Accounting\Models\BankTransaction;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\FiscalCalendarService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingBankReconciliationTest extends TestCase
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

    public function test_admin_can_create_import_match_and_complete_reconciliation(): void
    {
        $user = $this->createAdminUser();
        $bank = CompanyBankAccount::query()->where('kind', CompanyBankAccount::KIND_BANK)->firstOrFail();

        $this->actingAs($user);

        $bookTxn = BankTransaction::query()->create([
            'company_bank_account_id' => $bank->id,
            'type' => BankTransaction::TYPE_DEPOSIT,
            'direction' => BankTransaction::DIRECTION_IN,
            'transacted_on' => now()->toDateString(),
            'amount' => 75000,
            'reference' => 'PAY-100',
            'memo' => 'Customer transfer',
            'status' => BankTransaction::STATUS_POSTED,
            'created_by' => Auth::id(),
        ]);

        $this->post(route('module.accounting.bank-reconciliations.store'), [
            'company_bank_account_id' => $bank->id,
            'period_start' => now()->startOfMonth()->toDateString(),
            'period_end' => now()->endOfMonth()->toDateString(),
            'statement_date' => now()->toDateString(),
            'opening_balance' => 0,
            'closing_balance' => 72500,
        ])->assertRedirect();

        $recon = BankReconciliation::query()->latest('id')->firstOrFail();

        $csv = UploadedFile::fake()->createWithContent(
            'statement.csv',
            "date,description,reference,amount\n".
            now()->toDateString().",Customer transfer,PAY-100,75000\n".
            now()->toDateString().",Bank fee,,-2500\n"
        );

        $this->post(route('module.accounting.bank-reconciliations.import', $recon), [
            'csv' => $csv,
        ])->assertRedirect();

        $this->assertSame(2, $recon->lines()->count());

        $depositLine = $recon->lines()->where('direction', BankTransaction::DIRECTION_IN)->firstOrFail();
        $feeLine = $recon->lines()->where('direction', BankTransaction::DIRECTION_OUT)->firstOrFail();

        $this->post(route('module.accounting.bank-reconciliations.match', [$recon, $depositLine]), [
            'bank_transaction_id' => $bookTxn->id,
        ])->assertRedirect();

        $depositLine->refresh();
        $bookTxn->refresh();
        $this->assertSame(BankStatementLine::MATCH_MATCHED, $depositLine->match_status);
        $this->assertTrue($bookTxn->is_cleared);

        $this->post(route('module.accounting.bank-reconciliations.adjust', [$recon, $feeLine]))
            ->assertRedirect();

        $feeLine->refresh();
        $this->assertSame(BankStatementLine::MATCH_ADJUSTED, $feeLine->match_status);
        $this->assertNotNull($feeLine->journal_entry_id);
        $this->assertDatabaseHas('journal_entries', [
            'id' => $feeLine->journal_entry_id,
            'event' => 'bank_recon.adjusted',
            'status' => JournalEntry::STATUS_POSTED,
        ]);

        $this->post(route('module.accounting.bank-reconciliations.complete', $recon))
            ->assertRedirect(route('module.accounting.bank-reconciliations.show', $recon));

        $this->assertSame(BankReconciliation::STATUS_COMPLETED, $recon->fresh()->status);
    }

    public function test_cannot_complete_with_unmatched_lines(): void
    {
        $user = $this->createAdminUser();
        $bank = CompanyBankAccount::query()->where('kind', CompanyBankAccount::KIND_BANK)->firstOrFail();

        $this->actingAs($user)
            ->post(route('module.accounting.bank-reconciliations.store'), [
                'company_bank_account_id' => $bank->id,
                'period_start' => now()->startOfMonth()->toDateString(),
                'period_end' => now()->endOfMonth()->toDateString(),
                'closing_balance' => 1000,
            ])
            ->assertRedirect();

        $recon = BankReconciliation::query()->latest('id')->firstOrFail();

        $csv = UploadedFile::fake()->createWithContent(
            'statement.csv',
            "date,amount\n".now()->toDateString().",1000\n"
        );

        $this->actingAs($user)
            ->post(route('module.accounting.bank-reconciliations.import', $recon), ['csv' => $csv])
            ->assertRedirect();

        $this->actingAs($user)
            ->from(route('module.accounting.bank-reconciliations.show', $recon))
            ->post(route('module.accounting.bank-reconciliations.complete', $recon))
            ->assertRedirect()
            ->assertSessionHasErrors('reconciliation');

        $this->assertSame(BankReconciliation::STATUS_OPEN, $recon->fresh()->status);
    }

    public function test_ignore_allows_completion(): void
    {
        $user = $this->createAdminUser();
        $bank = CompanyBankAccount::query()->where('kind', CompanyBankAccount::KIND_BANK)->firstOrFail();

        $this->actingAs($user)
            ->post(route('module.accounting.bank-reconciliations.store'), [
                'company_bank_account_id' => $bank->id,
                'period_start' => now()->startOfMonth()->toDateString(),
                'period_end' => now()->endOfMonth()->toDateString(),
            ])
            ->assertRedirect();

        $recon = BankReconciliation::query()->latest('id')->firstOrFail();

        $csv = UploadedFile::fake()->createWithContent(
            'statement.csv',
            "date,description,amount\n".now()->toDateString().",Noise,1\n"
        );

        $this->actingAs($user)
            ->post(route('module.accounting.bank-reconciliations.import', $recon), ['csv' => $csv])
            ->assertRedirect();

        $line = $recon->lines()->firstOrFail();

        $this->actingAs($user)
            ->post(route('module.accounting.bank-reconciliations.ignore', [$recon, $line]))
            ->assertRedirect();

        $this->actingAs($user)
            ->post(route('module.accounting.bank-reconciliations.complete', $recon))
            ->assertRedirect();

        $this->assertSame(BankReconciliation::STATUS_COMPLETED, $recon->fresh()->status);
    }
}
