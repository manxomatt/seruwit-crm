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
use Modules\Expenses\Models\ExpenseCategory;
use Modules\Expenses\Models\ExpenseClaim;
use Modules\Expenses\Models\ExpenseClaimLine;

class ExpenseService
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
    public function create(array $data, ?int $userId = null): ExpenseClaim
    {
        ExpenseSchemaInitializer::ensureReady();

        $actorId = $userId ?? Auth::id();
        $rawLines = $data['lines'] ?? [];

        if (! is_array($rawLines) || $rawLines === []) {
            throw ValidationException::withMessages([
                'lines' => 'Minimal satu baris rincian pengeluaran wajib diisi.',
            ]);
        }

        return DB::transaction(function () use ($data, $rawLines, $actorId): ExpenseClaim {
            $normalizedLines = [];
            $totalAmount = 0.0;

            foreach (array_values($rawLines) as $index => $line) {
                $amount = round((float) ($line['amount'] ?? 0), 2);
                if ($amount <= 0) {
                    throw ValidationException::withMessages([
                        "lines.{$index}.amount" => 'Nominal pengeluaran harus lebih besar dari 0.',
                    ]);
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

                if (! $accountId) {
                    throw ValidationException::withMessages([
                        "lines.{$index}.account_id" => 'Akun beban (COA) tidak valid.',
                    ]);
                }

                $normalizedLines[] = [
                    'expense_category_id' => $categoryId,
                    'account_id' => $accountId,
                    'vehicle_id' => ! empty($line['vehicle_id']) ? (int) $line['vehicle_id'] : (! empty($data['vehicle_id']) ? (int) $data['vehicle_id'] : null),
                    'description' => (string) ($line['description'] ?? $data['title']),
                    'amount' => $amount,
                    'receipt_number' => $line['receipt_number'] ?? null,
                    'sort_order' => $index + 1,
                ];

                $totalAmount += $amount;
            }

            $claim = ExpenseClaim::query()->create([
                'code' => ! empty($data['code']) ? (string) $data['code'] : ExpenseClaim::nextCode(),
                'expense_date' => $data['expense_date'],
                'type' => $data['type'] ?? ExpenseClaim::TYPE_DIRECT,
                'title' => (string) $data['title'],
                'cash_advance_id' => $data['cash_advance_id'] ?? null,
                'company_bank_account_id' => $data['company_bank_account_id'] ?? null,
                'partner_id' => $data['partner_id'] ?? null,
                'vehicle_id' => $data['vehicle_id'] ?? null,
                'driver_id' => $data['driver_id'] ?? null,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'total_amount' => round($totalAmount, 2),
                'status' => ExpenseClaim::STATUS_DRAFT,
                'reference_number' => $data['reference_number'] ?? null,
                'notes' => $data['notes'] ?? null,
                'source_type' => $data['source_type'] ?? null,
                'source_id' => $data['source_id'] ?? null,
                'created_by' => $actorId,
            ]);

            foreach ($normalizedLines as $lineRow) {
                ExpenseClaimLine::query()->create([
                    'expense_claim_id' => $claim->id,
                    ...$lineRow,
                ]);
            }

            if (! empty($data['post_immediately'])) {
                return $this->post($claim->fresh(['lines']), $actorId);
            }

            return $claim->fresh(['lines.category', 'lines.account']);
        });
    }

    public function post(ExpenseClaim $claim, ?int $userId = null): ExpenseClaim
    {
        if ($claim->isPosted()) {
            return $claim;
        }

        if ($claim->isVoided()) {
            throw ValidationException::withMessages([
                'expense' => 'Pengeluaran yang sudah dibatalkan (void) tidak dapat diposting.',
            ]);
        }

        $actorId = $userId ?? Auth::id();
        $claim->loadMissing('lines');

        if ($claim->lines->isEmpty()) {
            throw ValidationException::withMessages([
                'lines' => 'Pengeluaran tidak memiliki rincian baris biaya.',
            ]);
        }

        return DB::transaction(function () use ($claim, $actorId): ExpenseClaim {
            $bankAccount = $this->resolveBankAccount($claim->payment_method, $claim->company_bank_account_id);
            $cashLedgerAccount = $this->resolveCashLedgerAccount($claim->payment_method, $bankAccount);

            $totalCredit = round((float) $claim->lines->sum('amount'), 2);
            $journalLines = [];

            foreach ($claim->lines as $line) {
                $journalLines[] = [
                    'account_id' => (int) $line->account_id,
                    'debit' => round((float) $line->amount, 2),
                    'credit' => 0,
                    'partner_id' => $claim->partner_id,
                    'memo' => $line->description,
                ];
            }

            $journalLines[] = [
                'account_id' => $cashLedgerAccount->id,
                'debit' => 0,
                'credit' => $totalCredit,
                'partner_id' => $claim->partner_id,
                'memo' => "Pembayaran {$claim->code} - {$claim->title}",
            ];

            $entry = $this->journals->createDraft([
                'entry_date' => $claim->expense_date->toDateString(),
                'type' => JournalEntry::TYPE_AUTO,
                'memo' => "Pengeluaran Operasional {$claim->code}: {$claim->title}",
                'lines' => $journalLines,
            ], $actorId);

            $entry->update([
                'source_type' => $claim->getMorphClass(),
                'source_id' => (int) $claim->id,
                'event' => 'expense.posted',
            ]);

            $this->journals->post($entry, $actorId);

            $this->bankBook->recordOutboundFromSource(
                source: $claim,
                amount: $totalCredit,
                date: $claim->expense_date->toDateString(),
                method: $claim->payment_method,
                companyBankAccountId: $bankAccount?->id ?? $claim->company_bank_account_id,
                reference: $claim->code,
                memo: $claim->title,
                eventKey: 'expense.posted',
            );

            $claim->update([
                'company_bank_account_id' => $bankAccount?->id ?? $claim->company_bank_account_id,
                'total_amount' => $totalCredit,
                'status' => ExpenseClaim::STATUS_POSTED,
                'posted_at' => now(),
                'posted_by' => $actorId,
            ]);

            return $claim->fresh(['lines.category', 'lines.account', 'companyBankAccount']);
        });
    }

    public function void(ExpenseClaim $claim): ExpenseClaim
    {
        if ($claim->isVoided()) {
            return $claim;
        }

        return DB::transaction(function () use ($claim): ExpenseClaim {
            if ($claim->isPosted()) {
                $this->poster->reverse(
                    sourceType: $claim->getMorphClass(),
                    sourceId: (int) $claim->id,
                    originalEvent: 'expense.posted',
                    voidEvent: 'expense.voided',
                    occurredAt: now()->toDateString(),
                    memo: "Pembatalan pengeluaran {$claim->code}",
                );

                $this->bankBook->voidForSource($claim);
            }

            $claim->update([
                'status' => ExpenseClaim::STATUS_VOIDED,
                'voided_at' => now(),
            ]);

            return $claim->fresh();
        });
    }

    private function resolveBankAccount(string $method, ?int $companyBankAccountId): ?CompanyBankAccount
    {
        return $this->accountResolver->resolveCompanyAccount(
            method: $method,
            companyBankAccountId: $companyBankAccountId,
        );
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
                'company_bank_account_id' => 'Akun Kas/Bank pada COA tidak ditemukan atau tidak aktif.',
            ]);
        }

        return $account;
    }
}
