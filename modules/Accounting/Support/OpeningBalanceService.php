<?php

namespace Modules\Accounting\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalYear;
use Modules\Accounting\Models\JournalEntry;

class OpeningBalanceService
{
    public function __construct(private readonly JournalService $journals) {}

    /**
     * @param  list<array{account_id: int, debit?: float|int|string, credit?: float|int|string, memo?: string|null}>  $lines
     */
    public function post(
        FiscalYear $year,
        array $lines,
        ?string $entryDate = null,
        ?string $memo = null,
        ?int $userId = null,
    ): JournalEntry {
        if ($year->is_closed) {
            throw ValidationException::withMessages([
                'year' => __('accounting.validation.year_closed'),
            ]);
        }

        $existing = $this->findOpening($year);
        if ($existing !== null) {
            throw ValidationException::withMessages([
                'year' => __('accounting.validation.opening_already_exists'),
            ]);
        }

        if ($this->yearHasPostedActivity($year)) {
            throw ValidationException::withMessages([
                'year' => __('accounting.validation.opening_year_has_activity'),
            ]);
        }

        $this->assertBalanceSheetAccounts($lines);

        $date = $entryDate ?: $year->starts_on->toDateString();
        if ($date < $year->starts_on->toDateString() || $date > $year->ends_on->toDateString()) {
            throw ValidationException::withMessages([
                'entry_date' => __('accounting.validation.opening_date_in_year'),
            ]);
        }

        return DB::transaction(function () use ($year, $lines, $date, $memo, $userId): JournalEntry {
            $entry = $this->journals->createDraft([
                'entry_date' => $date,
                'type' => JournalEntry::TYPE_OPENING,
                'memo' => $memo ?: __('accounting.messages.opening_balance_memo', ['year' => (string) $year->year]),
                'lines' => $lines,
            ], $userId ?? Auth::id());

            $entry->update([
                'source_type' => $year->getMorphClass(),
                'source_id' => (int) $year->id,
                'event' => 'year.opening',
            ]);

            return $this->journals->post($entry, $userId ?? Auth::id());
        });
    }

    public function findOpening(FiscalYear $year): ?JournalEntry
    {
        return JournalEntry::query()
            ->where('source_type', $year->getMorphClass())
            ->where('source_id', (int) $year->id)
            ->where('event', 'year.opening')
            ->where('status', JournalEntry::STATUS_POSTED)
            ->first();
    }

    public function yearHasPostedActivity(FiscalYear $year): bool
    {
        return JournalEntry::query()
            ->where('status', JournalEntry::STATUS_POSTED)
            ->whereHas('fiscalPeriod', fn ($q) => $q->where('fiscal_year_id', $year->id))
            ->exists();
    }

    /**
     * @param  list<array{account_id: int}>  $lines
     */
    private function assertBalanceSheetAccounts(array $lines): void
    {
        $ids = collect($lines)->pluck('account_id')->unique()->values()->all();
        $invalid = Account::query()
            ->whereIn('id', $ids)
            ->whereNotIn('type', [
                Account::TYPE_ASSET,
                Account::TYPE_LIABILITY,
                Account::TYPE_EQUITY,
            ])
            ->exists();

        if ($invalid || count($ids) === 0) {
            throw ValidationException::withMessages([
                'lines' => __('accounting.validation.opening_bs_accounts_only'),
            ]);
        }
    }
}
