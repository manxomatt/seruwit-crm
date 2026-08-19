<?php

namespace Modules\Maintenance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Maintenance\Support\MaintenanceAnalyticsAggregator;

class MaintenanceAnalyticsController extends Controller
{
    public function index(MaintenanceAnalyticsAggregator $analytics): Response
    {
        $user = Auth::user();
        $from = Carbon::parse(request('from', now()->startOfMonth()->toDateString()))->startOfDay();
        $to = Carbon::parse(request('to', now()->endOfMonth()->toDateString()))->endOfDay();

        if ($from->gt($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        return Inertia::render('Modules/Maintenance/Analytics/Index', [
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'analytics' => $analytics->build($from, $to),
            'aiPredictiveEnabled' => \App\Support\CentralAiSettings::isEnabled() && \Modules\Maintenance\Support\MaintenanceSettings::aiPredictiveMaintenanceEnabled(),
            'aiPredictiveAnalyzeUrl' => route('module.maintenance.ai_predictive_analyze'),
            'aiPredictiveCreateWoUrl' => route('module.maintenance.ai_predictive_create_wo'),
            'can' => [
                'view' => $user->hasPermissionFor('maintenance', 'view'),
                'create_wo' => $user->hasPermissionFor('maintenance', 'create'),
            ],
        ]);
    }
}
