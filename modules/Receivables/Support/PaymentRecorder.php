<?php

namespace Modules\Receivables\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Invoicing\Models\Invoice;
use Modules\Receivables\Models\Payment;
use Modules\Receivables\Models\PaymentAllocation;

class PaymentRecorder
{
    /**
     * @param  array{
     *     partner_id: int,
     *     payment_date: string,
     *     amount: float|int|string,
     *     type?: string,
     *     method?: string,
     *     reference_number?: string|null,
     *     notes?: string|null,
     *     recorded_by?: int|null,
     *     company_bank_account_id?: int|null,
     *     post_accounting?: bool,
     *     allocations: list<array{invoice_id: int, amount: float|int|string}>
     * }  $data
     */
    public static function record(array $data): Payment
    {
        return DB::transaction(function () use ($data): Payment {
            $amount = round((float) $data['amount'], 2);
            $allocations = collect($data['allocations'] ?? []);

            if ($allocations->isEmpty()) {
                throw ValidationException::withMessages([
                    'allocations' => __('receivables.validation.allocations_empty'),
                ]);
            }

            $allocatedTotal = round($allocations->sum(fn (array $row): float => (float) $row['amount']), 2);

            if (abs($allocatedTotal - $amount) > 0.009) {
                throw ValidationException::withMessages([
                    'amount' => __('receivables.validation.amount_mismatch'),
                ]);
            }

            $attributes = [
                'code' => Payment::nextCode(),
                'partner_id' => $data['partner_id'],
                'payment_date' => $data['payment_date'],
                'amount' => $amount,
                'type' => $data['type'] ?? Payment::TYPE_INSTALLMENT,
                'method' => $data['method'] ?? Payment::METHOD_TRANSFER,
                'reference_number' => $data['reference_number'] ?? null,
                'status' => Payment::STATUS_POSTED,
                'notes' => $data['notes'] ?? null,
                'recorded_by' => $data['recorded_by'] ?? Auth::id(),
            ];

            if (\Illuminate\Support\Facades\Schema::hasColumn('payments', 'company_bank_account_id')) {
                $attributes['company_bank_account_id'] = $data['company_bank_account_id'] ?? null;
            }

            $payment = Payment::query()->create($attributes);

            $touchedInvoiceIds = [];

            foreach ($allocations as $row) {
                $invoice = Invoice::query()->lockForUpdate()->findOrFail($row['invoice_id']);

                if ((int) $invoice->partner_id !== (int) $data['partner_id']) {
                    throw ValidationException::withMessages([
                        'allocations' => __('receivables.validation.invoice_wrong_partner', ['code' => $invoice->code]),
                    ]);
                }

                if (! in_array($invoice->status, [Invoice::STATUS_ISSUED, Invoice::STATUS_PARTIALLY_PAID], true)) {
                    throw ValidationException::withMessages([
                        'allocations' => __('receivables.validation.invoice_not_open', ['code' => $invoice->code]),
                    ]);
                }

                $allocAmount = round((float) $row['amount'], 2);

                if ($allocAmount <= 0) {
                    throw ValidationException::withMessages([
                        'allocations' => __('receivables.validation.allocation_gt_zero'),
                    ]);
                }

                if ($allocAmount - $invoice->balanceDue() > 0.009) {
                    throw ValidationException::withMessages([
                        'allocations' => __('receivables.validation.allocation_exceeds_balance', ['code' => $invoice->code]),
                    ]);
                }

                PaymentAllocation::query()->create([
                    'payment_id' => $payment->id,
                    'invoice_id' => $invoice->id,
                    'amount' => $allocAmount,
                ]);

                $touchedInvoiceIds[] = $invoice->id;
            }

            foreach (array_unique($touchedInvoiceIds) as $invoiceId) {
                self::syncInvoice((int) $invoiceId);
            }

            $payment = $payment->fresh(['allocations', 'partner']);

            if (($data['post_accounting'] ?? true) && class_exists(\Modules\Accounting\Support\AccountingBridge::class)) {
                \Modules\Accounting\Support\AccountingBridge::paymentRecorded($payment);
            }

            return $payment;
        });
    }

    /**
     * Record a full settlement for a single open invoice (convenience for "Mark Paid").
     */
    public static function settleInvoice(Invoice $invoice, ?string $method = null): Payment
    {
        $balance = $invoice->balanceDue();

        if ($balance <= 0) {
            throw ValidationException::withMessages([
                'invoice' => __('receivables.validation.invoice_no_balance'),
            ]);
        }

        return self::record([
            'partner_id' => $invoice->partner_id,
            'payment_date' => now()->toDateString(),
            'amount' => $balance,
            'type' => Payment::TYPE_SETTLEMENT,
            'method' => $method ?? Payment::METHOD_TRANSFER,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => $balance],
            ],
        ]);
    }

    public static function void(Payment $payment): void
    {
        if (! $payment->isPosted()) {
            throw ValidationException::withMessages([
                'payment' => __('receivables.validation.void_posted_only'),
            ]);
        }

        DB::transaction(function () use ($payment): void {
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);
            $invoiceIds = $payment->allocations()->pluck('invoice_id')->all();

            $payment->update([
                'status' => Payment::STATUS_VOIDED,
                'voided_at' => now(),
            ]);

            foreach ($invoiceIds as $invoiceId) {
                self::syncInvoice((int) $invoiceId);
            }

            if (class_exists(\Modules\Accounting\Support\AccountingBridge::class)) {
                \Modules\Accounting\Support\AccountingBridge::paymentVoided($payment->fresh());
            }
        });
    }

    public static function syncInvoice(int $invoiceId): void
    {
        $invoice = Invoice::query()->lockForUpdate()->findOrFail($invoiceId);

        if (in_array($invoice->status, [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID], true)) {
            return;
        }

        $amountPaid = (float) PaymentAllocation::query()
            ->where('invoice_id', $invoice->id)
            ->whereHas('payment', fn ($q) => $q->where('status', Payment::STATUS_POSTED))
            ->sum('amount');

        $amountPaid = round($amountPaid, 2);
        $total = round((float) $invoice->total, 2);

        $attributes = ['amount_paid' => $amountPaid];

        if ($amountPaid <= 0) {
            $attributes['status'] = Invoice::STATUS_ISSUED;
            $attributes['paid_at'] = null;
        } elseif ($amountPaid + 0.009 >= $total) {
            $attributes['status'] = Invoice::STATUS_PAID;
            $attributes['paid_at'] = $invoice->paid_at ?? now();
            $attributes['amount_paid'] = $total;
        } else {
            $attributes['status'] = Invoice::STATUS_PARTIALLY_PAID;
            $attributes['paid_at'] = null;
        }

        $invoice->update($attributes);
    }
}
