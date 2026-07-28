<?php

namespace Modules\TradePromotions\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Support\AccessibleWarehouses;
use Modules\TradePromotions\Support\PromoReportService;

class PromoReportController extends Controller
{
    public function index(Request $request, PromoReportService $reports): Response
    {
        $filters = [
            'from' => $request->string('from')->toString() ?: null,
            'to' => $request->string('to')->toString() ?: null,
            'warehouse_id' => $request->integer('warehouse_id') ?: null,
            'program_id' => $request->integer('program_id') ?: null,
        ];

        $warehouses = [];
        if (class_exists(AccessibleWarehouses::class)) {
            $warehouses = AccessibleWarehouses::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'kind']);
        }

        return Inertia::render('Modules/TradePromotions/Reports/Index', [
            'summary' => $reports->summarize($filters),
            'filters' => $filters,
            'programs' => $reports->programOptions(),
            'warehouses' => $warehouses,
        ]);
    }
}
