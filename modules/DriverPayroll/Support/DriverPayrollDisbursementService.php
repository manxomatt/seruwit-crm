<?php

namespace Modules\DriverPayroll\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\AccountingBridge;
use Modules\Accounting\Support\BankBookService;
use Modules\Accounting\Support\JournalService;
use Modules\Accounting\Support\PaymentAccountResolver;
use Modules\DriverPayroll\Models\DriverPayroll;
use Modules\DriverPayroll\Models\DriverPayrollLine;
use Modules\Expenses\Models\CashAdvance;

class DriverPayrollDisbursementService
{
    public function __construct(
        private readonly JournalService $journals,
        private readonly BankBookService $bankBook,
        private readonly PaymentAccountResolver $accountResolver,
    ) {}

    /**
     * Approve payroll draft.
     */
    public function approve(DriverPayroll $payroll, ?User $actor = null): DriverPayroll
    {
        if ($payroll->isPaid() || $payroll->status === DriverPayroll::STATUS_CANCELLED) {
            throw ValidationException::withMessages([
                'payroll' => 'Payroll yang sudah dicairkan atau dibatalkan tidak dapat disetujui ulang.',
            ]);
        }

        $payroll->update([
            'status' => DriverPayroll::STATUS_APPROVED,
            'approved_at' => now(),
            'approved_by' => $actor?->id,
        ]);

        return $payroll->fresh(['driver', 'lines']);
    }

    /**
     * Disburse payroll to driver, post journal entries to GL, and record to BankBook.
     */
    public function disburse(
        DriverPayroll $payroll,
        ?int $companyBankAccountId = null,
        ?string $paymentMethod = 'bank_transfer',
        ?string $paymentReference = null,
        ?User $actor = null
    ): DriverPayroll {
        if ($payroll->isPaid()) {
            return $payroll;
        }

        if ($payroll->status === DriverPayroll::STATUS_CANCELLED) {
            throw ValidationException::withMessages([
                'payroll' => 'Payroll yang dibatalkan tidak dapat dicairkan.',
            ]);
        }

        return DB::transaction(function () use ($payroll, $companyBankAccountId, $paymentMethod, $paymentReference, $actor): DriverPayroll {
            $payroll->loadMissing(['driver', 'lines']);

            $companyBankAccount = $this->accountResolver->resolveCompanyAccount($paymentMethod, $companyBankAccountId);
            $cashLedgerAccount = $companyBankAccount?->ledgerAccount
                ?? Account::query()->where('system_role', 'bank_primary')->first()
                ?? Account::query()->where('system_role', 'cash')->first()
                ?? Account::query()->where('code', '1120')->first()
                ?? Account::query()->where('code', '1110')->first();

            $payrollExpenseAccount = Account::query()->where('system_role', 'payroll_driver')->first()
                ?? Account::query()->where('code', '6160')->first()
                ?? Account::query()->where('system_role', 'expense_meal_travel')->first()
                ?? Account::query()->where('system_role', 'opex')->first()
                ?? Account::query()->where('code', '6100')->first();

            $cashAdvanceAccount = Account::query()->where('system_role', 'cash_advance')->first()
                ?? Account::query()->where('code', '1150')->first();

            $grossPay = (float) $payroll->base_salary
                + (float) $payroll->daily_allowance_total
                + (float) $payroll->overtime_pay_total
                + (float) $payroll->trip_commission_total
                + (float) $payroll->bonus_total;

            $deductions = (float) $payroll->deductions_total;
            $netPay = round((float) $payroll->net_pay, 2);

            // 1. Post General Ledger Journal if accounting module is available
            if (AccountingBridge::available() && $payrollExpenseAccount && $cashLedgerAccount) {
                $journalLines = [];

                // Debit: Beban Gaji & Komisi Supir (gross earnings)
                if ($grossPay > 0) {
                    $journalLines[] = [
                        'account_id' => $payrollExpenseAccount->id,
                        'debit' => round($grossPay, 2),
                        'credit' => 0,
                        'partner_id' => null,
                        'memo' => "Gaji & Komisi Pengemudi {$payroll->code} - {$payroll->driver?->name}",
                    ];
                }

                // Credit: Potongan Kasbon Karyawan / Supir
                if ($deductions > 0 && $cashAdvanceAccount) {
                    $journalLines[] = [
                        'account_id' => $cashAdvanceAccount->id,
                        'debit' => 0,
                        'credit' => round($deductions, 2),
                        'partner_id' => null,
                        'memo' => "Pelunasan Potongan Kasbon via Payroll {$payroll->code}",
                    ];
                }

                // Credit: Kas / Bank (net pay disbursed)
                if ($netPay > 0) {
                    $journalLines[] = [
                        'account_id' => $cashLedgerAccount->id,
                        'debit' => 0,
                        'credit' => $netPay,
                        'partner_id' => null,
                        'memo' => "Pencairan Gaji Bersih {$payroll->code} ({$payroll->driver?->name})",
                    ];
                }

                if (! empty($journalLines)) {
                    $entry = $this->journals->createDraft([
                        'entry_date' => now()->toDateString(),
                        'type' => JournalEntry::TYPE_AUTO,
                        'memo' => "Pencairan Payroll Pengemudi {$payroll->code}: {$payroll->driver?->name}",
                        'lines' => $journalLines,
                    ], $actor?->id);

                    $entry->update([
                        'source_type' => $payroll->getMorphClass(),
                        'source_id' => (int) $payroll->id,
                        'event' => 'driver_payroll.disbursed',
                    ]);

                    $this->journals->post($entry, $actor?->id);
                }
            }

            // 2. Record to BankBook if net pay > 0
            if ($netPay > 0 && BankBookService::isReady()) {
                $this->bankBook->recordOutboundFromSource(
                    source: $payroll,
                    amount: $netPay,
                    date: now()->toDateString(),
                    method: $paymentMethod ?? 'bank_transfer',
                    companyBankAccountId: $companyBankAccount?->id,
                    reference: $payroll->code,
                    memo: "Payroll Pengemudi: {$payroll->driver?->name} ({$payroll->code})",
                    eventKey: 'driver_payroll.disbursed',
                );
            }

            // 3. Mark deducted CashAdvances as settled
            if (Schema::hasTable('cash_advances')) {
                $advanceLines = $payroll->lines->where('type', DriverPayrollLine::TYPE_CASH_ADVANCE_DEDUCTION);
                foreach ($advanceLines as $line) {
                    if ($line->source_type === CashAdvance::class && $line->source_id) {
                        CashAdvance::query()
                            ->whereKey($line->source_id)
                            ->update([
                                'status' => CashAdvance::STATUS_SETTLED,
                                'settled_at' => now(),
                                'settled_by' => $actor?->id,
                            ]);
                    }
                }
            }

            // 4. Update DriverPayroll status to PAID
            $payroll->update([
                'status' => DriverPayroll::STATUS_PAID,
                'paid_at' => now(),
                'paid_by' => $actor?->id,
                'company_bank_account_id' => $companyBankAccount?->id ?? $companyBankAccountId,
                'payment_method' => $paymentMethod ?? 'bank_transfer',
                'payment_reference' => $paymentReference,
            ]);

            return $payroll->fresh(['driver', 'lines', 'companyBankAccount']);
        });
    }
}
