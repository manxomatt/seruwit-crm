<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Response;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Support\CashFlowService;
use Modules\Accounting\Support\FiscalCalendarService;

class CashFlowController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function show(Request $request, CashFlowService $service, FiscalCalendarService $calendar): Response
    {
        $periodId = $request->integer('period_id');
        $period = $periodId > 0
            ? FiscalPeriod::query()->findOrFail($periodId)
            : $calendar->periodForDate(now());

        $report = $service->forPeriod($period);

        return inertia('Modules/Accounting/Reports/CashFlow', [
            'period' => [
                'id' => $period->id,
                'name' => $period->name,
                'starts_on' => $period->starts_on->toDateString(),
                'ends_on' => $period->ends_on->toDateString(),
                'status' => $period->status,
            ],
            'periods' => FiscalPeriod::query()->orderByDesc('starts_on')->limit(36)->get(['id', 'name']),
            'opening_cash' => $report['opening_cash'],
            'closing_cash' => $report['closing_cash'],
            'net_cash_change' => $report['net_cash_change'],
            'net_income' => $report['net_income'],
            'adjustments' => $report['adjustments'],
            'cash_from_operations' => $report['cash_from_operations'],
            'investing_financing_other' => $report['investing_financing_other'],
        ]);
    }
}
