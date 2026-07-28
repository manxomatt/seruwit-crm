<?php

namespace Modules\Accounting\Support;

use Illuminate\Support\Collection;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;

/**
 * Shared GL debit/credit totals for financial statements.
 */
class GlBalanceAggregator
{
    /**
     * @param  array{period_id?: int, from?: string, as_of?: string}  $filters
     * @return Collection<int|string, object{account_id: int, debit_total: mixed, credit_total: mixed}>
     */
    public function aggregates(array $filters = []): Collection
    {
        return JournalLine::query()
            ->selectRaw('account_id, SUM(debit) as debit_total, SUM(credit) as credit_total')
            ->whereHas('journalEntry', function ($query) use ($filters): void {
                $query->where('status', JournalEntry::STATUS_POSTED);

                if (isset($filters['period_id'])) {
                    $query->where('fiscal_period_id', (int) $filters['period_id']);
                }

                if (isset($filters['from'])) {
                    $query->whereDate('entry_date', '>=', $filters['from']);
                }

                if (isset($filters['as_of'])) {
                    $query->whereDate('entry_date', '<=', $filters['as_of']);
                }
            })
            ->groupBy('account_id')
            ->get()
            ->keyBy('account_id');
    }

    public function signedAmount(Account $account, float $debit, float $credit): float
    {
        if ($account->normal_balance === Account::NORMAL_CREDIT) {
            return round($credit - $debit, 2);
        }

        return round($debit - $credit, 2);
    }
}
