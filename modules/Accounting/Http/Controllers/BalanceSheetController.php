<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Response;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Support\BalanceSheetService;
use Modules\Accounting\Support\FiscalCalendarService;

class BalanceSheetController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function show(Request $request, BalanceSheetService $service, FiscalCalendarService $calendar): Response
    {
        $periodId = $request->integer('period_id');

        if ($periodId > 0) {
            $period = FiscalPeriod::query()->findOrFail($periodId);
        } else {
            $period = $calendar->periodForDate(now());
        }

        $report = $service->asOfPeriod($period);

        return inertia('Modules/Accounting/Reports/BalanceSheet', [
            'period' => [
                'id' => $period->id,
                'name' => $period->name,
                'starts_on' => $period->starts_on->toDateString(),
                'ends_on' => $period->ends_on->toDateString(),
                'status' => $period->status,
            ],
            'periods' => FiscalPeriod::query()->orderByDesc('starts_on')->limit(36)->get(['id', 'name']),
            'assets' => $report['assets'],
            'liabilities' => $report['liabilities'],
            'equity' => $report['equity'],
            'total_assets' => $report['total_assets'],
            'total_liabilities' => $report['total_liabilities'],
            'total_equity' => $report['total_equity'],
            'net_income_ytd' => $report['net_income_ytd'],
            'is_balanced' => $report['is_balanced'],
        ]);
    }
}
