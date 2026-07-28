<?php

namespace Modules\Accounting\Support;

use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\BankReconciliation;
use Modules\Accounting\Models\BankStatementLine;
use Modules\Accounting\Models\BankTransaction;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Models\JournalEntry;

class BankReconciliationService
{
    public function __construct(private readonly JournalService $journals) {}

    public static function isReady(): bool
    {
        return Schema::hasTable('bank_reconciliations')
            && Schema::hasTable('bank_statement_lines')
            && Schema::hasTable('bank_transactions');
    }

    /**
     * @param  array{
     *     company_bank_account_id: int,
     *     period_start: string,
     *     period_end: string,
     *     statement_date?: string|null,
     *     opening_balance?: float|int|string,
     *     closing_balance?: float|int|string,
     *     notes?: string|null
     * }  $data
     */
    public function create(array $data): BankReconciliation
    {
        if (! self::isReady()) {
            throw ValidationException::withMessages([
                'accounting' => __('accounting.validation.bank_recon_unavailable'),
            ]);
        }

        $account = CompanyBankAccount::query()
            ->whereKey((int) $data['company_bank_account_id'])
            ->where('is_active', true)
            ->first();

        if ($account === null) {
            throw ValidationException::withMessages([
                'company_bank_account_id' => __('accounting.validation.bank_account_inactive'),
            ]);
        }

        $start = Carbon::parse($data['period_start'])->toDateString();
        $end = Carbon::parse($data['period_end'])->toDateString();
        if ($end < $start) {
            throw ValidationException::withMessages([
                'period_end' => __('accounting.validation.bank_recon_period'),
            ]);
        }

        return BankReconciliation::query()->create([
            'company_bank_account_id' => $account->id,
            'period_start' => $start,
            'period_end' => $end,
            'statement_date' => $data['statement_date'] ?? $end,
            'opening_balance' => round((float) ($data['opening_balance'] ?? 0), 2),
            'closing_balance' => round((float) ($data['closing_balance'] ?? 0), 2),
            'status' => BankReconciliation::STATUS_OPEN,
            'notes' => $data['notes'] ?? null,
            'created_by' => Auth::id(),
        ]);
    }

    public function importCsv(BankReconciliation $reconciliation, UploadedFile $file): int
    {
        $this->assertOpen($reconciliation);

        $path = $file->getRealPath();
        if ($path === false) {
            throw ValidationException::withMessages([
                'csv' => __('accounting.validation.bank_csv_unreadable'),
            ]);
        }

        $handle = fopen($path, 'r');
        if ($handle === false) {
            throw ValidationException::withMessages([
                'csv' => __('accounting.validation.bank_csv_unreadable'),
            ]);
        }

        try {
            $headerRow = fgetcsv($handle);
            if ($headerRow === false || $headerRow === [null] || $headerRow === []) {
                throw ValidationException::withMessages([
                    'csv' => __('accounting.validation.bank_csv_empty'),
                ]);
            }

            $map = $this->mapHeaders($headerRow);
            if (! isset($map['date'], $map['amount'])) {
                throw ValidationException::withMessages([
                    'csv' => __('accounting.validation.bank_csv_headers'),
                ]);
            }

            $rows = [];
            $rowNumber = 1;
            while (($cells = fgetcsv($handle)) !== false) {
                $rowNumber++;
                if ($this->rowIsBlank($cells)) {
                    continue;
                }

                $parsed = $this->parseRow($cells, $map, $rowNumber);
                if ($parsed !== null) {
                    $rows[] = $parsed;
                }
            }
        } finally {
            fclose($handle);
        }

        if ($rows === []) {
            throw ValidationException::withMessages([
                'csv' => __('accounting.validation.bank_csv_empty'),
            ]);
        }

        return DB::transaction(function () use ($reconciliation, $rows, $file): int {
            $reconciliation->lines()->delete();

            foreach ($rows as $row) {
                BankStatementLine::query()->create([
                    ...$row,
                    'bank_reconciliation_id' => $reconciliation->id,
                    'match_status' => BankStatementLine::MATCH_UNMATCHED,
                ]);
            }

            $reconciliation->update([
                'csv_filename' => $file->getClientOriginalName(),
            ]);

            return count($rows);
        });
    }

