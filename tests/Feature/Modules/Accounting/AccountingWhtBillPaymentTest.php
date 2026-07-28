<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\BankTransaction;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\TaxCode;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Partners\Models\Partner;
use Modules\Payables\Models\BillPayment;
use Modules\Payables\Models\SupplierBill;
use Modules\Payables\Models\SupplierBillLine;
use Modules\Payables\Support\BillPaymentRecorder;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingWhtBillPaymentTest extends TestCase
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

    public function test_bill_payment_with_wht_posts_payable_and_nets_bank_cash(): void
    {
        $partner = Partner::factory()->create(['supplier_rank' => 1]);
        $bill = $this->issuedBill($partner, 100000);

        $wht = TaxCode::query()->where('code', 'PPH23_2')->firstOrFail();
        $whtPayable = Account::query()->where('system_role', 'wht_payable')->firstOrFail();

        $payment = BillPaymentRecorder::record([
            'partner_id' => $partner->id,
            'payment_date' => now()->toDateString(),
            'amount' => 100000,
            'method' => BillPayment::METHOD_TRANSFER,
            'wht_tax_code_id' => $wht->id,
            'wht_amount' => 2000,
            'allocations' => [
                ['supplier_bill_id' => $bill->id, 'amount' => 100000],
            ],
        ]);

        $this->assertEqualsWithDelta(2000.0, (float) $payment->wht_amount, 0.01);
        $this->assertEqualsWithDelta(98000.0, $payment->cashAmount(), 0.01);

        $journal = JournalEntry::query()
            ->where('source_type', $payment->getMorphClass())
            ->where('source_id', $payment->id)
            ->where('event', 'bill_payment.recorded')
            ->where('status', JournalEntry::STATUS_POSTED)
            ->with('lines.account')
            ->firstOrFail();

        $ap = $journal->lines->first(fn ($line) => $line->account->system_role === 'ap_control');
        $cash = $journal->lines->first(fn ($line) => (float) $line->credit === 98000.0);
        $whtLine = $journal->lines->first(fn ($line) => (int) $line->account_id === (int) $whtPayable->id);

        $this->assertNotNull($ap);
        $this->assertEqualsWithDelta(100000.0, (float) $ap->debit, 0.01);
        $this->assertNotNull($cash);
        $this->assertEqualsWithDelta(98000.0, (float) $cash->credit, 0.01);
        $this->assertNotNull($whtLine);
        $this->assertEqualsWithDelta(2000.0, (float) $whtLine->credit, 0.01);

        $this->assertDatabaseHas('bank_transactions', [
            'source_type' => $payment->getMorphClass(),
            'source_id' => $payment->id,
            'direction' => BankTransaction::DIRECTION_OUT,
            'amount' => 98000,
            'status' => BankTransaction::STATUS_POSTED,
        ]);
    }

    public function test_bill_payment_without_wht_still_posts_full_cash_out(): void
    {
        $partner = Partner::factory()->create(['supplier_rank' => 1]);
        $bill = $this->issuedBill($partner, 50000);

        $payment = BillPaymentRecorder::record([
            'partner_id' => $partner->id,
            'payment_date' => now()->toDateString(),
            'amount' => 50000,
            'method' => BillPayment::METHOD_TRANSFER,
            'allocations' => [
                ['supplier_bill_id' => $bill->id, 'amount' => 50000],
            ],
        ]);

        $journal = JournalEntry::query()
            ->where('source_type', $payment->getMorphClass())
            ->where('source_id', $payment->id)
            ->where('event', 'bill_payment.recorded')
            ->with('lines')
            ->firstOrFail();

        $this->assertCount(2, $journal->lines);
        $this->assertDatabaseHas('bank_transactions', [
            'source_id' => $payment->id,
            'amount' => 50000,
        ]);
    }

    private function issuedBill(Partner $partner, float $amount): SupplierBill
    {
        $bill = SupplierBill::query()->create([
            'code' => 'BILL-WHT-'.uniqid(),
            'partner_id' => $partner->id,
            'status' => SupplierBill::STATUS_ISSUED,
            'bill_date' => now()->toDateString(),
            'tax_enabled' => false,
            'tax_rate' => 0,
            'subtotal' => $amount,
            'tax_amount' => 0,
            'total' => $amount,
            'amount_paid' => 0,
        ]);

        SupplierBillLine::query()->create([
            'supplier_bill_id' => $bill->id,
            'description' => 'Services',
            'amount' => $amount,
        ]);

        return $bill;
    }
}
