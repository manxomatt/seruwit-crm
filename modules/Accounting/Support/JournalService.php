<?php

namespace Modules\Accounting\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;

class JournalService
{
    public function __construct(private readonly FiscalCalendarService $calendar) {}

    /**
     * @param  array{
     *     entry_date: string,
     *     memo?: string|null,
     *     type?: string,
     *     allow_zero_amounts?: bool,
     *     lines: list<array{account_id: int, debit?: float|int|string, credit?: float|int|string, partner_id?: int|null, warehouse_id?: int|null, memo?: string|null}>
     * }  $data
     */
    public function createDraft(array $data, ?int $userId = null): JournalEntry
    {
        $this->assertLinesValid(
            $data['lines'],
            requireBalance: false,
            allowZeroAmounts: (bool) ($data['allow_zero_amounts'] ?? false),
        );

        $period = $this->calendar->periodForDate($data['entry_date']);

        return DB::transaction(function () use ($data, $period, $userId): JournalEntry {
            $entry = JournalEntry::query()->create([
                'number' => JournalEntry::nextNumber(),
                'fiscal_period_id' => $period->id,
                'entry_date' => $data['entry_date'],
                'type' => $data['type'] ?? JournalEntry::TYPE_MANUAL,
                'status' => JournalEntry::STATUS_DRAFT,
                'memo' => $data['memo'] ?? null,
                'created_by' => $userId,
            ]);

            $this->syncLines($entry, $data['lines']);

            return $entry->load(['lines.account', 'fiscalPeriod']);
        });
    }

    /**
     * @param  array{
     *     entry_date: string,
     *     memo?: string|null,
     *     lines: list<array{account_id: int, debit?: float|int|string, credit?: float|int|string, partner_id?: int|null, warehouse_id?: int|null, memo?: string|null}>
     * }  $data
     */
    public function updateDraft(JournalEntry $entry, array $data): JournalEntry
    {
        if (! $entry->isDraft()) {
            throw ValidationException::withMessages([
                'journal' => __('accounting.validation.journal_draft_only'),
            ]);
        }

        $this->assertLinesValid(
            $data['lines'],
            requireBalance: false,
            allowZeroAmounts: (bool) ($data['allow_zero_amounts'] ?? false),
        );
        $period = $this->calendar->periodForDate($data['entry_date']);

        return DB::transaction(function () use ($entry, $data, $period): JournalEntry {
            $entry->update([
                'fiscal_period_id' => $period->id,
                'entry_date' => $data['entry_date'],
                'memo' => $data['memo'] ?? null,
            ]);

            $entry->lines()->delete();
            $this->syncLines($entry, $data['lines']);

            return $entry->fresh(['lines.account', 'fiscalPeriod']);
        });
    }

    public function post(JournalEntry $entry, ?int $userId = null): JournalEntry
    {
        if (! $entry->isDraft()) {
            throw ValidationException::withMessages([
                'journal' => __('accounting.validation.journal_draft_only'),
            ]);
        }

        $entry->load(['lines.account', 'fiscalPeriod.fiscalYear']);

        if ($entry->lines->isEmpty()) {
            throw ValidationException::withMessages([
                'lines' => __('accounting.validation.lines_required'),
            ]);
        }

        if (! $entry->isBalanced()) {
            throw ValidationException::withMessages([
                'lines' => __('accounting.validation.journal_unbalanced'),
            ]);
        }

        if (! $entry->fiscalPeriod->allowsPosting()) {
            throw ValidationException::withMessages([
                'entry_date' => __('accounting.validation.period_hard_closed'),
            ]);
        }

        foreach ($entry->lines as $line) {
            $account = $line->account;
            if ($account === null || ! $account->is_active || ! $account->is_postable) {
                throw ValidationException::withMessages([
                    'lines' => __('accounting.validation.account_not_postable', [
                        'code' => $account?->code ?? (string) $line->account_id,
                    ]),
                ]);
            }
        }

        $entry->update([
            'status' => JournalEntry::STATUS_POSTED,
            'posted_at' => now(),
            'posted_by' => $userId,
        ]);

        return $entry->fresh(['lines.account', 'fiscalPeriod']);
    }

    public function deleteDraft(JournalEntry $entry): void
    {
        if (! $entry->isDraft()) {
            throw ValidationException::withMessages([
                'journal' => __('accounting.validation.journal_draft_only'),
            ]);
        }

        $entry->delete();
    }

    /**
     * @param  list<array{account_id: int, debit?: float|int|string, credit?: float|int|string, partner_id?: int|null, warehouse_id?: int|null, memo?: string|null}>  $lines
     */
    private function syncLines(JournalEntry $entry, array $lines): void
    {
        foreach (array_values($lines) as $index => $line) {
            $debit = round((float) ($line['debit'] ?? 0), 2);
            $credit = round((float) ($line['credit'] ?? 0), 2);

            JournalLine::query()->create([
                'journal_entry_id' => $entry->id,
                'account_id' => (int) $line['account_id'],
                'debit' => $debit,
                'credit' => $credit,
                'partner_id' => $line['partner_id'] ?? null,
                'warehouse_id' => $line['warehouse_id'] ?? null,
                'memo' => $line['memo'] ?? null,
                'sort_order' => $index + 1,
            ]);
        }
    }

    /**
     * @param  list<array{account_id: int, debit?: float|int|string, credit?: float|int|string}>  $lines
     */
    private function assertLinesValid(array $lines, bool $requireBalance = true, bool $allowZeroAmounts = false): void
    {
        if (count($lines) < 2) {
            throw ValidationException::withMessages([
                'lines' => __('accounting.validation.lines_min'),
            ]);
        }

        $accountIds = collect($lines)->pluck('account_id')->unique()->values()->all();
        $validCount = Account::query()
            ->whereIn('id', $accountIds)
            ->where('is_active', true)
            ->where('is_postable', true)
            ->count();

        if ($validCount !== count($accountIds)) {
            throw ValidationException::withMessages([
                'lines' => __('accounting.validation.account_invalid'),
            ]);
        }

        $totalDebit = 0.0;
        $totalCredit = 0.0;

        foreach ($lines as $index => $line) {
            $debit = round((float) ($line['debit'] ?? 0), 2);
            $credit = round((float) ($line['credit'] ?? 0), 2);

            if ($debit < 0 || $credit < 0) {
                throw ValidationException::withMessages([
                    "lines.{$index}" => __('accounting.validation.amount_negative'),
                ]);
            }

            if ($debit > 0 && $credit > 0) {
                throw ValidationException::withMessages([
                    "lines.{$index}" => __('accounting.validation.line_both_sides'),
                ]);
            }

            if (! $allowZeroAmounts && $debit <= 0 && $credit <= 0) {
                throw ValidationException::withMessages([
                    "lines.{$index}" => __('accounting.validation.line_empty'),
                ]);
            }

            $totalDebit += $debit;
            $totalCredit += $credit;
        }

        if ($requireBalance && abs(round($totalDebit, 2) - round($totalCredit, 2)) >= 0.005) {
            throw ValidationException::withMessages([
                'lines' => __('accounting.validation.journal_unbalanced'),
            ]);
        }
    }
}
