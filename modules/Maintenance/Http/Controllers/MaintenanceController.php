<?php

namespace Modules\Maintenance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Maintenance\Models\WorkOrder;

class MaintenanceController extends Controller
{
    /**
     * Dashboard: summary cards + recent work orders across all vehicles.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $summary = [
            'draft' => WorkOrder::query()->where('status', WorkOrder::STATUS_DRAFT)->count(),
            'pending' => WorkOrder::query()->where('status', WorkOrder::STATUS_PENDING)->count(),
            'approved' => WorkOrder::query()->where('status', WorkOrder::STATUS_APPROVED)->count(),
            'in_progress' => WorkOrder::query()->where('status', WorkOrder::STATUS_IN_PROGRESS)->count(),
            'overdue' => WorkOrder::query()->overdue()->count(),
            'completed_this_month' => WorkOrder::query()
                ->where('status', WorkOrder::STATUS_COMPLETED)
                ->whereMonth('completed_at', now()->month)
                ->whereYear('completed_at', now()->year)
                ->count(),
            'total_cost_this_month' => (float) WorkOrder::query()
                ->where('status', WorkOrder::STATUS_COMPLETED)
                ->whereMonth('completed_at', now()->month)
                ->whereYear('completed_at', now()->year)
                ->selectRaw('COALESCE(SUM(actual_labor_cost), 0) + COALESCE(SUM(actual_parts_cost), 0) as total')
                ->value('total'),
        ];

        $recentWorkOrders = WorkOrder::query()
            ->with(['vehicle', 'category'])
            ->whereIn('status', [
                WorkOrder::STATUS_DRAFT,
                WorkOrder::STATUS_PENDING,
                WorkOrder::STATUS_APPROVED,
                WorkOrder::STATUS_IN_PROGRESS,
            ])
            ->orWhere(fn ($q) => $q->overdue())
            ->orderByRaw("CASE status WHEN 'in_progress' THEN 0 WHEN 'approved' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END")
            ->orderBy('scheduled_date')
            ->take(10)
            ->get();

        return Inertia::render('Modules/Maintenance/Index', [
            'summary' => $summary,
            'recentWorkOrders' => $recentWorkOrders,
            'can' => [
                'create' => $user->hasPermissionFor('maintenance', 'create'),
                'update' => $user->hasPermissionFor('maintenance', 'update'),
                'delete' => $user->hasPermissionFor('maintenance', 'delete'),
                'approve' => $user->hasPermissionFor('maintenance', 'approve'),
            ],
        ]);
    }
}
