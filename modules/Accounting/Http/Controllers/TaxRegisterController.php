<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Response;
use Modules\Accounting\Support\TaxRegisterService;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TaxRegisterController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function show(Request $request, TaxRegisterService $service): Response
    {
        $side = (string) $request->input('side', TaxRegisterService::SIDE_OUTPUT);
        if (! in_array($side, [TaxRegisterService::SIDE_OUTPUT, TaxRegisterService::SIDE_INPUT], true)) {
            $side = TaxRegisterService::SIDE_OUTPUT;
        }

        $from = Carbon::parse((string) $request->input('from', now()->startOfMonth()->toDateString()))->startOfDay();
        $to = Carbon::parse((string) $request->input('to', now()->toDateString()))->startOfDay();

        $report = $service->report($side, $from, $to);

        return inertia('Modules/Accounting/Reports/TaxRegister', [
            'side' => $report['side'],
            'from' => $report['from'],
            'to' => $report['to'],
            'rows' => $report['rows'],
            'totals' => $report['totals'],
            'export_url' => route($this->getRoutePrefix().'.accounting.reports.tax-register.export', [
                'side' => $report['side'],
                'from' => $report['from'],
                'to' => $report['to'],
            ]),
        ]);
    }

    public function export(Request $request, TaxRegisterService $service): StreamedResponse
    {
        $side = (string) $request->input('side', TaxRegisterService::SIDE_OUTPUT);
        if (! in_array($side, [TaxRegisterService::SIDE_OUTPUT, TaxRegisterService::SIDE_INPUT], true)) {
            $side = TaxRegisterService::SIDE_OUTPUT;
        }

        $from = Carbon::parse((string) $request->input('from', now()->startOfMonth()->toDateString()))->startOfDay();
        $to = Carbon::parse((string) $request->input('to', now()->toDateString()))->startOfDay();
        $report = $service->report($side, $from, $to);

        $filename = sprintf(
            'ppn-%s-%s-%s.csv',
            $report['side'],
            $report['from'],
            $report['to'],
        );

        return response()->streamDownload(function () use ($report): void {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            fputcsv($handle, [
                'date',
                'document',
                'kind',
                'partner_code',
                'partner_name',
                'npwp',
                'tax_code',
                'tax_rate',
                'dpp',
                'tax',
                'gross',
            ]);

            foreach ($report['rows'] as $row) {
                fputcsv($handle, [
                    $row['date'],
                    $row['document'],
                    $row['kind'],
                    $row['partner_code'],
                    $row['partner_name'],
                    $row['npwp'],
                    $row['tax_code'],
                    $row['tax_rate'],
                    $row['dpp'],
                    $row['tax'],
                    $row['gross'],
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
