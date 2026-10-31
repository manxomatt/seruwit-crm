<?php

namespace Modules\Expenses\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\AccountingPoster;
use Modules\Accounting\Support\BankBookService;
use Modules\Accounting\Support\JournalService;
use Modules\Accounting\Support\PaymentAccountResolver;
use Modules\Expenses\Models\CashAdvance;
use Modules\Expenses\Models\ExpenseCategory;
use Modules\Expenses\Models\ExpenseClaim;
use Modules\Expenses\Models\ExpenseClaimLine;

class CashAdvanceService
{
    public function __construct(
        private readonly JournalService $journals,
        private readonly AccountingPoster $poster,
        private readonly BankBookService $bankBook,
        private readonly PaymentAccountResolver $accountResolver,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId = null): CashAdvance
    {
        ExpenseSchemaInitializer::ensureReady();

        $actorId = $userId ?? Auth::id();
        $amount = round((float) ($data['amount'] ?? 0), 2);

        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'Nominal kasbon / uang jalan harus lebih besar dari 0.',
            ]);
        }

        return DB::transaction(function () use ($data, $amount, $actorId): CashAdvance {
            $advanceAccount = $this->resolveAdvanceAccount($data['advance_account_id'] ?? null);

            $advance = CashAdvance::query()->create([
                'code' => ! empty($data['code']) ? (string) $data['code'] : CashAdvance::nextCode(),
                'advance_date' => $data['advance_date'],
                'purpose' => (string) $data['purpose'],
                'recipient_name' => $data['recipient_name'] ?? null,
                'user_id' => $data['user_id'] ?? $actorId,
                'driver_id' => $data['driver_id'] ?? null,
                'partner_id' => $data['partner_id'] ?? null,
                'vehicle_id' => $data['vehicle_id'] ?? null,
                'company_bank_account_id' => $data['company_bank_account_id'] ?? null,
                'advance_account_id' => $advanceAccount->id,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'amount' => $amount,
                'spent_amount' => 0,
                'returned_amount' => 0,
                'reimbursed_amount' => 0,
                'status' => CashAdvance::STATUS_DRAFT,
                'reference_number' => $data['reference_number'] ?? null,
                'notes' => $data['notes'] ?? null,
                'source_type' => $data['source_type'] ?? null,
                'source_id' => $data['source_id'] ?? null,
                'created_by' => $actorId,
            ]);

            if (! empty($data['disburse_immediately'])) {
                return $this->disburse($advance, $actorId);
            }

            return $advance->fresh(['companyBankAccount', 'advanceAccount']);
        });
    }

    public function disburse(CashAdvance $advance, ?int $userId = null): CashAdvance
    {
        if ($advance->isDisbursed() || $advance->isSettled()) {
            return $advance;
        }

        if ($advance->isVoided()) {
            throw ValidationException::withMessages([
                'advance' => 'Kasbon yang sudah dibatalkan (void) tidak dapat dicairkan.',
            ]);
        }

        $actorId = $userId ?? Auth::id();

        return DB::transaction(function () use ($advance, $actorId): CashAdvance {
            $advanceAccount = $this->resolveAdvanceAccount($advance->advance_account_id);
            $bankAccount = $this->accountResolver->resolveCompanyAccount(
                method: $advance->payment_method,
                companyBankAccountId: $advance->company_bank_account_id,
            );
            $cashLedgerAccount = $this->resolveCashLedgerAccount($advance->payment_method, $bankAccount);
            $amount = round((float) $advance->amount, 2);

            $entry = $this->journals->createDraft([
                'entry_date' => $advance->advance_date->toDateString(),
                'type' => JournalEntry::TYPE_AUTO,
                'memo' => "Pencairan Kasbon {$advance->code}: {$advance->purpose}",
                'lines' => [
                    [
                        'account_id' => $advanceAccount->id,
                        'debit' => $amount,
                        'credit' => 0,
                        'partner_id' => $advance->partner_id,
                        'memo' => "Uang muka kerja {$advance->code}",
                    ],
                    [
                        'account_id' => $cashLedgerAccount->id,
                        'debit' => 0,
                        'credit' => $amount,
                        'partner_id' => $advance->partner_id,
                        'memo' => "Pencairan kasbon {$advance->code}",
                    ],
                ],
            ], $actorId);

            $entry->update([
                'source_type' => $advance->getMorphClass(),
                'source_id' => (int) $advance->id,
                'event' => 'cash_advance.disbursed',
            ]);

            $this->journals->post($entry, $actorId);

            $this->bankBook->recordOutboundFromSource(
                source: $advance,
                amount: $amount,
                date: $advance->advance_date->toDateString(),
                method: $advance->payment_method,
                companyBankAccountId: $bankAccount?->id ?? $advance->company_bank_account_id,
                reference: $advance->code,
                memo: "Pencairan Kasbon: {$advance->purpose}",
                eventKey: 'cash_advance.disbursed',
            );

            $advance->update([
                'company_bank_account_id' => $bankAccount?->id ?? $advance->company_bank_account_id,
                'advance_account_id' => $advanceAccount->id,
                'status' => CashAdvance::STATUS_DISBURSED,
                'disbursed_at' => now(),
                'disbursed_by' => $actorId,
            ]);

            return $advance->fresh(['companyBankAccount', 'advanceAccount']);
        });
    }

    /**
     * Settle a disbursed cash advance against actual expense lines (LPJ Kasbon).
     *
     * @param  array{
     *     settlement_date?: string|null,
     *     payment_method?: string|null,
     *     company_bank_account_id?: int|null,
     *     notes?: string|null,
     *     lines: list<array{expense_category_id?: int|null, account_id?: int|null, vehicle_id?: int|null, description: string, amount: float|int|string, receipt_number?: string|null}>
     * }  $data
     */
    public function settle(CashAdvance $advance, array $data, ?int $userId = null): CashAdvance
    {
        if (! $advance->isDisbursed()) {
            throw ValidationException::withMessages([
                'advance' => 'Hanya kasbon berstatus Disbursed (Cair) yang dapat dipertanggungjawabkan.',
            ]);
        }

        $rawLines = $data['lines'] ?? [];
        if (! is_array($rawLines) || $rawLines === []) {
            throw ValidationException::withMessages([
                'lines' => 'Minimal satu baris realisasi biaya wajib diisi untuk pertanggungjawaban kasbon.',
            ]);
        }

        $actorId = $userId ?? Auth::id();
        $settlementDate = ! empty($data['settlement_date']) ? (string) $data['settlement_date'] : now()->toDateString();
        $method = ! empty($data['payment_method']) ? (string) $data['payment_method'] : $advance->payment_method;
        $bankAccountId = ! empty($data['company_bank_account_id'])
            ? (int) $data['company_bank_account_id']
            : $advance->company_bank_account_id;

        return DB::transaction(function () use ($advance, $rawLines, $settlementDate, $method, $bankAccountId, $data, $actorId): CashAdvance {
            $advanceAccount = $this->resolveAdvanceAccount($advance->advance_account_id);
            $bankAccount = $this->accountResolver->resolveCompanyAccount($method, $bankAccountId);
            $cashLedgerAccount = $this->resolveCashLedgerAccount($method, $bankAccount);

            $normalizedLines = [];
            $spentAmount = 0.0;

            foreach (array_values($rawLines) as $index => $line) {
                $lineAmount = round((float) ($line['amount'] ?? 0), 2);
                if ($lineAmount < 0) {
                    throw ValidationException::withMessages([
                        "lines.{$index}.amount" => 'Nominal realisasi tidak boleh negatif.',
                    ]);
                }

                if ($lineAmount < 0.005) {
                    continue;
                }

                $categoryId = ! empty($line['expense_category_id']) ? (int) $line['expense_category_id'] : null;
                $accountId = ! empty($line['account_id']) ? (int) $line['account_id'] : null;

                if ($accountId === null && $categoryId !== null) {
                    $category = ExpenseCategory::query()->find($categoryId);
                    $accountId = $category?->account_id;
                }

                if ($accountId === null) {
                    $accountId = (int) Account::query()
                        ->where('system_role', 'opex')
                        ->where('is_active', true)
                        ->where('is_postable', true)
                        ->value('id');
                }

                $normalizedLines[] = [
                    'expense_category_id' => $categoryId,
                    'account_id' => $accountId,
                    'vehicle_id' => ! empty($line['vehicle_id']) ? (int) $line['vehicle_id'] : $advance->vehicle_id,
                    'description' => (string) ($line['description'] ?? $advance->purpose),
                    'amount' => $lineAmount,
                    'receipt_number' => $line['receipt_number'] ?? null,
                    'sort_order' => $index + 1,
                ];

                $spentAmount += $lineAmount;
            }

            $spentAmount = round($spentAmount, 2);
            $advanceAmount = round((float) $advance->amount, 2);

            $returnedAmount = $spentAmount < $advanceAmount ? round($advanceAmount - $spentAmount, 2) : 0.0;
            $reimbursedAmount = $spentAmount > $advanceAmount ? round($spentAmount - $advanceAmount, 2) : 0.0;

            $claim = ExpenseClaim::query()->create([
                'code' => ExpenseClaim::nextCode(),
                'expense_date' => $settlementDate,
                'type' => ExpenseClaim::TYPE_ADVANCE_SETTLEMENT,
                'title' => "LPJ Kasbon {$advance->code}: {$advance->purpose}",
                'cash_advance_id' => $advance->id,
                'company_bank_account_id' => $bankAccount?->id ?? $bankAccountId,
                'partner_id' => $advance->partner_id,
                'vehicle_id' => $advance->vehicle_id,
                'driver_id' => $advance->driver_id,
                'payment_method' => $method,
                'total_amount' => $spentAmount,
                'status' => ExpenseClaim::STATUS_POSTED,
                'reference_number' => $advance->code,
                'notes' => $data['notes'] ?? $advance->notes,
                'source_type' => $advance->getMorphClass(),
                'source_id' => (int) $advance->id,
                'posted_at' => now(),
                'posted_by' => $actorId,
                'created_by' => $actorId,
            ]);

            foreach ($normalizedLines as $lineRow) {
                ExpenseClaimLine::query()->create([
                    'expense_claim_id' => $claim->id,
                    ...$lineRow,
                ]);
            }

            $journalLines = [];

            foreach ($normalizedLines as $lineRow) {
                $journalLines[] = [
                    'account_id' => (int) $lineRow['account_id'],
                    'debit' => $lineRow['amount'],
                    'credit' => 0,
                    'partner_id' => $advance->partner_id,
                    'memo' => $lineRow['description'],
                ];
            }

            if ($returnedAmount >= 0.005) {
                $journalLines[] = [
                    'account_id' => $cashLedgerAccount->id,
                    'debit' => $returnedAmount,
                    'credit' => 0,
                    'partner_id' => $advance->partner_id,
                    'memo' => "Pengembalian sisa kasbon {$advance->code}",
                ];
            }

            $journalLines[] = [
                'account_id' => $advanceAccount->id,
                'debit' => 0,
                'credit' => $advanceAmount,
                'partner_id' => $advance->partner_id,
                'memo' => "Penyelesaian uang muka {$advance->code}",
            ];

            if ($reimbursedAmount >= 0.005) {
                $journalLines[] = [
                    'account_id' => $cashLedgerAccount->id,
                    'debit' => 0,
                    'credit' => $reimbursedAmount,
                    'partner_id' => $advance->partner_id,
                    'memo' => "Reimbursement kurang bayar kasbon {$advance->code}",
                ];
            }

            $entry = $this->journals->createDraft([
                'entry_date' => $settlementDate,
                'type' => JournalEntry::TYPE_AUTO,
                'memo' => "Pertanggungjawaban Kasbon {$advance->code}: {$advance->purpose}",
                'lines' => $journalLines,
            ], $actorId);

            $entry->update([
                'source_type' => $advance->getMorphClass(),
                'source_id' => (int) $advance->id,
                'event' => 'cash_advance.settled',
            ]);

            $this->journals->post($entry, $actorId);

            if ($returnedAmount >= 0.005) {
                $this->bankBook->recordInboundFromSource(
                    source: $claim,
                    amount: $returnedAmount,
                    date: $settlementDate,
                    method: $method,
                    companyBankAccountId: $bankAccount?->id ?? $bankAccountId,
                    reference: $advance->code,
                    memo: "Pengembalian sisa kasbon {$advance->code}",
                    eventKey: 'cash_advance.returned',
                );
            }

            if ($reimbursedAmount >= 0.005) {
                $this->bankBook->recordOutboundFromSource(
                    source: $claim,
                    amount: $reimbursedAmount,
                    date: $settlementDate,
                    method: $method,
                    companyBankAccountId: $bankAccount?->id ?? $bankAccountId,
                    reference: $advance->code,
                    memo: "Reimbursement kurang bayar kasbon {$advance->code}",
                    eventKey: 'cash_advance.reimbursed',
                );
            }

            $advance->update([
                'spent_amount' => $spentAmount,
                'returned_amount' => $returnedAmount,
                'reimbursed_amount' => $reimbursedAmount,
                'status' => CashAdvance::STATUS_SETTLED,
                'settled_at' => now(),
                'settled_by' => $actorId,
            ]);

            return $advance->fresh(['expenseClaims.lines.category', 'expenseClaims.lines.account', 'companyBankAccount', 'advanceAccount']);
        });
    }

    public function void(CashAdvance $advance): CashAdvance
    {
        if ($advance->isVoided()) {
            return $advance;
        }

        if ($advance->isSettled()) {
            throw ValidationException::withMessages([
                'advance' => 'Kasbon yang sudah selesai dipertanggungjawabkan (settled) tidak dapat dibatalkan.',
            ]);
        }

        return DB::transaction(function () use ($advance): CashAdvance {
            if ($advance->isDisbursed()) {
                $this->poster->reverse(
                    sourceType: $advance->getMorphClass(),
                    sourceId: (int) $advance->id,
                    originalEvent: 'cash_advance.disbursed',
                    voidEvent: 'cash_advance.voided',
                    occurredAt: now()->toDateString(),
                    memo: "Pembatalan kasbon {$advance->code}",
                );

                $this->bankBook->voidForSource($advance);
            }

            $advance->update([
                'status' => CashAdvance::STATUS_VOIDED,
                'voided_at' => now(),
            ]);

            return $advance->fresh();
        });
    }

    private function resolveAdvanceAccount(?int $advanceAccountId): Account
    {
        if ($advanceAccountId !== null) {
            $explicit = Account::query()
                ->whereKey($advanceAccountId)
                ->where('is_active', true)
                ->where('is_postable', true)
                ->first();
            if ($explicit !== null) {
                return $explicit;
            }
        }

        $account = Account::query()
            ->where('system_role', 'cash_advance')
            ->where('is_active', true)
            ->where('is_postable', true)
            ->orderBy('code')
            ->first();

        if ($account === null) {
            ExpenseSchemaInitializer::ensureSeeded();
            $account = Account::query()
                ->where('system_role', 'cash_advance')
                ->where('is_active', true)
                ->where('is_postable', true)
                ->orderBy('code')
                ->first();
        }

        if ($account === null) {
            throw ValidationException::withMessages([
                'advance_account_id' => 'Akun Uang Muka Kerja & Kasbon (1150) tidak ditemukan pada COA.',
            ]);
        }

        return $account;
    }

    private function resolveCashLedgerAccount(string $method, ?CompanyBankAccount $bankAccount): Account
    {
        if ($bankAccount !== null) {
            $bankAccount->loadMissing('ledgerAccount');
            if ($bankAccount->ledgerAccount !== null && $bankAccount->ledgerAccount->is_active && $bankAccount->ledgerAccount->is_postable) {
                return $bankAccount->ledgerAccount;
            }
        }

        $fallbackRole = $method === 'cash' ? 'cash' : 'bank';

        $account = Account::query()
            ->where('system_role', $fallbackRole)
            ->where('is_active', true)
            ->where('is_postable', true)
            ->orderBy('code')
            ->first();

        if ($account === null) {
            throw ValidationException::withMessages([
                'company_bank_account_id' => 'Akun Kas/Bank pada COA tidak ditemukan.',
            ]);
        }

        return $account;
    }
}
