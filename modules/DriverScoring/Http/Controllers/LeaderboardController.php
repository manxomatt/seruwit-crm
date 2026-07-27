<?php

namespace Modules\DriverScoring\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Modules\DriverScoring\Models\DriverDailyScore;
use Modules\DriverScoring\Models\DrivingEvent;
use Modules\DriverScoring\Support\DriverScoreAggregator;
use Modules\Fleet\Models\Driver;

class LeaderboardController extends Controller
{
    public function index(Request $request, DriverScoreAggregator $aggregator): Response
    {
        $from = Carbon::parse($request->input('from', now()->startOfWeek()->toDateString()))->startOfDay();
        $to = Carbon::parse($request->input('to', now()->endOfWeek()->toDateString()))->endOfDay();

        $leaderboard = $aggregator->paginatedLeaderboard(
            $from->toDateString(),
            $to->toDateString(),
            15,
        );

        $drivers = Driver::query()
            ->whereIn('id', collect($leaderboard->items())->pluck('driver_id'))
            ->get(['id', 'name', 'status'])
            ->keyBy('id');

        $leaderboard->setCollection(
            collect($leaderboard->items())->map(function (array $row) use ($drivers): array {
                $driver = $drivers->get($row['driver_id']);

                return [
                    ...$row,
                    'driver' => $driver ? [
                        'id' => $driver->id,
                        'name' => $driver->name,
                        'status' => $driver->status,
                    ] : null,
                ];
            })->values(),
        );

        return Inertia::render('Modules/DriverScoring/Leaderboard/Index', [
            'leaderboard' => $leaderboard,
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'can' => [
                'award' => $request->user()?->hasPermissionFor('scoring', 'award') ?? false,
                'update' => $request->user()?->hasPermissionFor('scoring', 'update') ?? false,
            ],
        ]);
    }

    public function show(Request $request, Driver $driver): Response
    {
        $from = Carbon::parse($request->input('from', now()->subDays(30)->toDateString()))->toDateString();
        $to = Carbon::parse($request->input('to', now()->toDateString()))->toDateString();

        $scoreQuery = DriverDailyScore::query()
            ->where('driver_id', $driver->id)
            ->whereBetween('score_date', [$from, $to]);

        $eventQuery = DrivingEvent::query()
            ->where('driver_id', $driver->id)
            ->whereBetween('recorded_at', [$from.' 00:00:00', $to.' 23:59:59']);

        $scores = (clone $scoreQuery)
            ->orderBy('score_date')
            ->paginate(15, ['*'], 'scores_page')
            ->withQueryString();

        $events = (clone $eventQuery)
            ->with('vehicle:id,name,plate_number')
            ->latest('recorded_at')
            ->paginate(15, ['*'], 'events_page')
            ->withQueryString();

        return Inertia::render('Modules/DriverScoring/Leaderboard/Show', [
            'driver' => $driver->only(['id', 'name', 'status', 'phone']),
            'scores' => $scores,
            'events' => $events,
            'filters' => compact('from', 'to'),
            'summary' => [
                'average_score' => round((float) ((clone $scoreQuery)->avg('score') ?? 0), 2),
                'event_count' => (clone $eventQuery)->count(),
                'harsh_brake_count' => (int) (clone $scoreQuery)->sum('harsh_brake_count'),
                'speeding_count' => (int) (clone $scoreQuery)->sum('speeding_count'),
                'idle_count' => (int) (clone $scoreQuery)->sum('idle_count'),
            ],
        ]);
    }
}
