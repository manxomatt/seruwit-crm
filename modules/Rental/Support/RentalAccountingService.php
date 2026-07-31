<?php

namespace Modules\Rental\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Support\PaymentTerms;
use Modules\Receivables\Models\Payment;
use Modules\Receivables\Support\PaymentRecorder;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Notifications\RentalLifecycleMailNotification;

/**
 * Soft-depend bridge between rental ops and Accounting / Receivables.
 * Tenants without Accounting keep working; GL posts only when AccountingBridge is ready.
 */
class RentalAccountingService
{
    public function __construct(
        private readonly RentalInvoiceService $invoices,
        private readonly RentalMailer $mailer,
    ) {}

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
     * Ensures the base charge/invoice exists first (demo-seeded or legacy rentals may skip confirm).
     *
     * @return list<Invoice>
     */
    public function issueDraftInvoices(Rental $rental): array
    {
        if (! $this->invoices->isAvailable()) {
            return [];
        }

        $this->invoices->invoiceBase($rental->fresh());

        $issued = [];
        $rental->loadMissing('partner');

        foreach ($this->draftInvoicesFor($rental->fresh()) as $invoice) {
            if (! $invoice->lines()->exists()) {
                continue;
            }

            $issueDate = $invoice->issue_date?->toDateString() ?? now()->toDateString();
            $dueDate = $invoice->due_date?->toDateString()
                ?? PaymentTerms::dueDateFor($issueDate, $rental->partner);

            $invoice->update([
                'status' => Invoice::STATUS_ISSUED,
                'issue_date' => $issueDate,
                'due_date' => $dueDate,
            ]);

            $fresh = $invoice->fresh(['lines', 'partner']);

            if (class_exists(\Modules\Accounting\Support\AccountingBridge::class)) {
                \Modules\Accounting\Support\AccountingBridge::invoiceIssued($fresh);
            }

            $issued[] = $fresh;
        }

        if ($issued !== []) {
            $this->mailer->notify(
                $rental->fresh(['vehicle', 'partner']),
                RentalLifecycleMailNotification::EVENT_INVOICE_ISSUED,
                ['invoice_count' => count($issued)],
            );
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

        if ($deposit >= 0.005) {
            $this->mailer->notify(
                $rental->fresh(['vehicle', 'partner']),
                RentalLifecycleMailNotification::EVENT_DEPOSIT_SETTLED,
                [
                    'applied' => $applied,
                    'refunded' => $refunded,
                ],
            );
        }
    }

    /**
     * On cancel after deposit was received: refund full liability via GL.
     * Works for draft (online deposit before confirm) and confirmed.
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
     * Void unpaid rental invoices (reverse GL) or issue one credit note covering paid invoices.
     */
    public function settleInvoicesOnCancel(Rental $rental): void
    {
        if (! $this->invoices->isAvailable()) {
            return;
        }

        $rental->loadMissing('partner');
        $invoices = $this->allInvoicesFor($rental);
        $paid = [];

        foreach ($invoices as $invoice) {
            if ($invoice->status === Invoice::STATUS_VOID) {
                continue;
            }

            if ((float) ($invoice->amount_paid ?? 0) > 0 || $invoice->status === Invoice::STATUS_PAID) {
                $paid[] = $invoice;

                continue;
            }

            if (in_array($invoice->status, [Invoice::STATUS_DRAFT, Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID], true)) {
                DB::transaction(function () use ($invoice): void {
                    $invoice->lines()->delete();
                    $invoice->update(['status' => Invoice::STATUS_VOID]);

                    if (class_exists(\Modules\Accounting\Support\AccountingBridge::class)) {
                        \Modules\Accounting\Support\AccountingBridge::invoiceVoided($invoice->fresh());
                    }
                });
            }
        }

        if ($paid !== []) {
            $this->createCreditNoteForPaidInvoices($rental, $paid);
        }
    }

    /**
     * @param  list<Invoice>  $paidInvoices
     */
    private function createCreditNoteForPaidInvoices(Rental $rental, array $paidInvoices): ?Invoice
    {
        if ($rental->partner_id === null || $paidInvoices === []) {
            return null;
        }

        $net = round(array_sum(array_map(
            function (Invoice $invoice): float {
                $paid = round((float) ($invoice->amount_paid ?? 0), 2);
                $total = round((float) $invoice->total, 2);

                // Credit only what was collected (partial-paid must not reverse unpaid AR).
                if ($paid > 0.005 && $total > 0.005 && $paid + 0.005 < $total) {
                    return $paid;
                }

                return abs((float) $invoice->subtotal);
            },
            $paidInvoices,
        )), 2);

        if (abs($net) < 0.005) {
            return null;
        }

        $amount = -1 * abs($net);
        $first = $paidInvoices[0];
        $codes = implode(', ', array_map(fn (Invoice $i): string => $i->code, $paidInvoices));

        $hasPartial = collect($paidInvoices)->contains(function (Invoice $invoice): bool {
            $paid = round((float) ($invoice->amount_paid ?? 0), 2);
            $total = round((float) $invoice->total, 2);

            return $paid > 0.005 && $total > 0.005 && $paid + 0.005 < $total;
        });

        $taxAttrs = $hasPartial
            ? [
                'tax_enabled' => false,
                'tax_rate' => 0,
                'tax_code_id' => null,
                'tax_code' => null,
                'tax_calculation' => 'exclusive',
            ]
            : (class_exists(\Modules\Accounting\Support\TaxSettings::class)
                ? \Modules\Accounting\Support\TaxSettings::documentAttributes()
                : [
                    'tax_enabled' => (bool) $first->tax_enabled,
                    'tax_rate' => (float) $first->tax_rate,
                    'tax_code_id' => $first->tax_code_id,
                    'tax_code' => $first->tax_code,
                    'tax_calculation' => $first->tax_calculation ?? 'exclusive',
                ]);

        return DB::transaction(function () use ($rental, $taxAttrs, $amount, $codes): Invoice {
            $invoice = Invoice::create([
                'code' => Invoice::nextCode(),
                'partner_id' => $rental->partner_id,
                'status' => Invoice::STATUS_DRAFT,
                'issue_date' => now()->toDateString(),
                'due_date' => now()->toDateString(),
                ...$taxAttrs,
                'subtotal' => 0,
                'tax_amount' => 0,
                'total' => 0,
                'amount_paid' => 0,
                'notes' => __('rental.invoice.credit_notes', [
                    'code' => $rental->code,
                    'invoice' => $codes,
                ]),
            ]);

            \Modules\Invoicing\Models\InvoiceLine::create([
                'invoice_id' => $invoice->id,
                'description' => __('rental.invoice.credit_line', ['code' => $rental->code]),
                'amount' => $amount,
                'source_type' => $rental->getMorphClass(),
                'source_id' => $rental->id,
            ]);

            $invoice->recalculate();
            $invoice->update(['status' => Invoice::STATUS_ISSUED]);

            if (class_exists(\Modules\Accounting\Support\AccountingBridge::class)) {
                \Modules\Accounting\Support\AccountingBridge::invoiceIssued($invoice->fresh(['lines', 'partner']));
            }

            return $invoice->fresh(['lines']);
        });
    }

    /**
     * @return list<Invoice>
     */
    private function draftInvoicesFor(Rental $rental): array
    {
        return array_values(array_filter(
            $this->allInvoicesFor($rental),
            fn (Invoice $invoice): bool => $invoice->status === Invoice::STATUS_DRAFT,
        ));
    }

    /**
     * @return list<Invoice>
     */
    private function allInvoicesFor(Rental $rental): array
    {
        $chargeIds = $rental->charges()->pluck('id');

        if ($chargeIds->isEmpty()) {
            return [];
        }

        $morph = (new RentalCharge)->getMorphClass();

        return Invoice::query()
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
        return array_values(array_filter(
            $this->allInvoicesFor($rental),
            fn (Invoice $invoice): bool => in_array($invoice->status, [Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID], true),
        ));
    }
}
