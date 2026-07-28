<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\AccountingBridge;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\TrialBalanceService;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Partners\Models\Partner;
use Modules\Payables\Models\SupplierBill;
use Modules\Payables\Models\SupplierBillLine;
use Modules\Payables\Support\BillPaymentRecorder;
use Modules\Receivables\Models\Payment;
use Modules\Receivables\Support\PaymentRecorder;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingAutoPostTest extends TestCase
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

    public function test_issuing_invoice_posts_ar_revenue_and_tax(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create(['customer_rank' => 1]);

        $invoice = Invoice::factory()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => true,
            'tax_rate' => 11,
            'status' => Invoice::STATUS_DRAFT,
        ]);

        InvoiceLine::query()->create([
            'invoice_id' => $invoice->id,
            'description' => 'Goods',
            'amount' => 100000,
        ]);
        $invoice->recalculate();

        $this->actingAs($user)
            ->post(route('module.invoicing.invoices.issue', $invoice))
            ->assertSessionHas('success');

        $journal = JournalEntry::query()
            ->where('source_type', $invoice->getMorphClass())
            ->where('source_id', $invoice->id)
            ->where('event', 'invoice.issued')
            ->where('status', JournalEntry::STATUS_POSTED)
            ->with('lines.account')
            ->first();

        $this->assertNotNull($journal);
        $this->assertSame(JournalEntry::TYPE_AUTO, $journal->type);
        $this->assertTrue($journal->isBalanced());

        $byRole = $journal->lines->mapWithKeys(
            fn ($line) => [$line->account->system_role => ['debit' => (float) $line->debit, 'credit' => (float) $line->credit]]
        );

        $this->assertSame(111000.0, $byRole['ar_control']['debit']);
        $this->assertSame(100000.0, $byRole['sales_revenue']['credit']);
        $this->assertSame(11000.0, $byRole['tax_output']['credit']);
    }

    public function test_voiding_issued_invoice_creates_reversal(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create(['customer_rank' => 1]);

        $invoice = Invoice::factory()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'tax_rate' => 0,
            'status' => Invoice::STATUS_DRAFT,
        ]);
        InvoiceLine::query()->create([
            'invoice_id' => $invoice->id,
            'description' => 'Goods',
            'amount' => 50000,
        ]);
        $invoice->recalculate();

        $this->actingAs($user)->post(route('module.invoicing.invoices.issue', $invoice));
        $this->actingAs($user)->post(route('module.invoicing.invoices.void', $invoice->fresh()));

        $original = JournalEntry::query()
            ->where('source_id', $invoice->id)
            ->where('event', 'invoice.issued')
            ->first();
        $reversal = JournalEntry::query()
            ->where('source_id', $invoice->id)
            ->where('event', 'invoice.voided')
            ->where('status', JournalEntry::STATUS_POSTED)
            ->first();

        $this->assertSame(JournalEntry::STATUS_VOID, $original?->status);
        $this->assertNotNull($reversal);
        $this->assertSame(JournalEntry::TYPE_REVERSAL, $reversal->type);
        $this->assertTrue($reversal->fresh('lines')->isBalanced());
    }

    public function test_ar_payment_and_void_post_to_gl(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $invoice = Invoice::factory()->issued()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'subtotal' => 75000,
            'tax_amount' => 0,
            'total' => 75000,
            'amount_paid' => 0,
        ]);
        AccountingBridge::invoiceIssued($invoice);

        $payment = PaymentRecorder::record([
            'partner_id' => $partner->id,
            'payment_date' => now()->toDateString(),
            'amount' => 75000,
            'method' => Payment::METHOD_TRANSFER,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => 75000],
            ],
        ]);

        $posted = JournalEntry::query()
            ->where('source_id', $payment->id)
            ->where('event', 'ar_payment.recorded')
            ->where('status', JournalEntry::STATUS_POSTED)
            ->with('lines.account')
            ->first();

        $this->assertNotNull($posted);
        $bankLine = $posted->lines->first(fn ($line) => $line->account->system_role === 'bank');
        $arLine = $posted->lines->first(fn ($line) => $line->account->system_role === 'ar_control');
        $this->assertSame(75000.0, (float) $bankLine->debit);
        $this->assertSame(75000.0, (float) $arLine->credit);

        PaymentRecorder::void($payment);

        $this->assertSame(
            JournalEntry::STATUS_VOID,
            JournalEntry::query()->where('event', 'ar_payment.recorded')->where('source_id', $payment->id)->value('status')
        );
        $this->assertTrue(
            JournalEntry::query()
                ->where('event', 'ar_payment.voided')
                ->where('source_id', $payment->id)
                ->where('status', JournalEntry::STATUS_POSTED)
                ->exists()
        );
    }

    public function test_supplier_bill_and_payment_post_to_gl(): void
    {
        $supplier = Partner::factory()->supplier()->create();
        $bill = SupplierBill::query()->create([
            'code' => 'BILL-TEST-GL-1',
            'partner_id' => $supplier->id,
            'status' => SupplierBill::STATUS_DRAFT,
            'bill_date' => now()->toDateString(),
            'tax_enabled' => false,
            'tax_rate' => 0,
            'subtotal' => 0,
            'tax_amount' => 0,
            'total' => 0,
            'amount_paid' => 0,
        ]);
        SupplierBillLine::query()->create([
            'supplier_bill_id' => $bill->id,
            'description' => 'Supplies',
            'amount' => 200000,
        ]);
        $bill->recalculate();

        $user = $this->createAdminUser();
        $this->actingAs($user)->post(route('module.payables.bills.issue', $bill));

        $billJournal = JournalEntry::query()
            ->where('source_id', $bill->id)
            ->where('event', 'supplier_bill.issued')
            ->with('lines.account')
            ->first();

        $this->assertNotNull($billJournal);
        $opex = $billJournal->lines->first(fn ($line) => $line->account->system_role === 'opex');
        $ap = $billJournal->lines->first(fn ($line) => $line->account->system_role === 'ap_control');
        $this->assertSame(200000.0, (float) $opex->debit);
        $this->assertSame(200000.0, (float) $ap->credit);

        $payment = BillPaymentRecorder::record([
            'partner_id' => $supplier->id,
            'payment_date' => now()->toDateString(),
            'amount' => 200000,
            'method' => 'transfer',
            'allocations' => [
                ['supplier_bill_id' => $bill->id, 'amount' => 200000],
            ],
        ]);

        $this->assertTrue(
            JournalEntry::query()
                ->where('source_id', $payment->id)
                ->where('event', 'bill_payment.recorded')
                ->where('status', JournalEntry::STATUS_POSTED)
                ->exists()
        );

        $period = $billJournal->fiscalPeriod;
        $tb = app(TrialBalanceService::class)->forPeriod($period);
        $this->assertTrue($tb['is_balanced']);
    }

    public function test_cash_payment_uses_cash_account(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $invoice = Invoice::factory()->issued()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'subtotal' => 10000,
            'tax_amount' => 0,
            'total' => 10000,
        ]);
        AccountingBridge::invoiceIssued($invoice);

        $payment = PaymentRecorder::record([
            'partner_id' => $partner->id,
            'payment_date' => now()->toDateString(),
            'amount' => 10000,
            'method' => Payment::METHOD_CASH,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => 10000],
            ],
        ]);

        $journal = JournalEntry::query()
            ->where('source_id', $payment->id)
            ->where('event', 'ar_payment.recorded')
            ->with('lines.account')
            ->first();

        $cash = Account::query()->where('system_role', 'cash')->firstOrFail();
        $this->assertTrue($journal->lines->contains(fn ($line) => (int) $line->account_id === (int) $cash->id && (float) $line->debit === 10000.0));
    }
}
