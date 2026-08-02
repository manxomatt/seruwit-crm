<?php

namespace Modules\TransportationManagement\Support;

use Illuminate\Support\Facades\Schema;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripSchedule;
use Modules\TransportationManagement\Models\TripStop;

/**
 * Transportation overview: open trips, overdue dispatch, schedules, and recent activity.
 */
class TransportationStatusBoard
{
    /**
     * @return array<string, mixed>
     */
    public function build(int $recentLimit = 8): array
    {
        if (! Schema::hasTable('trips')) {
            return $this->emptyBoard();
        }

        $byStatus = Trip::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $scheduledCount = (int) ($byStatus[Trip::STATUS_SCHEDULED] ?? 0);
        $inProgressCount = (int) ($byStatus[Trip::STATUS_IN_PROGRESS] ?? 0);
        $completedCount = (int) ($byStatus[Trip::STATUS_COMPLETED] ?? 0);
        $cancelledCount = (int) ($byStatus[Trip::STATUS_CANCELLED] ?? 0);

        $openPipeline = $scheduledCount + $inProgressCount;

        $now = now();

        $overdueCount = (int) Trip::query()
            ->where('status', Trip::STATUS_SCHEDULED)
            ->where(function ($query) use ($now): void {
                $query->where('scheduled_at', '<', $now)
                    ->orWhere(function ($inner) use ($now): void {
                        $inner->whereNotNull('scheduled_end_at')
                            ->where('scheduled_end_at', '<', $now);
                    });
            })
            ->count();

        $todayStart = now()->startOfDay();
        $todayEnd = now()->endOfDay();

        $scheduledToday = (int) Trip::query()
            ->where('status', Trip::STATUS_SCHEDULED)
            ->whereBetween('scheduled_at', [$todayStart, $todayEnd])
            ->count();

        $completedThisMonth = (int) Trip::query()
            ->where('status', Trip::STATUS_COMPLETED)
            ->whereBetween('completed_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->count();

        $distanceThisMonth = (float) Trip::query()
            ->where('status', Trip::STATUS_COMPLETED)
            ->whereBetween('completed_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->sum('distance_km');

        $activeSchedules = 0;
        $schedulesTotal = 0;
        if (Schema::hasTable('trip_schedules')) {
            $schedulesTotal = (int) TripSchedule::query()->count();
            $activeSchedules = (int) TripSchedule::query()->where('is_active', true)->count();
        }

        $pendingStops = 0;
        if (Schema::hasTable('trip_stops')) {
            $pendingStops = (int) TripStop::query()
                ->where('status', TripStop::STATUS_PENDING)
                ->whereHas('trip', fn ($query) => $query->where('status', Trip::STATUS_IN_PROGRESS))
                ->count();
        }

        $recent = Trip::query()
            ->with([
                'vehicle:id,name,plate_number',
                'driver:id,name',
                'partner:id,code,name',
            ])
            ->whereIn('status', [Trip::STATUS_SCHEDULED, Trip::STATUS_IN_PROGRESS])
            ->orderByRaw("case when status = 'in_progress' then 0 else 1 end")
            ->orderBy('scheduled_at')
            ->limit($recentLimit)
            ->get([
                'id',
                'code',
                'vehicle_id',
                'driver_id',
                'partner_id',
                'origin',
                'destination',
                'status',
                'scheduled_at',
                'scheduled_end_at',
                'distance_km',
            ])
            ->map(function (Trip $trip) use ($now): array {
                $isOverdue = $trip->status === Trip::STATUS_SCHEDULED
                    && (
                        ($trip->scheduled_at !== null && $trip->scheduled_at->lessThan($now))
                        || ($trip->scheduled_end_at !== null && $trip->scheduled_end_at->lessThan($now))
                    );

                return [
                    'id' => $trip->id,
                    'code' => $trip->code,
                    'status' => $trip->status,
                    'origin' => $trip->origin,
                    'destination' => $trip->destination,
                    'scheduled_at' => $trip->scheduled_at?->toIso8601String(),
                    'distance_km' => $trip->distance_km !== null ? (float) $trip->distance_km : null,
                    'is_overdue' => $isOverdue,
                    'vehicle' => $trip->vehicle
                        ? [
                            'id' => $trip->vehicle->id,
                            'name' => $trip->vehicle->name,
                            'plate_number' => $trip->vehicle->plate_number,
                        ]
                        : null,
                    'driver' => $trip->driver
                        ? [
                            'id' => $trip->driver->id,
                            'name' => $trip->driver->name,
                        ]
                        : null,
                    'partner' => $trip->partner
                        ? [
                            'id' => $trip->partner->id,
                            'code' => $trip->partner->code,
                            'name' => $trip->partner->name,
                        ]
                        : null,
                ];
            })
            ->all();

        $attention = $overdueCount + $inProgressCount;

        return [
            'summary' => [
                'open_pipeline' => $openPipeline,
                'scheduled' => $scheduledCount,
                'in_progress' => $inProgressCount,
                'scheduled_today' => $scheduledToday,
                'completed_this_month' => $completedThisMonth,
                'distance_this_month' => round($distanceThisMonth, 2),
            ],
            'dispatch' => [
                'overdue_count' => $overdueCount,
                'pending_stops' => $pendingStops,
            ],
            'schedules' => [
                'active' => $activeSchedules,
                'total' => $schedulesTotal,
            ],
            'by_status' => [
                'scheduled' => $scheduledCount,
                'in_progress' => $inProgressCount,
                'completed' => $completedCount,
                'cancelled' => $cancelledCount,
            ],
            'alerts' => [
                'attention' => $attention,
            ],
            'recent' => $recent,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyBoard(): array
    {
        return [
            'summary' => [
                'open_pipeline' => 0,
                'scheduled' => 0,
                'in_progress' => 0,
                'scheduled_today' => 0,
                'completed_this_month' => 0,
                'distance_this_month' => 0.0,
            ],
            'dispatch' => [
                'overdue_count' => 0,
                'pending_stops' => 0,
            ],
            'schedules' => [
                'active' => 0,
                'total' => 0,
            ],
            'by_status' => [
                'scheduled' => 0,
                'in_progress' => 0,
                'completed' => 0,
                'cancelled' => 0,
            ],
            'alerts' => [
                'attention' => 0,
            ],
            'recent' => [],
        ];
    }
}
