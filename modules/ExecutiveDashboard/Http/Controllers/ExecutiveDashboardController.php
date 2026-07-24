<?php

namespace Modules\ExecutiveDashboard\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\ExecutiveDashboard\Support\ExecutiveMetricsAggregator;

class ExecutiveDashboardController extends Controller
{
    public function __construct(private ExecutiveMetricsAggregator $metrics) {}

    public function index(Request $request): Response
    {
        $period = $request->query('period', 'week');

        if (! in_array($period, ['today', 'week', 'month'], true)) {
            $period = 'week';
        }

        $range = $this->resolveDateRange($period);

        return Inertia::render('Modules/ExecutiveDashboard/Index', [
            'period' => $period,
            'metrics' => $this->metrics->build($range),
            'range' => [
                'start' => $range['start']->toIso8601String(),
                'end' => $range['end']->toIso8601String(),
            ],
        ]);
    }

    /**
     * @return array{start: Carbon, end: Carbon, previous_start: Carbon, previous_end: Carbon}
     */
    private function resolveDateRange(string $period): array
    {
        $now = Carbon::now();

        return match ($period) {
            'today' => [
                'start' => $now->copy()->startOfDay(),
                'end' => $now->copy()->endOfDay(),
                'previous_start' => $now->copy()->subDay()->startOfDay(),
                'previous_end' => $now->copy()->subDay()->endOfDay(),
            ],
            'month' => [
                'start' => $now->copy()->startOfMonth(),
                'end' => $now->copy()->endOfMonth(),
                'previous_start' => $now->copy()->subMonth()->startOfMonth(),
                'previous_end' => $now->copy()->subMonth()->endOfMonth(),
            ],
            default => [
                'start' => $now->copy()->startOfWeek(),
                'end' => $now->copy()->endOfWeek(),
                'previous_start' => $now->copy()->subWeek()->startOfWeek(),
                'previous_end' => $now->copy()->subWeek()->endOfWeek(),
            ],
        };
    }
}
