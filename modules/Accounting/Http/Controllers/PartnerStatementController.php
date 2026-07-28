<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Response;
use Modules\Accounting\Support\PartnerStatementService;
use Modules\Partners\Models\Partner;

class PartnerStatementController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function show(Request $request, PartnerStatementService $service): Response
    {
        $from = (string) $request->input('from', now()->startOfMonth()->toDateString());
        $to = (string) $request->input('to', now()->toDateString());
        $partnerId = $request->integer('partner_id');

        $partners = Partner::query()
            ->orderBy('name')
            ->limit(500)
            ->get(['id', 'code', 'name']);

        $partner = $partnerId > 0 ? Partner::query()->find($partnerId) : null;
        $report = $partner ? $service->forPartner($partner, $from, $to) : null;

        return inertia('Modules/Accounting/Reports/PartnerStatement', [
            'from' => $from,
            'to' => $to,
            'partners' => $partners,
            'partner_id' => $partner?->id,
            'partner' => $report['partner'] ?? null,
            'opening_balance' => $report['opening_balance'] ?? 0,
            'rows' => $report['rows'] ?? [],
            'total_debit' => $report['total_debit'] ?? 0,
            'total_credit' => $report['total_credit'] ?? 0,
            'closing_balance' => $report['closing_balance'] ?? 0,
        ]);
    }
}
