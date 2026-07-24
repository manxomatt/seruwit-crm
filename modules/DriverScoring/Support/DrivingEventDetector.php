<?php

namespace Modules\DriverScoring\Support;

use Carbon\CarbonImmutable;
use Modules\DriverScoring\Models\DriverScoringSetting;
use Modules\DriverScoring\Models\DrivingEvent;
use Modules\Tracking\Support\PositionPayload;

/**
 * Detects harsh brake / accel, speeding, and idle from consecutive GPS fixes.
 *
 * @phpstan-type DetectedEvent array{
 *     type: string,
 *     severity: string,
 *     magnitude: float|null,
 *     speed_kph: float|null,
 *     latitude: float|null,
 *     longitude: float|null,
 *     recorded_at: CarbonImmutable,
 *     ended_at: CarbonImmutable|null,
 *     points_delta: int,
 *     meta: array<string, mixed>
 * }
 */
final class DrivingEventDetector
{
    /**
     * @param  list<PositionPayload>  $positions  oldest first
     * @return list<DetectedEvent>
     */
    public function detect(array $positions, DriverScoringSetting $settings, ?PositionPayload $previous = null): array
    {
        if ($positions === []) {
            return [];
        }

        $events = [];
        $prev = $previous;
        $idleStartedAt = null;
        $speedingStartedAt = null;
        $maxSpeeding = 0.0;

        foreach ($positions as $current) {
            if ($prev !== null) {
                $deltaSeconds = (int) abs($prev->recordedAt->diffInSeconds($current->recordedAt));

                if ($deltaSeconds >= $settings->min_sample_seconds
                    && $deltaSeconds <= $settings->max_sample_seconds
                    && $deltaSeconds > 0) {
                    $deltaV = $current->speedKph - $prev->speedKph;
                    $accel = $deltaV / $deltaSeconds;

                    if ($accel <= -1 * (float) $settings->harsh_brake_kph_per_s) {
                        $events[] = $this->instant(
                            DrivingEvent::TYPE_HARSH_BRAKE,
                            abs($accel),
                            $current,
                            (int) $settings->points_harsh_brake,
                            ['delta_v' => round($deltaV, 2), 'delta_s' => $deltaSeconds],
                        );
                    } elseif ($accel >= (float) $settings->harsh_accel_kph_per_s) {
                        $events[] = $this->instant(
                            DrivingEvent::TYPE_HARSH_ACCEL,
                            abs($accel),
                            $current,
                            (int) $settings->points_harsh_accel,
                            ['delta_v' => round($deltaV, 2), 'delta_s' => $deltaSeconds],
                        );
                    }
                }
            }

            $isIdle = $current->speedKph <= (float) $settings->idle_speed_kph
                && ($current->ignition === null || $current->ignition === true);

            if ($isIdle) {
                $idleStartedAt ??= $current->recordedAt;
            } elseif ($idleStartedAt !== null) {
                $idleMinutes = $idleStartedAt->diffInMinutes($current->recordedAt);
                if ($idleMinutes >= (int) $settings->idle_minutes) {
                    $events[] = $this->span(
                        DrivingEvent::TYPE_IDLE,
                        (float) $idleMinutes,
                        $idleStartedAt,
                        $current,
                        (int) $settings->points_idle,
                        ['idle_minutes' => $idleMinutes],
                    );
                }
                $idleStartedAt = null;
            }

            $isSpeeding = $current->speedKph > (float) $settings->speeding_limit_kph;
            if ($isSpeeding) {
                $speedingStartedAt ??= $current->recordedAt;
                $maxSpeeding = max($maxSpeeding, $current->speedKph);
            } elseif ($speedingStartedAt !== null) {
                $events[] = $this->span(
                    DrivingEvent::TYPE_SPEEDING,
                    $maxSpeeding,
                    $speedingStartedAt,
                    $current,
                    (int) $settings->points_speeding,
                    [
                        'limit_kph' => (float) $settings->speeding_limit_kph,
                        'peak_kph' => round($maxSpeeding, 2),
                    ],
                );
                $speedingStartedAt = null;
                $maxSpeeding = 0.0;
            }

            $prev = $current;
        }

        $last = end($positions);
        if ($idleStartedAt !== null && $last instanceof PositionPayload) {
            $idleMinutes = $idleStartedAt->diffInMinutes($last->recordedAt);
            if ($idleMinutes >= (int) $settings->idle_minutes) {
                $events[] = $this->span(
                    DrivingEvent::TYPE_IDLE,
                    (float) $idleMinutes,
                    $idleStartedAt,
                    $last,
                    (int) $settings->points_idle,
                    ['idle_minutes' => $idleMinutes, 'open' => true],
                );
            }
        }

        if ($speedingStartedAt !== null && $last instanceof PositionPayload) {
            $events[] = $this->span(
                DrivingEvent::TYPE_SPEEDING,
                $maxSpeeding,
                $speedingStartedAt,
                $last,
                (int) $settings->points_speeding,
                [
                    'limit_kph' => (float) $settings->speeding_limit_kph,
                    'peak_kph' => round($maxSpeeding, 2),
                    'open' => true,
                ],
            );
        }

        return $events;
    }

    /**
     * @param  array<string, mixed>  $meta
     * @return DetectedEvent
     */
    private function instant(string $type, float $magnitude, PositionPayload $at, int $points, array $meta): array
    {
        return [
            'type' => $type,
            'severity' => 'warning',
            'magnitude' => round($magnitude, 2),
            'speed_kph' => round($at->speedKph, 2),
            'latitude' => $at->latitude,
            'longitude' => $at->longitude,
            'recorded_at' => $at->recordedAt,
            'ended_at' => null,
            'points_delta' => $points,
            'meta' => $meta,
        ];
    }

    /**
     * @param  array<string, mixed>  $meta
     * @return DetectedEvent
     */
    private function span(
        string $type,
        float $magnitude,
        CarbonImmutable $startedAt,
        PositionPayload $end,
        int $points,
        array $meta,
    ): array {
        return [
            'type' => $type,
            'severity' => $type === DrivingEvent::TYPE_SPEEDING ? 'critical' : 'warning',
            'magnitude' => round($magnitude, 2),
            'speed_kph' => round($end->speedKph, 2),
            'latitude' => $end->latitude,
            'longitude' => $end->longitude,
            'recorded_at' => $startedAt,
            'ended_at' => $end->recordedAt,
            'points_delta' => $points,
            'meta' => $meta,
        ];
    }
}
