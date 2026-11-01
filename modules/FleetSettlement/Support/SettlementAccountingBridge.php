<?php

namespace Modules\FleetSettlement\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Support\AccountingBridge;
use Modules\Expenses\Models\ExpenseClaim;
use Modules\Expenses\Support\ExpenseService;
use Modules\FleetSettlement\Models\VehicleSettlement;
use Modules\Payables\Models\BillPayment;
use Modules\Payables\Models\SupplierBill;
use Modules\Payables\Models\SupplierBillLine;
use Modules\Payables\Support\BillPaymentRecorder;

class SettlementAccountingBridge
{
    /**
     * Synchronize an approved or paid VehicleSettlement with Payables (SupplierBill + BillPayment + WHT)
     * or Expenses, posting journals to GL and outbound cash/bank transactions to BankBookService.
     *
     * @param  array{
     *     company_bank_account_id?: int|null,
     *     wht_tax_code_id?: int|null,
     *     wht_amount?: float|int|string|null
     * }  $options
     */
    public function sync(VehicleSettlement $settlement, array $options = []): ?SupplierBill
    {
        $netPayout = round((float) $settlement->net_payout, 2);

        if ($netPayout < 0.01) {
            return null;
        }

        if (! in_array($settlement->status, [VehicleSettlement::STATUS_APPROVED, VehicleSettlement::STATUS_PAID], true)) {
            return null;
        }

        if ($settlement->partner_id && class_exists(SupplierBill::class) && Schema::hasTable('supplier_bills')) {
            return $this->syncViaPayables($settlement, $netPayout, $options);
        }

        if ($settlement->status === VehicleSettlement::STATUS_PAID && class_exists(ExpenseService::class)) {
            $this->syncViaDirectExpense($settlement, $netPayout, $options);
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $options
     */
    private function syncViaPayables(VehicleSettlement $settlement, float $netPayout, array $options): SupplierBill
    {
        return DB::transaction(function () use ($settlement, $netPayout, $options): SupplierBill {
            $billCode = 'BILL-'.$settlement->code;
            $bill = SupplierBill::query()->where('code', $billCode)->first();

            $billDate = ($settlement->approved_at ?? $settlement->end_date ?? now())->toDateString();
            $vehiclePlate = $settlement->vehicle?->plate_number ?? "Unit #{$settlement->vehicle_id}";
            $lineDescription = "Bagi Hasil Armada {$vehiclePlate} ({$settlement->period_month}) — {$settlement->code}";

            if ($bill === null) {
                $bill = SupplierBill::query()->create([
                    'code' => $billCode,
                    'partner_id' => (int) $settlement->partner_id,
                    'status' => SupplierBill::STATUS_DRAFT,
                    'bill_date' => $billDate,
                    'due_date' => $billDate,
                    'tax_enabled' => false,
                    'tax_rate' => 0,
                    'subtotal' => $netPayout,
                    'tax_amount' => 0,
                    'total' => $netPayout,
                    'amount_paid' => 0,
                    'notes' => "Statement Bagi Hasil Investor {$settlement->code}",
                ]);

                SupplierBillLine::query()->create([
                    'supplier_bill_id' => $bill->id,
                    'description' => $lineDescription,
                    'quantity' => 1,
                    'unit_price' => $netPayout,
                    'amount' => $netPayout,
                ]);
            } elseif ($bill->status === SupplierBill::STATUS_DRAFT) {
                $bill->lines()->delete();
                SupplierBillLine::query()->create([
                    'supplier_bill_id' => $bill->id,
                    'description' => $lineDescription,
                    'quantity' => 1,
                    'unit_price' => $netPayout,
                    'amount' => $netPayout,
                ]);
                $bill->recalculate();
            }

            if ($bill->status === SupplierBill::STATUS_DRAFT) {
                $bill->update(['status' => SupplierBill::STATUS_ISSUED]);
                if (class_exists(AccountingBridge::class)) {
                    AccountingBridge::billIssued($bill->fresh(['lines', 'partner']));
                }
            }

            $bill = $bill->fresh();

            if ($settlement->status === VehicleSettlement::STATUS_PAID && $bill->balanceDue() > 0.009) {
                $method = $settlement->payment_method === 'cash'
                    ? BillPayment::METHOD_CASH
                    : BillPayment::METHOD_TRANSFER;

                BillPaymentRecorder::record([
                    'partner_id' => (int) $settlement->partner_id,
                    'payment_date' => ($settlement->paid_at ?? now())->toDateString(),
                    'amount' => $bill->balanceDue(),
                    'method' => $method,
                    'company_bank_account_id' => $options['company_bank_account_id'] ?? null,
                    'wht_tax_code_id' => $options['wht_tax_code_id'] ?? null,
                    'wht_amount' => $options['wht_amount'] ?? null,
                    'reference_number' => $settlement->payment_reference ?: $settlement->code,
                    'notes' => "Pencairan bagi hasil {$settlement->code}",
                    'recorded_by' => $settlement->paid_by,
                    'allocations' => [
                        [
                            'supplier_bill_id' => $bill->id,
                            'amount' => $bill->balanceDue(),
                        ],
                    ],
                ]);
            }

            return $bill->fresh(['lines']);
        });
    }

    /**
     * @param  array<string, mixed>  $options
     */
    private function syncViaDirectExpense(VehicleSettlement $settlement, float $netPayout, array $options): void
    {
        if (! Schema::hasTable('expense_claims')) {
            return;
        }

        $existing = ExpenseClaim::query()
            ->where('source_type', $settlement->getMorphClass())
            ->where('source_id', $settlement->id)
            ->where('status', '!=', ExpenseClaim::STATUS_VOIDED)
            ->first();

        if ($existing !== null) {
            return;
        }

        app(ExpenseService::class)->create([
            'expense_date' => ($settlement->paid_at ?? now())->toDateString(),
            'type' => ExpenseClaim::TYPE_DIRECT,
            'title' => "Bagi Hasil Armada {$settlement->code} ({$settlement->period_month})",
            'vehicle_id' => $settlement->vehicle_id,
            'partner_id' => $settlement->partner_id,
            'company_bank_account_id' => $options['company_bank_account_id'] ?? null,
            'payment_method' => $settlement->payment_method === 'cash' ? 'cash' : 'bank_transfer',
            'reference_number' => $settlement->payment_reference ?: $settlement->code,
            'source_type' => $settlement->getMorphClass(),
            'source_id' => (int) $settlement->id,
            'post_immediately' => true,
            'lines' => [
                [
                    'description' => "Pencairan bagi hasil armada {$settlement->code}",
                    'amount' => $netPayout,
                    'vehicle_id' => $settlement->vehicle_id,
                ],
            ],
        ], $settlement->paid_by);
    }
}