    public function match(BankReconciliation $reconciliation, BankStatementLine $line, BankTransaction $transaction): void
    {
        $this->assertOpen($reconciliation);
        $this->assertLineBelongs($reconciliation, $line);

        if (! $line->isUnmatched()) {
            throw ValidationException::withMessages([
                'line' => __('accounting.validation.bank_line_not_unmatched'),
            ]);
        }

        if ((int) $transaction->company_bank_account_id !== (int) $reconciliation->company_bank_account_id) {
            throw ValidationException::withMessages([
                'bank_transaction_id' => __('accounting.validation.bank_match_account'),
            ]);
        }

        if ($transaction->status !== BankTransaction::STATUS_POSTED) {
            throw ValidationException::withMessages([
                'bank_transaction_id' => __('accounting.validation.bank_match_transaction'),
            ]);
        }

        if ($transaction->direction !== $line->direction
            || abs((float) $transaction->amount - (float) $line->amount) >= 0.005) {
            throw ValidationException::withMessages([
                'bank_transaction_id' => __('accounting.validation.bank_match_amount'),
            ]);
        }

        $alreadyMatched = BankStatementLine::query()
            ->where('bank_transaction_id', $transaction->id)
            ->where('match_status', BankStatementLine::MATCH_MATCHED)
            ->where('id', '!=', $line->id)
            ->exists();

        if ($alreadyMatched) {
            throw ValidationException::withMessages([
                'bank_transaction_id' => __('accounting.validation.bank_match_used'),
            ]);
        }

        DB::transaction(function () use ($line, $transaction): void {
            $line->update([
                'match_status' => BankStatementLine::MATCH_MATCHED,
                'bank_transaction_id' => $transaction->id,
            ]);

            $transaction->update([
                'is_cleared' => true,
                'cleared_on' => $line->line_date?->toDateString() ?? now()->toDateString(),
            ]);
        });
    }

    public function unmatch(BankReconciliation $reconciliation, BankStatementLine $line): void
    {
        $this->assertOpen($reconciliation);
        $this->assertLineBelongs($reconciliation, $line);

        if (! in_array($line->match_status, [BankStatementLine::MATCH_MATCHED, BankStatementLine::MATCH_ADJUSTED], true)) {
            throw ValidationException::withMessages([
                'line' => __('accounting.validation.bank_line_not_matched'),
            ]);
        }

        if ($line->match_status === BankStatementLine::MATCH_ADJUSTED) {
            throw ValidationException::withMessages([
                'line' => __('accounting.validation.bank_line_adjusted_locked'),
            ]);
        }

        DB::transaction(function () use ($line): void {
            $txnId = $line->bank_transaction_id;
            $line->update([
                'match_status' => BankStatementLine::MATCH_UNMATCHED,
                'bank_transaction_id' => null,
            ]);

            if ($txnId) {
                $stillMatched = BankStatementLine::query()
                    ->where('bank_transaction_id', $txnId)
                    ->whereIn('match_status', [BankStatementLine::MATCH_MATCHED, BankStatementLine::MATCH_ADJUSTED])
                    ->exists();

                if (! $stillMatched) {
                    BankTransaction::query()->whereKey($txnId)->update([
                        'is_cleared' => false,
                        'cleared_on' => null,
                    ]);
                }
            }
        });
    }

    public function ignore(BankReconciliation $reconciliation, BankStatementLine $line): void
    {
        $this->assertOpen($reconciliation);
        $this->assertLineBelongs($reconciliation, $line);

        if (! $line->isUnmatched()) {
            throw ValidationException::withMessages([
                'line' => __('accounting.validation.bank_line_not_unmatched'),
            ]);
        }

        $line->update(['match_status' => BankStatementLine::MATCH_IGNORED]);
    }

    public function unignore(BankReconciliation $reconciliation, BankStatementLine $line): void
    {
        $this->assertOpen($reconciliation);
        $this->assertLineBelongs($reconciliation, $line);

        if ($line->match_status !== BankStatementLine::MATCH_IGNORED) {
            throw ValidationException::withMessages([
                'line' => __('accounting.validation.bank_line_not_ignored'),
            ]);
        }

        $line->update(['match_status' => BankStatementLine::MATCH_UNMATCHED]);
    }

