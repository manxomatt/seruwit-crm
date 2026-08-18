<?php

namespace App\Support;

/**
 * Geographic maths shared by Tracking (odometer accumulation, geofencing) and
 * Transportation (trip distance from its GPS trail). It lives in core rather
 * than in either module for the same reason the money formatter does: two
 * modules in different tiers need it, and a Vertical reaching sideways into a
 * Foundation module's helper — or keeping its own copy of it — is worse than
 * either owning it here.
 */
class Geo
{
    /**
     * Mean Earth radius in metres (WGS-84 mean). Haversine on a sphere is good
     * to roughly 0.5% over the distances a vehicle covers between two fixes,
     * which is well inside GPS noise.
     */
    private const EARTH_RADIUS_M = 6_371_008.8;

    /**
     * Great-circle distance between two points, in metres.
     */
    public static function distanceMetres(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);

        $a = sin($latDelta / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($lngDelta / 2) ** 2;

        return self::EARTH_RADIUS_M * 2 * asin(min(1.0, sqrt($a)));
    }

    /**
     * Whether a point falls inside a circle of $radiusMetres around a centre.
     */
    public static function isWithin(float $lat, float $lng, float $centreLat, float $centreLng, float $radiusMetres): bool
    {
        return self::distanceMetres($lat, $lng, $centreLat, $centreLng) <= $radiusMetres;
    }

    /**
     * Whether a point ($lat, $lng) is inside an arbitrary closed polygon using
     * Ray-Casting algorithm (Jordan Curve Theorem).
     *
     * @param  array<int, array<int|string, float|int|string>>  $polygon  Array of [lat, lng] points
     */
    public static function isInsidePolygon(float $lat, float $lng, array $polygon): bool
    {
        $n = count($polygon);
        if ($n < 3) {
            return false;
        }

        $inside = false;
        for ($i = 0, $j = $n - 1; $i < $n; $j = $i++) {
            $p1 = $polygon[$i];
            $p2 = $polygon[$j];

            $lat1 = (float) (is_array($p1) ? ($p1[0] ?? $p1['lat'] ?? 0) : 0);
            $lng1 = (float) (is_array($p1) ? ($p1[1] ?? $p1['lng'] ?? 0) : 0);
            $lat2 = (float) (is_array($p2) ? ($p2[0] ?? $p2['lat'] ?? 0) : 0);
            $lng2 = (float) (is_array($p2) ? ($p2[1] ?? $p2['lng'] ?? 0) : 0);

            $intersect = (($lng1 > $lng) !== ($lng2 > $lng))
                && ($lat < ($lat2 - $lat1) * ($lng - $lng1) / (($lng2 - $lng1) ?: 1e-12) + $lat1);

            if ($intersect) {
                $inside = ! $inside;
            }
        }

        return $inside;
    }

    /**
     * Calculate centroid (geometric center) of a polygon for map centering.
     *
     * @param  array<int, array<int|string, float|int|string>>  $polygon
     * @return array{lat: float, lng: float}
     */
    public static function polygonCentroid(array $polygon): array
    {
        $n = count($polygon);
        if ($n === 0) {
            return ['lat' => 0.0, 'lng' => 0.0];
        }

        $sumLat = 0.0;
        $sumLng = 0.0;

        foreach ($polygon as $pt) {
            $sumLat += (float) (is_array($pt) ? ($pt[0] ?? $pt['lat'] ?? 0) : 0);
            $sumLng += (float) (is_array($pt) ? ($pt[1] ?? $pt['lng'] ?? 0) : 0);
        }

        return [
            'lat' => round($sumLat / $n, 7),
            'lng' => round($sumLng / $n, 7),
        ];
    }
}
