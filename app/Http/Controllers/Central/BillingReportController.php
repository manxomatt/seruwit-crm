<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\ReportingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BillingReportController extends Controller
{
    public function __construct(
        private ReportingService $reportingService,
    ) {}

    /**
     * Show billing reports for subscription
     */
    public function index(Tenant $tenant): Response
    {
        $subscription = $tenant->subscription;

        if (! $subscription) {
            return Inertia::render('Central/BillingReport/NoBilling', [
                'tenant' => $tenant->only('id', 'name'),
            ]);
        }

        $billingReports = $this->reportingService->getBillingReports($subscription);
        $summary = $this->reportingService->getBillingSummary($subscription);
        $averageMonthlySpend = $this->reportingService->getAverageMonthlySpend($subscription);

        return Inertia::render('Central/BillingReport/Index', [
            'tenant' => $tenant->only('id', 'name'),
            'subscription' => [
                'id' => $subscription->id,
                'subscribed_vehicles' => $subscription->subscribed_vehicles,
            ],
            'billing_reports' => $billingReports->map(fn ($report) => [
                'id' => $report->id,
                'month_year' => $report->month_year,
                'total_amount' => $report->total_amount,
                'vehicle_count' => $report->vehicle_count,
                'billing_interval' => $report->billing_interval,
                'status' => $report->status,
                'billed_at' => $report->billed_at?->format('Y-m-d'),
                'paid_at' => $report->paid_at?->format('Y-m-d'),
            ]),
            'summary' => $summary,
            'average_monthly_spend' => (int) $averageMonthlySpend,
        ]);
    }

    /**
     * Show single billing report details
     */
    public function show(Tenant $tenant, int $year, int $month): Response
    {
        $subscription = $tenant->subscription;

        if (! $subscription) {
            return Inertia::render('Central/BillingReport/NoBilling', [
                'tenant' => $tenant->only('id', 'name'),
            ]);
        }

        $report = $this->reportingService->getBillingReport($subscription, $year, $month);

        if (! $report) {
            return Inertia::render('Central/BillingReport/NotFound', [
                'tenant' => $tenant->only('id', 'name'),
            ]);
        }

        return Inertia::render('Central/BillingReport/Show', [
            'tenant' => $tenant->only('id', 'name'),
            'subscription' => [
                'id' => $subscription->id,
                'subscribed_vehicles' => $subscription->subscribed_vehicles,
            ],
            'billing_report' => [
                'id' => $report->id,
                'year' => $report->year,
                'month' => $report->month,
                'month_year' => $report->month_year,
                'total_amount' => $report->total_amount,
                'vehicle_cost' => $report->vehicle_cost,
                'vehicle_count' => $report->vehicle_count,
                'billing_interval' => $report->billing_interval,
                'status' => $report->status,
                'billed_at' => $report->billed_at?->format('Y-m-d H:i'),
                'paid_at' => $report->paid_at?->format('Y-m-d H:i'),
            ],
        ]);
    }

    /**
     * Export billing reports as CSV
     */
    public function exportCsv(Tenant $tenant, Request $request): StreamedResponse
    {
        $subscription = $tenant->subscription;

        if (! $subscription) {
            abort(404, 'No active subscription');
        }

        $startDate = $request->query('start_date') ? \Carbon\Carbon::parse($request->query('start_date')) : null;
        $endDate = $request->query('end_date') ? \Carbon\Carbon::parse($request->query('end_date')) : null;

        $reports = $this->reportingService->exportBillingReports($subscription, $startDate, $endDate);

        $headers = [
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=billing-reports.csv',
        ];

        $callback = function () use ($reports) {
            $file = fopen('php://output', 'w');

            // Write header
            fputcsv($file, ['Month/Year', 'Total Amount', 'Vehicle Count', 'Billing Interval', 'Status', 'Billed Date', 'Paid Date']);

            // Write data
            foreach ($reports as $report) {
                fputcsv($file, $report);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
