<?php

namespace Modules\Rental\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Modules\Invoicing\Models\Invoice;
use Modules\Receivables\Models\Payment;
use Modules\Receivables\Support\PaymentRecorder;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;

/**
 * Soft-depend bridge between rental ops and Accounting / Receivables.
 * Tenants without Accounting keep working; GL posts only when AccountingBridge is ready.
 */
class RentalAccountingService
{
    public function __construct(private readonly RentalInvoiceService $invoices) {}

    public function accountingAvailable(): bool
    {
        return class_exists(\Modules\Accounting\Support\AccountingBridge::class)
            && \Modules\Accounting\Support\AccountingBridge::available();
    }

    public function receivablesAvailable(): bool
    {
        return Schema::hasTable('payments')
            && class_exists(PaymentRecorder::class);
    }

    /**
     * Issue every draft invoice linked to this rental's charges and post revenue journals.
     *
     * @return list<Invoice>
     */
    public function issueDraftInvoices(Rental $rental): array
    {
        if (! $this->invoices->isAvailable()) {
            return [];
        }

        $issued = [];

        foreach ($this->draftInvoicesFor($rental) as $invoice) {
            if (! $invoice->lines()->exists()) {
                continue;
            }

            $invoice->update([
                'status' => Invoice::STATUS_ISSUED,
                'issue_date' => $invoice->issue_date ?? now()->toDateString(),
            ]);

            $fresh = $invoice->fresh(['lines']);

            if (class_exists(\Modules\Accounting\Support\AccountingBridge::class)) {
                \Modules\Accounting\Support\AccountingBridge::invoiceIssued($fresh);
            }

            $issued[] = $fresh;
        }

        return $issued;
    }

    /**
     * Record customer deposit cash in (Dr cash/bank, Cr customer deposit liability).
     *
     * @param  array{payment_method?: string|null, company_bank_account_id?: int|null}  $options
     */
    public function receiveDeposit(Rental $rental, array $options = []): void
    {
        $amount = round((float) $rental->deposit_amount, 2);

        if ($amount < 0.005) {
            return;
        }

        if ($rental->deposit_received_at !== null) {
            return;
        }

        if ($rental->deposit_status === Rental::DEPOSIT_SETTLED) {
            return;
        }

        $method = $options['payment_method'] ?? 'cash';
        $bankAccountId = isset($options['company_bank_account_id'])
            ? (int) $options['company_bank_account_id']
            : null;

        $rental->update([
            'deposit_received_at' => now(),
            'deposit_payment_method' => $method,
            'deposit_company_bank_account_id' => $bankAccountId > 0 ? $bankAccountId : null,
        ]);

        if (! $this->accountingAvailable()) {
            return;
        }

        \Modules\Accounting\Support\AccountingBridge::rentalDepositReceived($rental->fresh());
    }

    /**
     * Settle deposit: issue open invoices, apply to AR, refund remainder, post GL.
     *
     * @param  array{deposit_applied_amount: float|int|string, deposit_refunded_amount: float|int|string}  $amounts
     */
    public function settleDeposit(Rental $rental, array $amounts): void
    {
        $applied = round((float) $amounts['deposit_applied_amount'], 2);
        $refunded = round((float) $amounts['deposit_refunded_amount'], 2);
        $deposit = round((float) $rental->deposit_amount, 2);

        if ($deposit >= 0.005 && $rental->deposit_received_at === null) {
            throw ValidationException::withMessages([
                'deposit_applied_amount' => __('rental.errors.deposit_not_received'),
            ]);
        }

        DB::transaction(function () use ($rental, $applied, $refunded, $deposit): void {
            $this->issueDraftInvoices($rental);

            $toAr = 0.0;
            $forfeited = $applied;

            if ($applied >= 0.005 && $this->receivablesAvailable()) {
                $toAr = $this->allocateDepositToInvoices($rental, $applied);
                $forfeited = round(max(0, $applied - $toAr), 2);
            }

            $rental->settleDeposit([
                'deposit_applied_amount' => $applied,
                'deposit_refunded_amount' => $refunded,
            ]);

            if (! $this->accountingAvailable() || $deposit < 0.005) {
                return;
            }

            $fresh = $rental->fresh();

            if ($applied >= 0.005) {
                \Modules\Accounting\Support\AccountingBridge::rentalDepositApplied(
                    $fresh,
                    applied: $applied,
                    toAr: $toAr,
                    forfeited: $forfeited,
                );
            }

            if ($refunded >= 0.005) {
                \Modules\Accounting\Support\AccountingBridge::rentalDepositRefunded($fresh, $refunded);
            }
        });
    }

