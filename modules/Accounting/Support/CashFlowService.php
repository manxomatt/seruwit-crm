<?php

namespace Modules\Accounting\Support;

use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;

class CashFlowService
{
    public function __construct(
        private readonly GlBalanceAggregator $aggregator,
        private readonly ProfitAndLossService $profitAndLoss,
    ) {}

    /**
     * Indirect cash flow MVP for a fiscal period.
     *
     * @return array<string, mixed>
     */
    public function forPeriod(FiscalPeriod $period): array
    {
        $period->loadMissing('fiscalYear');
        $startsOn = $period->starts_on->toDateString();
        $endsOn = $period->ends_on->toDateString();
        $dayBefore = $period->starts_on->copy()->subDay()->toDateString();

        $openingCash = $this->cashBalanceAsOf($dayBefore);
        $closingCash = $this->cashBalanceAsOf($endsOn);
        $netCashChange = round($closingCash - $openingCash, 2);

        $pnl = $this->profitAndLoss->forPeriod($period);
        $netIncome = $pnl['net_income'];

        $openingWc = $this->workingCapitalBalances($dayBefore);
        $closingWc = $this->workingCapitalBalances($endsOn);

        $deltaAr = round($closingWc['ar'] - $openingWc['ar'], 2);
        $deltaAp = round($closingWc['ap'] - $openingWc['ap'], 2);
        $deltaInventory = round($closingWc['inventory'] - $openingWc['inventory'], 2);
        $depreciation = $this->periodDepreciationExpense($period);

        $adjustments = [
            [
                'key' => 'depreciation',
                'label' => 'depreciation',
                'amount' => $depreciation,
            ],
            [
                'key' => 'ar',
                'label' => 'delta_ar',
                'amount' => round(-1 * $deltaAr, 2),
            ],
            [
                'key' => 'inventory',
                'label' => 'delta_inventory',
                'amount' => round(-1 * $deltaInventory, 2),
            ],
            [
                'key' => 'ap',
                'label' => 'delta_ap',
                'amount' => $deltaAp,
            ],
        ];

        $operating = round($netIncome + array_sum(array_column($adjustments, 'amount')), 2);
        $other = round($netCashChange - $operating, 2);

        return [
            'period' => $period,
            'opening_cash' => $openingCash,
            'closing_cash' => $closingCash,
            'net_cash_change' => $netCashChange,
            'net_income' => $netIncome,
            'adjustments' => $adjustments,
            'cash_from_operations' => $operating,
            'investing_financing_other' => $other,
            'starts_on' => $startsOn,
            'ends_on' => $endsOn,
        ];
    }

    private function cashBalanceAsOf(string $asOf): float
    {
        $aggregates = $this->aggregator->aggregates(['as_of' => $asOf]);
        $accounts = Account::query()
            ->where('is_postable', true)
            ->whereIn('system_role', ['cash', 'bank'])
            ->get();

        $total = 0.0;
        foreach ($accounts as $account) {
            $agg = $aggregates->get($account->id);
            $debit = round((float) ($agg->debit_total ?? 0), 2);
            $credit = round((float) ($agg->credit_total ?? 0), 2);
            $total += $this->aggregator->signedAmount($account, $debit, $credit);
        }

        return round($total, 2);
    }

    /**
     * @return array{ar: float, ap: float, inventory: float}
     */
    private function workingCapitalBalances(string $asOf): array
    {
        $aggregates = $this->aggregator->aggregates(['as_of' => $asOf]);
        $roles = [
            'ar' => 'ar_control',
            'ap' => 'ap_control',
            'inventory' => 'inventory',
        ];

        $out = ['ar' => 0.0, 'ap' => 0.0, 'inventory' => 0.0];

        foreach ($roles as $key => $role) {
            $account = Account::query()
                ->where('system_role', $role)
                ->where('is_postable', true)
                ->orderBy('code')
                ->first();

            if ($account === null) {
                continue;
            }

            $agg = $aggregates->get($account->id);
            $debit = round((float) ($agg->debit_total ?? 0), 2);
            $credit = round((float) ($agg->credit_total ?? 0), 2);
            $out[$key] = $this->aggregator->signedAmount($account, $debit, $credit);
        }

        return $out;
    }

    private function periodDepreciationExpense(FiscalPeriod $period): float
    {
        $account = Account::query()
            ->where('system_role', 'depreciation_expense')
            ->where('is_postable', true)
            ->orderBy('code')
            ->first();

        if ($account === null) {
            return 0.0;
        }

        $aggregates = $this->aggregator->aggregates(['period_id' => $period->id]);
        $agg = $aggregates->get($account->id);
        $debit = round((float) ($agg->debit_total ?? 0), 2);
        $credit = round((float) ($agg->credit_total ?? 0), 2);

        return $this->aggregator->signedAmount($account, $debit, $credit);
    }
}
