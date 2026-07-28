<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Response;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\ProfitAndLossService;

class ProfitAndLossController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function show(Request $request, ProfitAndLossService $service, FiscalCalendarService $calendar): Response
    {
        $periodId = $request->integer('period_id');

        if ($periodId > 0) {
            $period = FiscalPeriod::query()->findOrFail($periodId);
        } else {
            $period = $calendar->periodForDate(now());
        }

        $report = $service->forPeriod($period);

        return inertia('Modules/Accounting/Reports/ProfitAndLoss', [
            'period' => [
                'id' => $period->id,
                'name' => $period->name,
                'starts_on' => $period->starts_on->toDateString(),
                'ends_on' => $period->ends_on->toDateString(),
                'status' => $period->status,
            ],
            'periods' => FiscalPeriod::query()->orderByDesc('starts_on')->limit(36)->get(['id', 'name']),
            'revenues' => $report['revenues'],
            'expenses' => $report['expenses'],
            'total_revenue' => $report['total_revenue'],
            'total_expense' => $report['total_expense'],
            'net_income' => $report['net_income'],
        ]);
    }
}
