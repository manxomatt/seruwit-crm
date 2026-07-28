<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Response;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\TrialBalanceService;

class TrialBalanceController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function show(Request $request, TrialBalanceService $trialBalance, FiscalCalendarService $calendar): Response
    {
        $periodId = $request->integer('period_id');

        if ($periodId > 0) {
            $period = FiscalPeriod::query()->findOrFail($periodId);
        } else {
            $period = $calendar->periodForDate(now());
        }

        $report = $trialBalance->forPeriod($period);

        return inertia('Modules/Accounting/Reports/TrialBalance', [
            'period' => [
                'id' => $period->id,
                'name' => $period->name,
                'starts_on' => $period->starts_on->toDateString(),
                'ends_on' => $period->ends_on->toDateString(),
                'status' => $period->status,
            ],
            'periods' => FiscalPeriod::query()->orderByDesc('starts_on')->limit(36)->get(['id', 'name']),
            'rows' => $report['rows'],
            'total_debit' => $report['total_debit'],
            'total_credit' => $report['total_credit'],
            'is_balanced' => $report['is_balanced'],
        ]);
    }
}
