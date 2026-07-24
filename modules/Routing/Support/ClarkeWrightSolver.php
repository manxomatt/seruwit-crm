<?php

namespace Modules\Routing\Support;

/**
 * Capacitated vehicle routing via the Clarke–Wright savings heuristic.
 *
 * Input stops must already have coordinates. Capacity is in the same unit as
 * each stop's demand (kg). Returns ordered routes that start/end at the depot;
 * vehicle/driver assignment is left to the caller.
 *
 * @phpstan-type Stop array{id: int|string, lat: float, lng: float, demand: float, address?: string}
 * @phpstan-type Route array{stop_ids: list<int|string>, load: float, distance_km: float}
 */
final class ClarkeWrightSolver
{
    /**
     * @param  list<Stop>  $stops
     * @return list<Route>
     */
    public function solve(
        float $depotLat,
        float $depotLng,
        array $stops,
        float $vehicleCapacity,
        int $maxVehicles = 50,
    ): array {
        if ($stops === []) {
            return [];
        }

        $indexed = [];
        foreach ($stops as $stop) {
            $indexed[(string) $stop['id']] = $stop;
        }

        $ids = array_keys($indexed);

        /** @var array<string, float> $depotDist */
        $depotDist = [];
        foreach ($ids as $id) {
            $stop = $indexed[$id];
            $depotDist[$id] = Haversine::distanceKm($depotLat, $depotLng, (float) $stop['lat'], (float) $stop['lng']);
        }

        /** @var list<array{i: string, j: string, saving: float}> $savings */
        $savings = [];
        $count = count($ids);
        for ($a = 0; $a < $count; $a++) {
            for ($b = $a + 1; $b < $count; $b++) {
                $i = $ids[$a];
                $j = $ids[$b];
                $dij = Haversine::distanceKm(
                    (float) $indexed[$i]['lat'],
                    (float) $indexed[$i]['lng'],
                    (float) $indexed[$j]['lat'],
                    (float) $indexed[$j]['lng'],
                );
                $saving = $depotDist[$i] + $depotDist[$j] - $dij;
                if ($saving > 0) {
                    $savings[] = ['i' => $i, 'j' => $j, 'saving' => $saving];
                }
            }
        }

        usort($savings, fn (array $x, array $y): int => $y['saving'] <=> $x['saving']);

        /** @var array<string, list<string>> $routes  routeKey => ordered stop ids */
        $routes = [];
        /** @var array<string, string> $membership  stopId => routeKey */
        $membership = [];
        /** @var array<string, float> $loads */
        $loads = [];

        foreach ($ids as $id) {
            $key = 'r:'.$id;
            $routes[$key] = [$id];
            $membership[$id] = $key;
            $loads[$key] = (float) $indexed[$id]['demand'];
        }

        foreach ($savings as $pair) {
            $i = $pair['i'];
            $j = $pair['j'];
            $ri = $membership[$i] ?? null;
            $rj = $membership[$j] ?? null;

            if ($ri === null || $rj === null || $ri === $rj) {
                continue;
            }

            $routeI = $routes[$ri];
            $routeJ = $routes[$rj];

            $iIsEnd = $routeI[0] === $i || $routeI[array_key_last($routeI)] === $i;
            $jIsEnd = $routeJ[0] === $j || $routeJ[array_key_last($routeJ)] === $j;

            if (! $iIsEnd || ! $jIsEnd) {
                continue;
            }

            $mergedLoad = $loads[$ri] + $loads[$rj];
            if ($mergedLoad > $vehicleCapacity + 1e-6) {
                continue;
            }

            $merged = $this->mergeAtEnds($routeI, $i, $routeJ, $j);
            if ($merged === null) {
                continue;
            }

            unset($routes[$ri], $routes[$rj], $loads[$ri], $loads[$rj]);
            $newKey = $ri;
            $routes[$newKey] = $merged;
            $loads[$newKey] = $mergedLoad;

            foreach ($merged as $stopId) {
                $membership[$stopId] = $newKey;
            }
        }

        $result = [];
        foreach ($routes as $key => $stopIds) {
            $distance = $this->routeDistanceKm($depotLat, $depotLng, $stopIds, $indexed);
            $result[] = [
                'stop_ids' => array_values($stopIds),
                'load' => round($loads[$key], 2),
                'distance_km' => round($distance, 2),
            ];
        }

        usort($result, fn (array $a, array $b): int => $b['distance_km'] <=> $a['distance_km']);

        if (count($result) > $maxVehicles) {
            // Keep the densest routes; remaining stops become single-stop leftovers
            // handled by splitting oversized set into capacity-feasible singles.
            $kept = array_slice($result, 0, $maxVehicles);
            $overflowIds = [];
            foreach (array_slice($result, $maxVehicles) as $overflow) {
                foreach ($overflow['stop_ids'] as $sid) {
                    $overflowIds[] = $sid;
                }
            }
            $result = $kept;
            foreach ($overflowIds as $sid) {
                $demand = (float) $indexed[$sid]['demand'];
                if ($demand > $vehicleCapacity + 1e-6) {
                    continue;
                }
                $result[] = [
                    'stop_ids' => [$sid],
                    'load' => round($demand, 2),
                    'distance_km' => round(2 * $depotDist[$sid], 2),
                ];
            }
        }

        return array_values($result);
    }

    /**
     * @param  list<string>  $routeI
     * @param  list<string>  $routeJ
     * @return list<string>|null
     */
    private function mergeAtEnds(array $routeI, string $i, array $routeJ, string $j): ?array
    {
        if ($routeI[array_key_last($routeI)] === $i && $routeJ[0] === $j) {
            return array_merge($routeI, $routeJ);
        }
        if ($routeI[array_key_last($routeI)] === $i && $routeJ[array_key_last($routeJ)] === $j) {
            return array_merge($routeI, array_reverse($routeJ));
        }
        if ($routeI[0] === $i && $routeJ[array_key_last($routeJ)] === $j) {
            return array_merge($routeJ, $routeI);
        }
        if ($routeI[0] === $i && $routeJ[0] === $j) {
            return array_merge(array_reverse($routeJ), $routeI);
        }

        return null;
    }

    /**
     * @param  list<string>  $stopIds
     * @param  array<string, Stop>  $indexed
     */
    private function routeDistanceKm(float $depotLat, float $depotLng, array $stopIds, array $indexed): float
    {
        $distance = 0.0;
        $prevLat = $depotLat;
        $prevLng = $depotLng;

        foreach ($stopIds as $id) {
            $stop = $indexed[$id];
            $distance += Haversine::distanceKm($prevLat, $prevLng, (float) $stop['lat'], (float) $stop['lng']);
            $prevLat = (float) $stop['lat'];
            $prevLng = (float) $stop['lng'];
        }

        $distance += Haversine::distanceKm($prevLat, $prevLng, $depotLat, $depotLng);

        return $distance;
    }
}