    /**
     * On cancel after deposit was received: refund full liability via GL.
     */
    public function refundDepositOnCancel(Rental $rental): void
    {
        $amount = round((float) $rental->deposit_amount, 2);

        if ($amount < 0.005 || $rental->deposit_received_at === null) {
            return;
        }

        if ($rental->deposit_status === Rental::DEPOSIT_SETTLED) {
            return;
        }

        $this->settleDeposit($rental, [
            'deposit_applied_amount' => 0,
            'deposit_refunded_amount' => $amount,
        ]);
    }

    /**
     * @return list<Invoice>
     */
    private function draftInvoicesFor(Rental $rental): array
    {
        $chargeIds = $rental->charges()->pluck('id');

        if ($chargeIds->isEmpty()) {
            return [];
        }

        $morph = (new RentalCharge)->getMorphClass();

        return Invoice::query()
            ->where('status', Invoice::STATUS_DRAFT)
            ->whereHas('lines', fn ($q) => $q
                ->where('source_type', $morph)
                ->whereIn('source_id', $chargeIds))
            ->orderBy('id')
            ->get()
            ->unique('id')
            ->values()
            ->all();
    }

    /**
     * FIFO allocate deposit against open invoices for this rental. Returns amount posted to AR.
     */
    private function allocateDepositToInvoices(Rental $rental, float $applied): float
    {
        $open = $this->openInvoicesFor($rental);

        if ($open === []) {
            return 0.0;
        }

        $remaining = $applied;
        $allocations = [];

        foreach ($open as $invoice) {
            if ($remaining < 0.005) {
                break;
            }

            $balance = round($invoice->balanceDue(), 2);

            if ($balance < 0.005) {
                continue;
            }

            $take = round(min($remaining, $balance), 2);
            $allocations[] = ['invoice_id' => $invoice->id, 'amount' => $take];
            $remaining = round($remaining - $take, 2);
        }

        if ($allocations === []) {
            return 0.0;
        }

        $allocated = round(array_sum(array_column($allocations, 'amount')), 2);

        PaymentRecorder::record([
            'partner_id' => $rental->partner_id,
            'payment_date' => now()->toDateString(),
            'amount' => $allocated,
            'type' => Payment::TYPE_OTHER,
            'method' => Payment::METHOD_OTHER,
            'reference_number' => $rental->code,
            'notes' => __('rental.invoice.notes_deposit_applied', ['code' => $rental->code]),
            'post_accounting' => false,
            'allocations' => $allocations,
        ]);

        return $allocated;
    }

    /**
     * @return list<Invoice>
     */
    private function openInvoicesFor(Rental $rental): array
    {
        $chargeIds = $rental->charges()->pluck('id');

        if ($chargeIds->isEmpty()) {
            return [];
        }

        $morph = (new RentalCharge)->getMorphClass();

        return Invoice::query()
            ->where('partner_id', $rental->partner_id)
            ->whereIn('status', [Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID])
            ->whereHas('lines', fn ($q) => $q
                ->where('source_type', $morph)
                ->whereIn('source_id', $chargeIds))
            ->orderBy('id')
            ->get()
            ->all();
    }
}
