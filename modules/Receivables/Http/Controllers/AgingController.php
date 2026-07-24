<?php

namespace Modules\Receivables\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Receivables\Support\AgingReport;

class AgingController extends Controller
{
    public function index(): Response
    {
        $report = AgingReport::build(
            request()->filled('partner_id') ? request()->integer('partner_id') : null,
        );

        return Inertia::render('Modules/Receivables/Aging/Index', [
            'buckets' => $report['buckets'],
            'overdue_count' => $report['overdue_count'],
            'overdue_amount' => $report['overdue_amount'],
            'rows' => $report['rows'],
            'filters' => [
                'partner_id' => request('partner_id'),
            ],
        ]);
    }
}
