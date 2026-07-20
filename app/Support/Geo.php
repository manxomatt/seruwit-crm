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
}
