<?php

namespace Modules\TransportationManagement\Support;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Thin client for OSRM's driving directions API.
 *
 * The browser talks to our own /transportation/directions endpoint; this class
 * is the only place that reaches the external OSRM host (public demo by default,
 * or a self-hosted instance via OSRM_URL).
 */
final class OsrmRouter
{
    /**
     * @param  list<array{0: float, 1: float}>  $waypoints  [lat, lng] pairs
     * @return list<array{0: float, 1: float}> road geometry as [lat, lng]
     */
    public function drivingRoute(array $waypoints): array
    {
        if (count($waypoints) < 2) {
            return [];
        }

        $coords = collect($waypoints)
            ->map(fn (array $point): string => $point[1].','.$point[0])
            ->implode(';');

        $baseUrl = rtrim((string) config('services.osrm.base_url', 'https://router.project-osrm.org'), '/');
        $url = "{$baseUrl}/route/v1/driving/{$coords}";

        $response = Http::acceptJson()
            ->timeout((int) config('services.osrm.timeout', 12))
            ->get($url, [
                'overview' => 'full',
                'geometries' => 'geojson',
            ]);

        if (! $response->successful()) {
            throw new RuntimeException(__('transportation.messages.directions_failed'));
        }

        if ($response->json('code') !== 'Ok') {
            throw new RuntimeException(__('transportation.messages.directions_failed'));
        }

        /** @var list<array{0: float|int, 1: float|int}> $coordinates */
        $coordinates = $response->json('routes.0.geometry.coordinates') ?? [];

        if ($coordinates === []) {
            throw new RuntimeException(__('transportation.messages.directions_failed'));
        }

        return array_map(
            fn (array $pair): array => [(float) $pair[1], (float) $pair[0]],
            $coordinates,
        );
    }
}
