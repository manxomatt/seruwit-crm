<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\BankTransaction;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;
use Modules\Receivables\Models\Payment;
use Modules\Receivables\Support\PaymentRecorder;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingBankBookTest extends TestCase
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

    public function test_ar_payment_creates_inbound_bank_transaction(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $invoice = Invoice::factory()->issued()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'subtotal' => 40000,
            'tax_amount' => 0,
            'total' => 40000,
            'amount_paid' => 0,
        ]);

        $bank = CompanyBankAccount::query()->where('kind', CompanyBankAccount::KIND_BANK)->firstOrFail();

        $payment = PaymentRecorder::record([
            'partner_id' => $partner->id,
            'payment_date' => now()->toDateString(),
            'amount' => 40000,
            'method' => Payment::METHOD_TRANSFER,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => 40000],
            ],
        ]);

        $this->assertDatabaseHas('bank_transactions', [
            'source_type' => $payment->getMorphClass(),
            'source_id' => $payment->id,
            'type' => BankTransaction::TYPE_DEPOSIT,
            'direction' => BankTransaction::DIRECTION_IN,
            'company_bank_account_id' => $bank->id,
            'amount' => 40000,
            'status' => BankTransaction::STATUS_POSTED,
        ]);
    }

    public function test_admin_can_create_manual_transfer_and_clear_transactions(): void
    {
        $user = $this->createAdminUser();
        $cash = CompanyBankAccount::query()->where('kind', CompanyBankAccount::KIND_CASH)->firstOrFail();
        $bank = CompanyBankAccount::query()->where('kind', CompanyBankAccount::KIND_BANK)->firstOrFail();

        $this->actingAs($user)
            ->get(route('module.accounting.bank-transactions.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Accounting/BankTransactions/Index')
                ->has('transactions')
                ->where('can.bank', true));

        $this->actingAs($user)
            ->post(route('module.accounting.bank-transactions.store'), [
                'type' => BankTransaction::TYPE_TRANSFER,
                'company_bank_account_id' => $cash->id,
                'counterparty_account_id' => $bank->id,
                'transacted_on' => now()->toDateString(),
                'amount' => 150000,
                'reference' => 'SETOR-1',
                'memo' => 'Setoran kas ke bank',
            ])
            ->assertRedirect(route('module.accounting.bank-transactions.index'));

        $this->assertSame(2, BankTransaction::query()->where('type', BankTransaction::TYPE_TRANSFER)->count());
        $this->assertDatabaseHas('bank_transactions', [
            'company_bank_account_id' => $cash->id,
            'direction' => BankTransaction::DIRECTION_OUT,
            'amount' => 150000,
            'reference' => 'SETOR-1',
        ]);
        $this->assertDatabaseHas('bank_transactions', [
            'company_bank_account_id' => $bank->id,
            'direction' => BankTransaction::DIRECTION_IN,
            'amount' => 150000,
            'reference' => 'SETOR-1',
        ]);

        $ids = BankTransaction::query()->pluck('id')->all();

        $this->actingAs($user)
            ->post(route('module.accounting.bank-transactions.clear'), [
                'ids' => $ids,
                'cleared_on' => now()->toDateString(),
            ])
            ->assertRedirect();

        $this->assertSame(2, BankTransaction::query()->where('is_cleared', true)->count());

        $this->actingAs($user)
            ->post(route('module.accounting.bank-transactions.unclear'), [
                'ids' => $ids,
            ])
            ->assertRedirect();

        $this->assertSame(0, BankTransaction::query()->where('is_cleared', true)->count());
    }

    public function test_voiding_ar_payment_voids_bank_transaction(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $invoice = Invoice::factory()->issued()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'subtotal' => 20000,
            'tax_amount' => 0,
            'total' => 20000,
            'amount_paid' => 0,
        ]);

        $payment = PaymentRecorder::record([
            'partner_id' => $partner->id,
            'payment_date' => now()->toDateString(),
            'amount' => 20000,
            'method' => Payment::METHOD_CASH,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => 20000],
            ],
        ]);

        PaymentRecorder::void($payment);

        $this->assertDatabaseHas('bank_transactions', [
            'source_id' => $payment->id,
            'status' => BankTransaction::STATUS_VOIDED,
        ]);
    }
}
