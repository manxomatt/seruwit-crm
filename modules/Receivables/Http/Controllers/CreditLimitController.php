<?php

namespace Modules\Receivables\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Partners\Models\Partner;
use Modules\Receivables\Support\CreditLimitChecker;

class CreditLimitController extends Controller
{
    public function index(): Response
    {
        $partners = Partner::query()
            ->where('customer_rank', '>', 0)
            ->whereNotNull('credit_limit')
            ->where('credit_limit', '>', 0)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'credit_limit'])
            ->map(function (Partner $partner) {
                $snapshot = CreditLimitChecker::snapshot($partner);

                return [
                    'id' => $partner->id,
                    'code' => $partner->code,
                    'name' => $partner->name,
                    'credit_limit' => $snapshot['limit'],
                    'outstanding' => $snapshot['outstanding'],
                    'available' => $snapshot['available'],
                    'utilization' => $snapshot['utilization'],
                    'is_over_limit' => $snapshot['is_over_limit'],
                ];
            })
            ->sortByDesc('utilization')
            ->values();

        return Inertia::render('Modules/Receivables/Credit/Index', [
            'partners' => $partners,
            'alerts' => [
                'over_limit_count' => $partners->where('is_over_limit', true)->count(),
            ],
        ]);
    }
}
