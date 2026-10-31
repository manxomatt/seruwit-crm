<?php

namespace Modules\Expenses\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Expenses\Models\CashAdvance;
use Modules\Expenses\Models\ExpenseClaim;
use Modules\Expenses\Models\ExpenseClaimLine;
use Modules\Expenses\Support\ExpenseSchemaInitializer;

class ExpenseDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        ExpenseSchemaInitializer::ensureReady();

        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        $postedMonthTotal = (float) ExpenseClaim::query()
            ->where('status', ExpenseClaim::STATUS_POSTED)
            ->whereBetween('expense_date', [$monthStart, $monthEnd])
            ->sum('total_amount');

        $draftClaimsCount = ExpenseClaim::query()
            ->where('status', ExpenseClaim::STATUS_DRAFT)
            ->count();

        $openAdvances = CashAdvance::query()
            ->where('status', CashAdvance::STATUS_DISBURSED)
            ->orderBy('advance_date')
            ->get();

        $openAdvancesAmount = round((float) $openAdvances->sum('amount'), 2);
        $openAdvancesCount = $openAdvances->count();

        $categoryBreakdown = ExpenseClaimLine::query()
            ->whereHas('expenseClaim', fn ($q) => $q
                ->where('status', ExpenseClaim::STATUS_POSTED)
                ->whereBetween('expense_date', [$monthStart, $monthEnd])
            )
            ->with('category:id,code,name')
            ->get()
            ->groupBy(fn (ExpenseClaimLine $line) => $line->category?->name ?? 'Lain-lain')
            ->map(fn ($group, string $label): array => [
                'category' => $label,
                'amount' => round((float) $group->sum('amount'), 2),
                'count' => $group->count(),
            ])
            ->sortByDesc('amount')
            ->values()
            ->all();

        $recentClaims = ExpenseClaim::query()
            ->with(['companyBankAccount:id,name,kind', 'lines.category:id,code,name'])
            ->latest('expense_date')
            ->latest('id')
            ->limit(8)
            ->get()
            ->map(fn (ExpenseClaim $claim): array => [
                'id' => $claim->id,
                'code' => $claim->code,
                'expense_date' => $claim->expense_date?->toDateString(),
                'type' => $claim->type,
                'title' => $claim->title,
                'total_amount' => (float) $claim->total_amount,
                'status' => $claim->status,
                'payment_method' => $claim->payment_method,
                'bank_account_name' => $claim->companyBankAccount?->name,
                'categories' => $claim->lines
                    ->map(fn (ExpenseClaimLine $line) => $line->category?->name)
                    ->filter()
                    ->unique()
                    ->values()
                    ->all(),
            ])
            ->all();

        $activeAdvancesList = $openAdvances->take(6)->map(fn (CashAdvance $adv): array => [
            'id' => $adv->id,
            'code' => $adv->code,
            'advance_date' => $adv->advance_date?->toDateString(),
            'purpose' => $adv->purpose,
            'recipient_name' => $adv->recipient_name ?? '—',
            'amount' => (float) $adv->amount,
            'status' => $adv->status,
        ])->values()->all();

        $user = $request->user();

        return Inertia::render('Modules/Expenses/Dashboard/Index', [
            'kpis' => [
                'posted_month_total' => round($postedMonthTotal, 2),
                'draft_claims_count' => $draftClaimsCount,
                'open_advances_amount' => $openAdvancesAmount,
                'open_advances_count' => $openAdvancesCount,
            ],
            'categoryBreakdown' => $categoryBreakdown,
            'recentClaims' => $recentClaims,
            'activeAdvances' => $activeAdvancesList,
            'can' => [
                'create' => ($user?->hasPermissionFor('expenses', 'create') ?? false) || ($user?->isAdmin() ?? false),
                'disburse' => ($user?->hasPermissionFor('expenses', 'disburse') ?? false) || ($user?->isAdmin() ?? false),
            ],
        ]);
    }
}
