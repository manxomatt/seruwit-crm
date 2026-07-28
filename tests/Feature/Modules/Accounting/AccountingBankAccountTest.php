<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\PaymentMethodAccountMap;
use Modules\Accounting\Support\AccountingBridge;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;
use Modules\Receivables\Models\Payment;
use Modules\Receivables\Support\PaymentRecorder;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingBankAccountTest extends TestCase
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

    public function test_defaults_are_seeded_for_cash_and_bank(): void
    {
        $this->assertDatabaseHas('company_bank_accounts', [
            'name' => 'Kas Tunai',
            'kind' => CompanyBankAccount::KIND_CASH,
            'is_default' => true,
        ]);
        $this->assertDatabaseHas('company_bank_accounts', [
            'name' => 'Bank Operasional',
            'kind' => CompanyBankAccount::KIND_BANK,
            'is_default' => true,
        ]);
        $this->assertDatabaseHas('payment_method_account_maps', [
            'payment_method' => 'cash',
        ]);
        $this->assertDatabaseHas('payment_method_account_maps', [
            'payment_method' => 'transfer',
        ]);
    }

    public function test_admin_can_list_and_create_company_bank_account(): void
    {
        $user = $this->createAdminUser();
        $ledger = Account::query()->where('system_role', 'bank')->firstOrFail();

        $this->actingAs($user)
            ->get(route('module.accounting.bank-accounts.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Accounting/BankAccounts/Index')
                ->has('accounts')
                ->has('maps')
                ->where('can.bank', true));

        $this->actingAs($user)
            ->post(route('module.accounting.bank-accounts.store'), [
                'name' => 'BCA Operasional',
                'kind' => CompanyBankAccount::KIND_BANK,
                'bank_name' => 'BCA',
                'account_number' => '1234567890',
                'account_holder' => 'PT Test',
                'account_id' => $ledger->id,
                'is_default' => false,
                'is_active' => true,
                'currency' => 'IDR',
            ])
            ->assertRedirect(route('module.accounting.bank-accounts.index'));

        $this->assertDatabaseHas('company_bank_accounts', [
            'name' => 'BCA Operasional',
            'bank_name' => 'BCA',
            'account_id' => $ledger->id,
        ]);
    }

    public function test_admin_can_update_payment_method_maps(): void
    {
        $user = $this->createAdminUser();
        $cash = CompanyBankAccount::query()->where('kind', CompanyBankAccount::KIND_CASH)->firstOrFail();
        $bank = CompanyBankAccount::query()->where('kind', CompanyBankAccount::KIND_BANK)->firstOrFail();
        $customLedger = Account::query()->create([
            'code' => '1115',
            'name' => 'Bank Mandiri',
            'type' => Account::TYPE_ASSET,
            'normal_balance' => Account::NORMAL_DEBIT,
            'is_postable' => true,
            'is_active' => true,
        ]);
        $customBank = CompanyBankAccount::query()->create([
            'name' => 'Mandiri Ops',
            'kind' => CompanyBankAccount::KIND_BANK,
            'account_id' => $customLedger->id,
            'is_default' => false,
            'is_active' => true,
            'currency' => 'IDR',
        ]);

        $maps = collect(PaymentMethodAccountMap::METHODS)->map(fn (string $method): array => [
            'payment_method' => $method,
            'company_bank_account_id' => $method === 'cash' ? $cash->id : ($method === 'transfer' ? $customBank->id : $bank->id),
        ])->all();

        $this->actingAs($user)
            ->put(route('module.accounting.payment-method-maps.update'), ['maps' => $maps])
            ->assertRedirect();

        $this->assertDatabaseHas('payment_method_account_maps', [
            'payment_method' => 'transfer',
            'company_bank_account_id' => $customBank->id,
        ]);
    }

    public function test_ar_payment_posts_to_mapped_company_bank_coa(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $invoice = Invoice::factory()->issued()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'subtotal' => 50000,
            'tax_amount' => 0,
            'total' => 50000,
            'amount_paid' => 0,
        ]);
        AccountingBridge::invoiceIssued($invoice);

        $customLedger = Account::query()->create([
            'code' => '1118',
            'name' => 'Bank BNI',
            'type' => Account::TYPE_ASSET,
            'normal_balance' => Account::NORMAL_DEBIT,
            'is_postable' => true,
            'is_active' => true,
        ]);
        $customBank = CompanyBankAccount::query()->create([
            'name' => 'BNI Transfer',
            'kind' => CompanyBankAccount::KIND_BANK,
            'account_id' => $customLedger->id,
            'is_default' => false,
            'is_active' => true,
            'currency' => 'IDR',
        ]);

        PaymentMethodAccountMap::query()->updateOrCreate(
            ['payment_method' => 'transfer'],
            ['company_bank_account_id' => $customBank->id],
        );

        $payment = PaymentRecorder::record([
            'partner_id' => $partner->id,
            'payment_date' => now()->toDateString(),
            'amount' => 50000,
            'method' => Payment::METHOD_TRANSFER,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => 50000],
            ],
        ]);

        $journal = JournalEntry::query()
            ->where('source_id', $payment->id)
            ->where('event', 'ar_payment.recorded')
            ->where('status', JournalEntry::STATUS_POSTED)
            ->with('lines')
            ->first();

        $this->assertNotNull($journal);
        $this->assertTrue(
            $journal->lines->contains(
                fn ($line) => (int) $line->account_id === (int) $customLedger->id && (float) $line->debit === 50000.0
            )
        );
    }

    public function test_explicit_company_bank_account_overrides_method_map(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $invoice = Invoice::factory()->issued()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'subtotal' => 25000,
            'tax_amount' => 0,
            'total' => 25000,
            'amount_paid' => 0,
        ]);
        AccountingBridge::invoiceIssued($invoice);

        $overrideLedger = Account::query()->create([
            'code' => '1119',
            'name' => 'Bank BRI',
            'type' => Account::TYPE_ASSET,
            'normal_balance' => Account::NORMAL_DEBIT,
            'is_postable' => true,
            'is_active' => true,
        ]);
        $overrideBank = CompanyBankAccount::query()->create([
            'name' => 'BRI Override',
            'kind' => CompanyBankAccount::KIND_BANK,
            'account_id' => $overrideLedger->id,
            'is_default' => false,
            'is_active' => true,
            'currency' => 'IDR',
        ]);

        $payment = PaymentRecorder::record([
            'partner_id' => $partner->id,
            'payment_date' => now()->toDateString(),
            'amount' => 25000,
            'method' => Payment::METHOD_TRANSFER,
            'company_bank_account_id' => $overrideBank->id,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => 25000],
            ],
        ]);

        $this->assertSame($overrideBank->id, $payment->company_bank_account_id);

        $journal = JournalEntry::query()
            ->where('source_id', $payment->id)
            ->where('event', 'ar_payment.recorded')
            ->with('lines')
            ->first();

        $this->assertTrue(
            $journal->lines->contains(
                fn ($line) => (int) $line->account_id === (int) $overrideLedger->id && (float) $line->debit === 25000.0
            )
        );
    }

    public function test_user_without_bank_permission_cannot_create_account(): void
    {
        $user = $this->createUserWithRole();
        $ledger = Account::query()->where('system_role', 'cash')->firstOrFail();

        $this->actingAs($user)
            ->post(route('module.accounting.bank-accounts.store'), [
                'name' => 'Forbidden Cash',
                'kind' => CompanyBankAccount::KIND_CASH,
                'account_id' => $ledger->id,
                'is_default' => false,
                'is_active' => true,
            ])
            ->assertForbidden();
    }
}
