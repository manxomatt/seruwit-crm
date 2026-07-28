<?php

namespace Modules\Accounting\Support;

use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;

class BalanceSheetService
{
    public function __construct(private readonly GlBalanceAggregator $aggregator) {}

    /**
     * Balance sheet as of the period end date, with YTD net income as equity.
     *
     * @return array{
     *     period: FiscalPeriod,
     *     assets: list<array{account_id: int, code: string, name: string, type: string, amount: float}>,
     *     liabilities: list<array{account_id: int, code: string, name: string, type: string, amount: float}>,
     *     equity: list<array{account_id: int|null, code: string, name: string, type: string, amount: float, is_synthetic?: bool}>,
     *     total_assets: float,
     *     total_liabilities: float,
     *     total_equity: float,
     *     net_income_ytd: float,
     *     is_balanced: bool
     * }
     */
    public function asOfPeriod(FiscalPeriod $period): array
    {
        $period->loadMissing('fiscalYear');
        $yearStart = $period->fiscalYear?->starts_on?->toDateString()
            ?? sprintf('%d-01-01', (int) $period->starts_on->format('Y'));
        $asOf = $period->ends_on->toDateString();

        $balanceSheetAggs = $this->aggregator->aggregates(['as_of' => $asOf]);
        $incomeAggs = $this->aggregator->aggregates([
            'from' => $yearStart,
            'as_of' => $asOf,
        ]);

        $bsAccounts = Account::query()
            ->where('is_postable', true)
            ->whereIn('type', [
                Account::TYPE_ASSET,
                Account::TYPE_LIABILITY,
                Account::TYPE_EQUITY,
            ])
            ->orderBy('code')
            ->get();

        $assets = [];
        $liabilities = [];
        $equity = [];
        $totalAssets = 0.0;
        $totalLiabilities = 0.0;
        $totalEquity = 0.0;

        foreach ($bsAccounts as $account) {
            $agg = $balanceSheetAggs->get($account->id);
            $debit = round((float) ($agg->debit_total ?? 0), 2);
            $credit = round((float) ($agg->credit_total ?? 0), 2);

            if ($debit <= 0 && $credit <= 0) {
                continue;
            }

            $amount = $this->aggregator->signedAmount($account, $debit, $credit);
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

            if ($account->type === Account::TYPE_ASSET) {
                $assets[] = $row;
                $totalAssets += $amount;
            } elseif ($account->type === Account::TYPE_LIABILITY) {
                $liabilities[] = $row;
                $totalLiabilities += $amount;
            } else {
                $equity[] = $row;
                $totalEquity += $amount;
            }
        }

        $netIncomeYtd = $this->netIncomeFromAggregates($incomeAggs);
        if (abs($netIncomeYtd) >= 0.005) {
            $equity[] = [
                'account_id' => null,
                'code' => '—',
                'name' => __('accounting.balance_sheet.current_earnings'),
                'type' => Account::TYPE_EQUITY,
                'amount' => $netIncomeYtd,
                'is_synthetic' => true,
            ];
            $totalEquity += $netIncomeYtd;
        }

        $totalAssets = round($totalAssets, 2);
        $totalLiabilities = round($totalLiabilities, 2);
        $totalEquity = round($totalEquity, 2);

        return [
            'period' => $period,
            'assets' => $assets,
            'liabilities' => $liabilities,
            'equity' => $equity,
            'total_assets' => $totalAssets,
            'total_liabilities' => $totalLiabilities,
            'total_equity' => $totalEquity,
            'net_income_ytd' => round($netIncomeYtd, 2),
            'is_balanced' => abs($totalAssets - ($totalLiabilities + $totalEquity)) < 0.005,
        ];
    }

    /**
     * @param  \Illuminate\Support\Collection<int|string, object>  $aggregates
     */
    private function netIncomeFromAggregates($aggregates): float
    {
        $accounts = Account::query()
            ->where('is_postable', true)
            ->whereIn('type', [
                Account::TYPE_REVENUE,
                Account::TYPE_CONTRA_REVENUE,
                Account::TYPE_EXPENSE,
            ])
            ->get();

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

            if (in_array($account->type, [Account::TYPE_REVENUE, Account::TYPE_CONTRA_REVENUE], true)) {
                $totalRevenue += $amount;
            } else {
                $totalExpense += $amount;
            }
        }

        return round($totalRevenue - $totalExpense, 2);
    }
}
