<?php

namespace Modules\DriverScoring\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Modules\DriverScoring\Models\DriverDailyScore;
use Modules\DriverScoring\Models\DriverScoringSetting;
use Modules\DriverScoring\Models\DrivingEvent;

final class DriverScoreAggregator
{
    public function applyEvent(DrivingEvent $event, DriverScoringSetting $settings): ?DriverDailyScore
    {
        if ($event->driver_id === null) {
            return null;
        }

        $date = $event->recorded_at->toDateString();

        $score = DriverDailyScore::query()->firstOrCreate(
            [
                'driver_id' => $event->driver_id,
                'score_date' => $date,
            ],
            [
                'score' => (int) $settings->daily_base_points,
                'harsh_brake_count' => 0,
                'harsh_accel_count' => 0,
                'speeding_count' => 0,
                'idle_count' => 0,
                'points_delta' => 0,
                'event_count' => 0,
            ],
        );

        $column = match ($event->type) {
            DrivingEvent::TYPE_HARSH_BRAKE => 'harsh_brake_count',
            DrivingEvent::TYPE_HARSH_ACCEL => 'harsh_accel_count',
            DrivingEvent::TYPE_SPEEDING => 'speeding_count',
            DrivingEvent::TYPE_IDLE => 'idle_count',
            default => null,
        };

        if ($column) {
            $score->{$column} = (int) $score->{$column} + 1;
        }

        $score->points_delta = (int) $score->points_delta + (int) $event->points_delta;
        $score->event_count = (int) $score->event_count + 1;
        $score->score = max(
            (int) config('scoring.points.min', 0),
            min(
                (int) config('scoring.points.max', 100),
                (int) $settings->daily_base_points + (int) $score->points_delta,
            ),
        );
        $score->save();

        return $score;
    }

    /**
     * @return list<array{driver_id: int, average_score: float, scored_days: int, event_count: int, harsh_brake_count: int, speeding_count: int, idle_count: int}>
     */
    public function leaderboard(Carbon|string $from, Carbon|string $to, int $limit = 50): array
    {
        return $this->leaderboardQuery($from, $to)
            ->limit($limit)
            ->get()
            ->map(fn (DriverDailyScore $row): array => $this->mapLeaderboardRow($row))
            ->all();
    }

    /**
     * @return LengthAwarePaginator<int, array{driver_id: int, average_score: float, scored_days: int, event_count: int, harsh_brake_count: int, speeding_count: int, idle_count: int}>
     */
    public function paginatedLeaderboard(Carbon|string $from, Carbon|string $to, int $perPage = 15): LengthAwarePaginator
    {
        return $this->leaderboardQuery($from, $to)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (DriverDailyScore $row): array => $this->mapLeaderboardRow($row));
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<DriverDailyScore>
     */
    private function leaderboardQuery(Carbon|string $from, Carbon|string $to)
    {
        return DriverDailyScore::query()
            ->selectRaw('driver_id, avg(score) as average_score, count(*) as scored_days, sum(event_count) as event_count, sum(harsh_brake_count) as harsh_brake_count, sum(speeding_count) as speeding_count, sum(idle_count) as idle_count')
            ->whereBetween('score_date', [$from, $to])
            ->groupBy('driver_id')
            ->orderByDesc('average_score')
            ->orderByDesc('scored_days');
    }

    /**
     * @return array{driver_id: int, average_score: float, scored_days: int, event_count: int, harsh_brake_count: int, speeding_count: int, idle_count: int}
     */
    private function mapLeaderboardRow(DriverDailyScore $row): array
    {
        return [
            'driver_id' => (int) $row->driver_id,
            'average_score' => round((float) $row->average_score, 2),
            'scored_days' => (int) $row->scored_days,
            'event_count' => (int) $row->event_count,
            'harsh_brake_count' => (int) $row->harsh_brake_count,
            'speeding_count' => (int) $row->speeding_count,
            'idle_count' => (int) $row->idle_count,
        ];
    }
}
