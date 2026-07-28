<?php

namespace Modules\Payables\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Payables\Models\BillPayment;
use Modules\Payables\Models\BillPaymentAllocation;
use Modules\Payables\Models\SupplierBill;

class BillPaymentRecorder
{
    /**
     * @param  array{
     *     partner_id: int,
     *     payment_date: string,
     *     amount: float|int|string,
     *     method?: string,
     *     reference_number?: string|null,
     *     notes?: string|null,
     *     recorded_by?: int|null,
     *     allocations: list<array{supplier_bill_id: int, amount: float|int|string}>
     * }  $data
     */
    public static function record(array $data): BillPayment
    {
        return DB::transaction(function () use ($data): BillPayment {
            $amount = round((float) $data['amount'], 2);
            $allocations = collect($data['allocations'] ?? []);

            if ($allocations->isEmpty()) {
                throw ValidationException::withMessages([
                    'allocations' => __('payables.validation.allocations_empty'),
                ]);
            }

            $allocatedTotal = round($allocations->sum(fn (array $row): float => (float) $row['amount']), 2);

            if (abs($allocatedTotal - $amount) > 0.009) {
                throw ValidationException::withMessages([
                    'amount' => __('payables.validation.amount_mismatch'),
                ]);
            }

            $attributes = [
                'code' => BillPayment::nextCode(),
                'partner_id' => $data['partner_id'],
                'payment_date' => $data['payment_date'],
                'amount' => $amount,
                'method' => $data['method'] ?? BillPayment::METHOD_TRANSFER,
                'reference_number' => $data['reference_number'] ?? null,
                'status' => BillPayment::STATUS_POSTED,
                'notes' => $data['notes'] ?? null,
                'recorded_by' => $data['recorded_by'] ?? Auth::id(),
            ];

            if (\Illuminate\Support\Facades\Schema::hasColumn('bill_payments', 'company_bank_account_id')) {
                $attributes['company_bank_account_id'] = $data['company_bank_account_id'] ?? null;
            }

            $payment = BillPayment::query()->create($attributes);

            $touched = [];

            foreach ($allocations as $row) {
                $bill = SupplierBill::query()->lockForUpdate()->findOrFail($row['supplier_bill_id']);

                if ((int) $bill->partner_id !== (int) $data['partner_id']) {
                    throw ValidationException::withMessages([
                        'allocations' => __('payables.validation.bill_wrong_partner', ['code' => $bill->code]),
                    ]);
                }

                if (! in_array($bill->status, [SupplierBill::STATUS_ISSUED, SupplierBill::STATUS_PARTIALLY_PAID], true)) {
                    throw ValidationException::withMessages([
                        'allocations' => __('payables.validation.bill_not_open', ['code' => $bill->code]),
                    ]);
                }

                $allocAmount = round((float) $row['amount'], 2);

                if ($allocAmount <= 0 || $allocAmount - $bill->balanceDue() > 0.009) {
                    throw ValidationException::withMessages([
                        'allocations' => __('payables.validation.allocation_invalid', ['code' => $bill->code]),
                    ]);
                }

                BillPaymentAllocation::query()->create([
                    'bill_payment_id' => $payment->id,
                    'supplier_bill_id' => $bill->id,
                    'amount' => $allocAmount,
                ]);

                $touched[] = $bill->id;
            }

            foreach (array_unique($touched) as $billId) {
                self::syncBill((int) $billId);
            }

            $payment = $payment->fresh(['allocations', 'partner']);

            if (class_exists(\Modules\Accounting\Support\AccountingBridge::class)) {
                \Modules\Accounting\Support\AccountingBridge::billPaymentRecorded($payment);
            }

            return $payment;
        });
    }

    public static function void(BillPayment $payment): BillPayment
    {
        return DB::transaction(function () use ($payment): BillPayment {
            $payment = BillPayment::query()->lockForUpdate()->findOrFail($payment->id);

            if ($payment->status === BillPayment::STATUS_VOIDED) {
                throw ValidationException::withMessages([
                    'payment' => __('payables.validation.payment_already_void'),
                ]);
            }

            $billIds = $payment->allocations()->pluck('supplier_bill_id')->all();
            $payment->update([
                'status' => BillPayment::STATUS_VOIDED,
                'voided_at' => now(),
            ]);

            foreach ($billIds as $billId) {
                self::syncBill((int) $billId);
            }

            $payment = $payment->fresh(['allocations', 'partner']);

            if (class_exists(\Modules\Accounting\Support\AccountingBridge::class)) {
                \Modules\Accounting\Support\AccountingBridge::billPaymentVoided($payment);
            }

            return $payment;
        });
    }

    public static function syncBill(int $billId): void
    {
        $bill = SupplierBill::query()->lockForUpdate()->findOrFail($billId);

        $paid = round((float) BillPaymentAllocation::query()
            ->where('supplier_bill_id', $billId)
            ->whereHas('payment', fn ($q) => $q->where('status', BillPayment::STATUS_POSTED))
            ->sum('amount'), 2);

        $bill->update(['amount_paid' => $paid]);
        $bill->syncPaidStatus();
    }
}
