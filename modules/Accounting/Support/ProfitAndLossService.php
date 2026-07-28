<?php

namespace Modules\Accounting\Support;

use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;

class ProfitAndLossService
{
    public function __construct(private readonly GlBalanceAggregator $aggregator) {}

    /**
     * @return array{
     *     period: FiscalPeriod,
     *     revenues: list<array{account_id: int, code: string, name: string, type: string, amount: float}>,
     *     expenses: list<array{account_id: int, code: string, name: string, type: string, amount: float}>,
     *     total_revenue: float,
     *     total_expense: float,
     *     net_income: float
     * }
     */
    public function forPeriod(FiscalPeriod $period): array
    {
        $aggregates = $this->aggregator->aggregates(['period_id' => $period->id]);

        $accounts = Account::query()
            ->where('is_postable', true)
            ->whereIn('type', [
                Account::TYPE_REVENUE,
                Account::TYPE_CONTRA_REVENUE,
                Account::TYPE_EXPENSE,
            ])
            ->orderBy('code')
            ->get();

        $revenues = [];
        $expenses = [];
        $totalRevenue = 0.0;
        $totalExpense = 0.0;

        foreach ($accounts as $account) {
            $agg = $aggregates->get($account->id);
            $debit = round((float) ($agg->debit_total ?? 0), 2);
            $credit = round((float) ($agg->credit_total ?? 0), 2);

            if ($debit <= 0 && $credit <= 0) {
                continue;
            }

            $amount = $this->aggregator->signedAmount($account, $debit, $credit);
            if ($account->type === Account::TYPE_CONTRA_REVENUE) {
                $amount = round(-1 * $amount, 2);
            }

            if (abs($amount) < 0.005) {
                continue;
            }

            $row = [
                'account_id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'amount' => $amount,
            ];

            if (in_array($account->type, [Account::TYPE_REVENUE, Account::TYPE_CONTRA_REVENUE], true)) {
                $revenues[] = $row;
                $totalRevenue += $amount;
            } else {
                $expenses[] = $row;
                $totalExpense += $amount;
            }
        }

        $totalRevenue = round($totalRevenue, 2);
        $totalExpense = round($totalExpense, 2);

        return [
            'period' => $period,
            'revenues' => $revenues,
            'expenses' => $expenses,
            'total_revenue' => $totalRevenue,
            'total_expense' => $totalExpense,
            'net_income' => round($totalRevenue - $totalExpense, 2),
        ];
    }
}
