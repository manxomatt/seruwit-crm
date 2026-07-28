<?php

namespace Modules\Tracking\Support;

use Illuminate\Support\Collection;
use Modules\Tracking\Models\VehiclePosition;

class PositionTrail
{
    /**
     * Thin a trail to at most $limit points (keep first/last).
     *
     * @param  Collection<int, VehiclePosition>  $positions
     * @return Collection<int, VehiclePosition>
     */
    public static function thin(Collection $positions, int $limit = 500): Collection
    {
        if ($positions->count() <= $limit) {
            return $positions->values();
        }

        $step = (int) ceil($positions->count() / $limit);

        return $positions
            ->values()
            ->filter(fn ($position, $index) => $index % $step === 0 || $index === $positions->count() - 1)
            ->values();
    }

    /**
     * Approximate GPS kilometres from ordered positions (prefer provider total_distance_m delta).
     *
     * @param  Collection<int, VehiclePosition>  $positions
     */
    public static function distanceKm(Collection $positions): float
    {
        if ($positions->count() < 2) {
            return 0.0;
        }

        $first = $positions->first();
        $last = $positions->last();

        if ($first->total_distance_m !== null && $last->total_distance_m !== null) {
            $delta = (int) $last->total_distance_m - (int) $first->total_distance_m;

            if ($delta >= 0) {
                return round($delta / 1000, 2);
            }
        }

        $metres = 0.0;
        $previous = null;

        foreach ($positions as $position) {
            if ($previous !== null) {
                $metres += \App\Support\Geo::distanceMetres(
                    (float) $previous->latitude,
                    (float) $previous->longitude,
                    (float) $position->latitude,
                    (float) $position->longitude,
                );
            }

            $previous = $position;
        }

        return round($metres / 1000, 2);
    }
}
