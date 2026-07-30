<?php

namespace Modules\Shuttle\Support;

/**
 * Open-path nearest-neighbour sequencing for shuttle pickup/dropoff legs.
 *
 * @phpstan-type Stop array{key: string, lat: float, lng: float, address: string, booking_id: int|null, stop_type: string}
 */
final class NearestNeighbourSequencer
{
    /**
     * @param  list<Stop>  $stops
     * @return list<Stop>
     */
    public function sequence(float $startLat, float $startLng, array $stops): array
    {
        if ($stops === []) {
            return [];
        }

        $remaining = $stops;
        $ordered = [];
        $lat = $startLat;
        $lng = $startLng;

        while ($remaining !== []) {
            $bestIndex = 0;
            $bestDistance = PHP_FLOAT_MAX;

            foreach ($remaining as $index => $stop) {
                $distance = Haversine::distanceKm($lat, $lng, $stop['lat'], $stop['lng']);
                if ($distance < $bestDistance) {
                    $bestDistance = $distance;
                    $bestIndex = $index;
                }
            }

            $next = $remaining[$bestIndex];
            $ordered[] = $next;
            $lat = $next['lat'];
            $lng = $next['lng'];
            array_splice($remaining, $bestIndex, 1);
        }

        return $ordered;
    }
}
