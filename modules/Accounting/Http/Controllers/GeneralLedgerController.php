<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\GeneralLedgerService;

class GeneralLedgerController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function show(Request $request, GeneralLedgerService $service, FiscalCalendarService $calendar): Response
    {
        $periodId = $request->integer('period_id');
        $period = $periodId > 0
            ? FiscalPeriod::query()->findOrFail($periodId)
            : $calendar->periodForDate(now());

        $accounts = Account::query()
            ->where('is_postable', true)
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name']);

        $accountId = $request->integer('account_id') ?: (int) ($accounts->first()?->id ?? 0);
        $account = $accountId > 0 ? Account::query()->findOrFail($accountId) : null;
        $report = $account ? $service->forAccount($account, $period) : null;

        return inertia('Modules/Accounting/Reports/GeneralLedger', [
            'period' => [
                'id' => $period->id,
                'name' => $period->name,
                'starts_on' => $period->starts_on->toDateString(),
                'ends_on' => $period->ends_on->toDateString(),
                'status' => $period->status,
            ],
            'periods' => FiscalPeriod::query()->orderByDesc('starts_on')->limit(36)->get(['id', 'name']),
            'accounts' => $accounts,
            'account_id' => $account?->id,
            'opening_balance' => $report['opening_balance'] ?? 0,
            'rows' => $report['rows'] ?? [],
            'period_debit' => $report['period_debit'] ?? 0,
            'period_credit' => $report['period_credit'] ?? 0,
            'closing_balance' => $report['closing_balance'] ?? 0,
            'account' => $report['account'] ?? null,
        ]);
    }
}