    /**
     * Create book transaction + GL for a statement line that has no matching book entry.
     */
    public function adjust(BankReconciliation $reconciliation, BankStatementLine $line): BankStatementLine
    {
        $this->assertOpen($reconciliation);
        $this->assertLineBelongs($reconciliation, $line);

        if (! $line->isUnmatched()) {
            throw ValidationException::withMessages([
                'line' => __('accounting.validation.bank_line_not_unmatched'),
            ]);
        }

        $account = $reconciliation->companyBankAccount()->with('ledgerAccount')->first();
        $ledger = $account?->ledgerAccount;
        if ($ledger === null || ! $ledger->is_active || ! $ledger->is_postable) {
            throw ValidationException::withMessages([
                'line' => __('accounting.validation.bank_account_coa_invalid'),
            ]);
        }

        $contra = Account::query()
            ->where('system_role', 'cash_variance')
            ->where('is_active', true)
            ->where('is_postable', true)
            ->orderBy('code')
            ->first();

        if ($contra === null) {
            throw ValidationException::withMessages([
                'line' => __('accounting.validation.account_role_missing', ['role' => 'cash_variance']),
            ]);
        }

        $amount = round((float) $line->amount, 2);
        $date = $line->line_date?->toDateString() ?? now()->toDateString();
        $isIn = $line->direction === BankTransaction::DIRECTION_IN;

        return DB::transaction(function () use ($reconciliation, $line, $ledger, $contra, $amount, $date, $isIn): BankStatementLine {
            $txn = BankTransaction::query()->create([
                'company_bank_account_id' => $reconciliation->company_bank_account_id,
                'type' => $isIn ? BankTransaction::TYPE_DEPOSIT : BankTransaction::TYPE_FEE,
                'direction' => $line->direction,
                'transacted_on' => $date,
                'amount' => $amount,
                'reference' => $line->reference,
                'memo' => $line->description ?: __('accounting.messages.bank_recon_adjustment'),
                'status' => BankTransaction::STATUS_POSTED,
                'is_cleared' => true,
                'cleared_on' => $date,
                'created_by' => Auth::id(),
            ]);

            $lines = $isIn
                ? [
                    ['account_id' => $ledger->id, 'debit' => $amount, 'credit' => 0, 'memo' => $line->description],
                    ['account_id' => $contra->id, 'debit' => 0, 'credit' => $amount, 'memo' => $line->description],
                ]
                : [
                    ['account_id' => $contra->id, 'debit' => $amount, 'credit' => 0, 'memo' => $line->description],
                    ['account_id' => $ledger->id, 'debit' => 0, 'credit' => $amount, 'memo' => $line->description],
                ];

            $entry = $this->journals->createDraft([
                'entry_date' => $date,
                'type' => JournalEntry::TYPE_AUTO,
                'memo' => __('accounting.messages.bank_recon_adjustment_memo', [
                    'id' => (string) $reconciliation->id,
                    'line' => (string) $line->id,
                ]),
                'lines' => $lines,
            ], Auth::id());

            $entry->update([
                'source_type' => $line->getMorphClass(),
                'source_id' => $line->id,
                'event' => 'bank_recon.adjusted',
            ]);

            $entry = $this->journals->post($entry, Auth::id());

            $txn->update([
                'source_type' => $entry->getMorphClass(),
                'source_id' => $entry->id,
            ]);

            $line->update([
                'match_status' => BankStatementLine::MATCH_ADJUSTED,
                'bank_transaction_id' => $txn->id,
                'journal_entry_id' => $entry->id,
            ]);

            return $line->fresh(['bankTransaction', 'journalEntry']);
        });
    }

