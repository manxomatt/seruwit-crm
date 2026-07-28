<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;
use Modules\Accounting\Http\Requests\StoreBudgetRequest;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\Budget;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\FiscalYear;
use Modules\Accounting\Support\BudgetService;
use Modules\Accounting\Support\FiscalCalendarService;

class BudgetController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request, BudgetService $service, FiscalCalendarService $calendar): Response
    {
        $year = (int) $request->integer('year', (int) now()->format('Y'));
        $fiscalYear = $calendar->ensureYear($year);
        $periodId = $request->integer('period_id');
        $period = $periodId > 0
            ? FiscalPeriod::query()->findOrFail($periodId)
            : $calendar->periodForDate(now());

        $budgets = Budget::query()
            ->where('fiscal_year_id', $fiscalYear->id)
            ->orderBy('name')
            ->get(['id', 'name', 'is_active']);

        $budgetId = $request->integer('budget_id') ?: (int) ($budgets->first()?->id ?? 0);
        $budget = $budgetId > 0 ? Budget::query()->find($budgetId) : null;
        $report = $budget ? $service->vsActual($budget, $period) : null;

        return inertia('Modules/Accounting/Budgets/Index', [
            'year' => $year,
            'years' => FiscalYear::query()->orderByDesc('year')->get(['id', 'year']),
            'period' => [
                'id' => $period->id,
                'name' => $period->name,
            ],
            'periods' => FiscalPeriod::query()
                ->where('fiscal_year_id', $fiscalYear->id)
                ->orderBy('period_index')
                ->get(['id', 'name', 'period_index']),
            'budgets' => $budgets,
            'budget_id' => $budget?->id,
            'rows' => $report['rows'] ?? [],
            'total_budget' => $report['total_budget'] ?? 0,
            'total_actual' => $report['total_actual'] ?? 0,
            'total_variance' => $report['total_variance'] ?? 0,
            'can' => [
                'manage' => auth()->user()?->hasPermissionFor('accounting', 'manage_budget') ?? false,
            ],
        ]);
    }

    public function create(FiscalCalendarService $calendar): Response
    {
        $year = $calendar->ensureYear((int) now()->format('Y'));

        return inertia('Modules/Accounting/Budgets/Create', [
            'fiscal_year_id' => $year->id,
            'year' => $year->year,
            'periods' => $year->periods()->orderBy('period_index')->get(['id', 'name', 'period_index']),
            'accounts' => Account::query()
                ->where('is_postable', true)
                ->where('is_active', true)
                ->whereIn('type', [Account::TYPE_REVENUE, Account::TYPE_EXPENSE, Account::TYPE_CONTRA_REVENUE])
                ->orderBy('code')
                ->get(['id', 'code', 'name', 'type']),
        ]);
    }

    public function store(StoreBudgetRequest $request, BudgetService $service): RedirectResponse
    {
        $budget = $service->create($request->validated());
        $budget->load('fiscalYear');

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.budgets.index', [
                'budget_id' => $budget->id,
                'year' => $budget->fiscalYear?->year,
            ])
            ->with('success', __('accounting.messages.budget_created'));
    }
}
