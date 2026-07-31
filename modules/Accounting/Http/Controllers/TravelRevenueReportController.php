<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Response;
use Modules\Accounting\Support\TravelRevenueReportService;

class TravelRevenueReportController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function show(Request $request, TravelRevenueReportService $service): Response
    {
        $from = Carbon::parse((string) $request->input('from', now()->startOfMonth()->toDateString()))->startOfDay();
        $to = Carbon::parse((string) $request->input('to', now()->toDateString()))->startOfDay();

        $report = $service->report($from, $to);

        return inertia('Modules/Accounting/Reports/TravelRevenue', [
            'from' => $report['from'],
            'to' => $report['to'],
            'account' => $report['account'],
            'rows' => $report['rows'],
            'totals' => $report['totals'],
            'by_event' => $report['by_event'],
        ]);
    }
}