    public function complete(BankReconciliation $reconciliation): BankReconciliation
    {
        $this->assertOpen($reconciliation);

        $pending = $reconciliation->lines()
            ->where('match_status', BankStatementLine::MATCH_UNMATCHED)
            ->count();

        if ($pending > 0) {
            throw ValidationException::withMessages([
                'reconciliation' => __('accounting.validation.bank_recon_incomplete', ['count' => $pending]),
            ]);
        }

        if ($reconciliation->lines()->count() === 0) {
            throw ValidationException::withMessages([
                'reconciliation' => __('accounting.validation.bank_recon_no_lines'),
            ]);
        }

        $reconciliation->update([
            'status' => BankReconciliation::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        return $reconciliation->fresh();
    }

    public function delete(BankReconciliation $reconciliation): void
    {
        $this->assertOpen($reconciliation);

        if ($reconciliation->lines()->whereIn('match_status', [
            BankStatementLine::MATCH_MATCHED,
            BankStatementLine::MATCH_ADJUSTED,
        ])->exists()) {
            throw ValidationException::withMessages([
                'reconciliation' => __('accounting.validation.bank_recon_has_matches'),
            ]);
        }

        $reconciliation->delete();
    }

    /**
     * Suggest book transactions for unmatched statement lines (same amount/direction, date ±3 days).
     *
     * @return array<int, list<array{id: int, transacted_on: string, amount: float, direction: string, reference: string|null, memo: string|null, type: string}>>
     */
    public function suggestions(BankReconciliation $reconciliation): array
    {
        $lines = $reconciliation->lines()
            ->where('match_status', BankStatementLine::MATCH_UNMATCHED)
            ->get();

        $usedTxnIds = BankStatementLine::query()
            ->whereNotNull('bank_transaction_id')
            ->whereIn('match_status', [BankStatementLine::MATCH_MATCHED, BankStatementLine::MATCH_ADJUSTED])
            ->pluck('bank_transaction_id')
            ->all();

        $candidates = BankTransaction::query()
            ->where('company_bank_account_id', $reconciliation->company_bank_account_id)
            ->where('status', BankTransaction::STATUS_POSTED)
            ->whereBetween('transacted_on', [
                Carbon::parse($reconciliation->period_start)->subDays(3)->toDateString(),
                Carbon::parse($reconciliation->period_end)->addDays(3)->toDateString(),
            ])
            ->when($usedTxnIds !== [], fn ($q) => $q->whereNotIn('id', $usedTxnIds))
            ->orderBy('transacted_on')
            ->get();

        $map = [];
        foreach ($lines as $line) {
            $lineDate = Carbon::parse($line->line_date);
            $matches = $candidates->filter(function (BankTransaction $txn) use ($line, $lineDate): bool {
                if ($txn->direction !== $line->direction) {
                    return false;
                }
                if (abs((float) $txn->amount - (float) $line->amount) >= 0.005) {
                    return false;
                }

                return abs($lineDate->diffInDays(Carbon::parse($txn->transacted_on))) <= 3;
            })->take(5)->map(fn (BankTransaction $txn): array => [
                'id' => $txn->id,
                'transacted_on' => $txn->transacted_on?->toDateString() ?? '',
                'amount' => (float) $txn->amount,
                'direction' => $txn->direction,
                'reference' => $txn->reference,
                'memo' => $txn->memo,
                'type' => $txn->type,
            ])->values()->all();

            $map[$line->id] = $matches;
        }

        return $map;
    }

    /**
     * @return list<array{id: int, transacted_on: string, amount: float, direction: string, reference: string|null, memo: string|null, type: string, is_cleared: bool}>
     */
    public function unmatchedBookTransactions(BankReconciliation $reconciliation): array
    {
        $usedTxnIds = BankStatementLine::query()
            ->where('bank_reconciliation_id', $reconciliation->id)
            ->whereNotNull('bank_transaction_id')
            ->pluck('bank_transaction_id')
            ->all();

        return BankTransaction::query()
            ->where('company_bank_account_id', $reconciliation->company_bank_account_id)
            ->where('status', BankTransaction::STATUS_POSTED)
            ->whereBetween('transacted_on', [
                $reconciliation->period_start->toDateString(),
                $reconciliation->period_end->toDateString(),
            ])
            ->when($usedTxnIds !== [], fn ($q) => $q->whereNotIn('id', $usedTxnIds))
            ->orderBy('transacted_on')
            ->orderBy('id')
            ->get()
            ->map(fn (BankTransaction $txn): array => [
                'id' => $txn->id,
                'transacted_on' => $txn->transacted_on?->toDateString() ?? '',
                'amount' => (float) $txn->amount,
                'direction' => $txn->direction,
                'reference' => $txn->reference,
                'memo' => $txn->memo,
                'type' => $txn->type,
                'is_cleared' => $txn->is_cleared,
            ])
            ->all();
    }

    private function assertOpen(BankReconciliation $reconciliation): void
    {
        if (! $reconciliation->isOpen()) {
            throw ValidationException::withMessages([
                'reconciliation' => __('accounting.validation.bank_recon_closed'),
            ]);
        }
    }

    private function assertLineBelongs(BankReconciliation $reconciliation, BankStatementLine $line): void
    {
        if ((int) $line->bank_reconciliation_id !== (int) $reconciliation->id) {
            abort(404);
        }
    }

    /**
     * @param  list<string|null>  $headerRow
     * @return array<string, int>
     */
    private function mapHeaders(array $headerRow): array
    {
        $aliases = [
            'date' => ['date', 'tanggal', 'txn_date', 'transaction_date', 'value_date'],
            'amount' => ['amount', 'jumlah', 'nominal', 'value'],
            'description' => ['description', 'desc', 'memo', 'keterangan', 'narration'],
            'reference' => ['reference', 'ref', 'referensi', 'check_number', 'no'],
            'direction' => ['direction', 'arah', 'type', 'jenis', 'debit_credit', 'dr_cr'],
        ];

        $map = [];
        foreach ($headerRow as $index => $raw) {
            $key = strtolower(trim((string) $raw));
            $key = str_replace([' ', '-'], '_', $key);
            foreach ($aliases as $canonical => $names) {
                if (in_array($key, $names, true) && ! isset($map[$canonical])) {
                    $map[$canonical] = $index;
                }
            }
        }

        return $map;
    }

    /**
     * @param  list<string|null>  $cells
     * @param  array<string, int>  $map
     * @return array{row_number: int, line_date: string, description: string|null, reference: string|null, direction: string, amount: float}|null
     */
    private function parseRow(array $cells, array $map, int $rowNumber): ?array
    {
        $rawDate = trim((string) ($cells[$map['date']] ?? ''));
        $rawAmount = trim((string) ($cells[$map['amount']] ?? ''));
        if ($rawDate === '' || $rawAmount === '') {
            return null;
        }

        try {
            $date = Carbon::parse($rawDate)->toDateString();
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                'csv' => __('accounting.validation.bank_csv_row_date', ['row' => $rowNumber]),
            ]);
        }

        $normalizedAmount = str_replace([',', ' '], ['', ''], $rawAmount);
        if (! is_numeric($normalizedAmount)) {
            throw ValidationException::withMessages([
                'csv' => __('accounting.validation.bank_csv_row_amount', ['row' => $rowNumber]),
            ]);
        }

        $signed = (float) $normalizedAmount;
        $directionCol = isset($map['direction']) ? strtolower(trim((string) ($cells[$map['direction']] ?? ''))) : '';

        if ($directionCol !== '') {
            $direction = $this->normalizeDirection($directionCol, $rowNumber);
            $amount = abs($signed);
        } else {
            if (abs($signed) < 0.005) {
                return null;
            }
            $direction = $signed >= 0 ? BankTransaction::DIRECTION_IN : BankTransaction::DIRECTION_OUT;
            $amount = abs($signed);
        }

        if ($amount < 0.005) {
            return null;
        }

        return [
            'row_number' => $rowNumber,
            'line_date' => $date,
            'description' => isset($map['description']) ? $this->nullableString($cells[$map['description']] ?? null) : null,
            'reference' => isset($map['reference']) ? $this->nullableString($cells[$map['reference']] ?? null) : null,
            'direction' => $direction,
            'amount' => round($amount, 2),
        ];
    }

    private function normalizeDirection(string $value, int $rowNumber): string
    {
        $value = strtolower($value);
        if (in_array($value, ['in', 'credit', 'cr', 'c', 'masuk', 'kredit', 'deposit'], true)) {
            return BankTransaction::DIRECTION_IN;
        }
        if (in_array($value, ['out', 'debit', 'dr', 'd', 'keluar', 'withdrawal', 'fee'], true)) {
            return BankTransaction::DIRECTION_OUT;
        }

        throw ValidationException::withMessages([
            'csv' => __('accounting.validation.bank_csv_row_direction', ['row' => $rowNumber]),
        ]);
    }

    private function nullableString(mixed $value): ?string
    {
        $text = trim((string) $value);

        return $text === '' ? null : $text;
    }

    /**
     * @param  list<string|null>  $cells
     */
    private function rowIsBlank(array $cells): bool
    {
        foreach ($cells as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }
}
