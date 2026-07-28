<?php

namespace Modules\Accounting\Support;

use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;

class GeneralLedgerService
{
    public function __construct(private readonly GlBalanceAggregator $aggregator) {}

    /**
     * @return array<string, mixed>
     */
    public function forAccount(Account $account, FiscalPeriod $period): array
    {
        $dayBefore = $period->starts_on->copy()->subDay()->toDateString();
        $openingAggs = $this->aggregator->aggregates(['as_of' => $dayBefore]);
        $openingAgg = $openingAggs->get($account->id);
        $openingDebit = round((float) ($openingAgg->debit_total ?? 0), 2);
        $openingCredit = round((float) ($openingAgg->credit_total ?? 0), 2);
        $openingBalance = $this->aggregator->signedAmount($account, $openingDebit, $openingCredit);

        $lines = JournalLine::query()
            ->with(['journalEntry:id,number,entry_date,memo,status', 'partner:id,code,name'])
            ->where('account_id', $account->id)
            ->whereHas('journalEntry', function ($query) use ($period): void {
                $query->where('status', JournalEntry::STATUS_POSTED)
                    ->where('fiscal_period_id', $period->id);
            })
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->orderBy('journal_entries.entry_date')
            ->orderBy('journal_entries.id')
            ->orderBy('journal_lines.sort_order')
            ->orderBy('journal_lines.id')
            ->select('journal_lines.*')
            ->get();

        $running = $openingBalance;
        $rows = [];
        $periodDebit = 0.0;
        $periodCredit = 0.0;

        foreach ($lines as $line) {
            $debit = round((float) $line->debit, 2);
            $credit = round((float) $line->credit, 2);
            $periodDebit += $debit;
            $periodCredit += $credit;

            if ($account->normal_balance === Account::NORMAL_CREDIT) {
                $running = round($running + $credit - $debit, 2);
            } else {
                $running = round($running + $debit - $credit, 2);
            }

            $rows[] = [
                'id' => $line->id,
                'entry_date' => $line->journalEntry?->entry_date?->toDateString(),
                'journal_id' => $line->journal_entry_id,
                'journal_number' => $line->journalEntry?->number,
                'memo' => $line->memo ?: $line->journalEntry?->memo,
                'partner' => $line->partner
                    ? ['id' => $line->partner->id, 'code' => $line->partner->code, 'name' => $line->partner->name]
                    : null,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $running,
            ];
        }

        return [
            'account' => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'normal_balance' => $account->normal_balance,
            ],
            'period' => $period,
            'opening_balance' => $openingBalance,
            'rows' => $rows,
            'period_debit' => round($periodDebit, 2),
            'period_credit' => round($periodCredit, 2),
            'closing_balance' => $running,
        ];
    }
}
