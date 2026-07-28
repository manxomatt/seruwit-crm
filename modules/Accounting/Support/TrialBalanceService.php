<?php

namespace Modules\Accounting\Support;

use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;

class TrialBalanceService
{
    /**
     * @return array{
     *     period: FiscalPeriod,
     *     rows: list<array{account_id: int, code: string, name: string, type: string, debit: float, credit: float}>,
     *     total_debit: float,
     *     total_credit: float,
     *     is_balanced: bool
     * }
     */
    public function forPeriod(FiscalPeriod $period): array
    {
        $aggregates = JournalLine::query()
            ->selectRaw('account_id, SUM(debit) as debit_total, SUM(credit) as credit_total')
            ->whereHas('journalEntry', function ($query) use ($period): void {
                $query->where('fiscal_period_id', $period->id)
                    ->where('status', JournalEntry::STATUS_POSTED);
            })
            ->groupBy('account_id')
            ->get()
            ->keyBy('account_id');

        $accounts = Account::query()
            ->where('is_postable', true)
            ->orderBy('code')
            ->get();

        $rows = [];
        $totalDebit = 0.0;
        $totalCredit = 0.0;

        foreach ($accounts as $account) {
            $agg = $aggregates->get($account->id);
            $debit = round((float) ($agg->debit_total ?? 0), 2);
            $credit = round((float) ($agg->credit_total ?? 0), 2);

            if ($debit <= 0 && $credit <= 0) {
                continue;
            }

            $rows[] = [
                'account_id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'debit' => $debit,
                'credit' => $credit,
            ];

            $totalDebit += $debit;
            $totalCredit += $credit;
        }

        $totalDebit = round($totalDebit, 2);
        $totalCredit = round($totalCredit, 2);

        return [
            'period' => $period,
            'rows' => $rows,
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'is_balanced' => abs($totalDebit - $totalCredit) < 0.005,
        ];
    }
}
