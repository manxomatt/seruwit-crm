<?php

namespace Modules\Accounting\Support;

use Illuminate\Support\Facades\DB;
use Modules\Accounting\Models\Budget;
use Modules\Accounting\Models\BudgetLine;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\FiscalYear;

class BudgetService
{
    public function __construct(private readonly GlBalanceAggregator $aggregator) {}

    /**
     * @param  array{fiscal_year_id: int, name: string, is_active?: bool, lines?: list<array{account_id: int, fiscal_period_id: int, amount: float|int|string}>}  $data
     */
    public function create(array $data): Budget
    {
        return DB::transaction(function () use ($data): Budget {
            $budget = Budget::query()->create([
                'fiscal_year_id' => (int) $data['fiscal_year_id'],
                'name' => (string) $data['name'],
                'is_active' => (bool) ($data['is_active'] ?? true),
            ]);

            foreach ($data['lines'] ?? [] as $line) {
                BudgetLine::query()->create([
                    'budget_id' => $budget->id,
                    'account_id' => (int) $line['account_id'],
                    'fiscal_period_id' => (int) $line['fiscal_period_id'],
                    'amount' => round((float) $line['amount'], 2),
                ]);
            }

            return $budget->fresh('lines');
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function vsActual(Budget $budget, FiscalPeriod $period): array
    {
        $aggregates = $this->aggregator->aggregates(['period_id' => $period->id]);

        $lines = BudgetLine::query()
            ->with('account:id,code,name,type,normal_balance')
            ->where('budget_id', $budget->id)
            ->where('fiscal_period_id', $period->id)
            ->get();

        $rows = [];
        $totalBudget = 0.0;
        $totalActual = 0.0;

        foreach ($lines as $line) {
            $account = $line->account;
            if ($account === null) {
                continue;
            }

            $agg = $aggregates->get($account->id);
            $debit = round((float) ($agg->debit_total ?? 0), 2);
            $credit = round((float) ($agg->credit_total ?? 0), 2);
            $actual = $this->aggregator->signedAmount($account, $debit, $credit);
            $budgetAmount = round((float) $line->amount, 2);
            $variance = round($actual - $budgetAmount, 2);

            $rows[] = [
                'account_id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'budget' => $budgetAmount,
                'actual' => $actual,
                'variance' => $variance,
            ];

            $totalBudget += $budgetAmount;
            $totalActual += $actual;
        }

        return [
            'budget' => [
                'id' => $budget->id,
                'name' => $budget->name,
            ],
            'period' => $period,
            'rows' => $rows,
            'total_budget' => round($totalBudget, 2),
            'total_actual' => round($totalActual, 2),
            'total_variance' => round($totalActual - $totalBudget, 2),
        ];
    }

    public function defaultForYear(FiscalYear $year): ?Budget
    {
        return Budget::query()
            ->where('fiscal_year_id', $year->id)
            ->where('is_active', true)
            ->orderBy('id')
            ->first();
    }
}
