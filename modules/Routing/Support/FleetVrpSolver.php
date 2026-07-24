<?php

namespace Modules\Routing\Support;

/**
 * Heterogeneous-fleet VRP: assign stops to vehicles (and later drivers)
 * while honouring capacity and minimizing distance × cost_per_km.
 *
 * Strategy: order vehicles by effective cost, then fill each with nearest-
 * neighbour insertion from the depot until capacity is exhausted.
 *
 * @phpstan-type Stop array{id: int|string, lat: float, lng: float, demand: float, address: string}
 * @phpstan-type VehicleInput array{id: int, capacity_kg: float|null, cost_per_km: float|null}
 * @phpstan-type BuiltRoute array{
 *     vehicle_id: int,
 *     stop_ids: list<int|string>,
 *     load: float,
 *     distance_km: float,
 *     cost: float,
 *     leg_distances: list<float>
 * }
 */
final class FleetVrpSolver
{
    /**
     * @param  list<Stop>  $stops
     * @param  list<VehicleInput>  $vehicles
     * @return array{routes: list<BuiltRoute>, unassigned_ids: list<int|string>}
     */
    public function solve(
        float $depotLat,
        float $depotLng,
        array $stops,
        array $vehicles,
        string $objective = 'fuel_cost',
    ): array {
        if ($stops === [] || $vehicles === []) {
            return [
                'routes' => [],
                'unassigned_ids' => array_map(fn (array $s) => $s['id'], $stops),
            ];
        }

        $remaining = [];
        foreach ($stops as $stop) {
            $remaining[(string) $stop['id']] = $stop;
        }

        $orderedVehicles = $vehicles;
        usort($orderedVehicles, function (array $a, array $b) use ($objective): int {
            if ($objective === 'distance') {
                $capA = $a['capacity_kg'] ?? PHP_FLOAT_MAX;
                $capB = $b['capacity_kg'] ?? PHP_FLOAT_MAX;

                return $capB <=> $capA;
            }

            $costA = $a['cost_per_km'] ?? 999999.0;
            $costB = $b['cost_per_km'] ?? 999999.0;

            return $costA <=> $costB;
        });

        $routes = [];

        foreach ($orderedVehicles as $vehicle) {
            if ($remaining === []) {
                break;
            }

            $capacity = $vehicle['capacity_kg'];
            $built = $this->buildRouteForVehicle(
                $depotLat,
                $depotLng,
                $remaining,
                $capacity,
                (float) ($vehicle['cost_per_km'] ?? 0),
            );

            if ($built['stop_ids'] === []) {
                continue;
            }

            foreach ($built['stop_ids'] as $sid) {
                unset($remaining[(string) $sid]);
            }

            $routes[] = [
                'vehicle_id' => $vehicle['id'],
                'stop_ids' => $built['stop_ids'],
                'load' => $built['load'],
                'distance_km' => $built['distance_km'],
                'cost' => $built['cost'],
                'leg_distances' => $built['leg_distances'],
            ];
        }

        // Homogeneous fallback: pack leftover stops with Clarke–Wright using the
        // largest remaining vehicle capacity, without assigning a vehicle yet.
        if ($remaining !== [] && $vehicles !== []) {
            $maxCap = 0.0;
            foreach ($vehicles as $vehicle) {
                $cap = $vehicle['capacity_kg'] ?? PHP_FLOAT_MAX;
                $maxCap = max($maxCap, is_finite($cap) ? $cap : 0.0);
            }
            if ($maxCap <= 0) {
                $maxCap = PHP_FLOAT_MAX;
            }

            $cw = (new ClarkeWrightSolver)->solve(
                $depotLat,
                $depotLng,
                array_values($remaining),
                $maxCap,
                max(1, count($vehicles)),
            );

            $usedVehicleIds = array_column($routes, 'vehicle_id');
            $freeVehicles = array_values(array_filter(
                $orderedVehicles,
                fn (array $v): bool => ! in_array($v['id'], $usedVehicleIds, true),
            ));

            foreach ($cw as $pack) {
                $vehicle = array_shift($freeVehicles);
                if ($vehicle === null) {
                    break;
                }

                $capacity = $vehicle['capacity_kg'] ?? PHP_FLOAT_MAX;
                if ($pack['load'] > $capacity + 1e-6) {
                    array_unshift($freeVehicles, $vehicle);

                    continue;
                }

                $costPerKm = (float) ($vehicle['cost_per_km'] ?? 0);
                $legs = $this->legDistances($depotLat, $depotLng, $pack['stop_ids'], $this->indexStops($stops));

                $routes[] = [
                    'vehicle_id' => $vehicle['id'],
                    'stop_ids' => $pack['stop_ids'],
                    'load' => $pack['load'],
                    'distance_km' => $pack['distance_km'],
                    'cost' => round($pack['distance_km'] * $costPerKm, 2),
                    'leg_distances' => $legs,
                ];

                foreach ($pack['stop_ids'] as $sid) {
                    unset($remaining[(string) $sid]);
                }
            }
        }

        return [
            'routes' => $routes,
            'unassigned_ids' => array_map(fn (array $s) => $s['id'], array_values($remaining)),
        ];
    }

    /**
     * @param  array<string, Stop>  $remaining
     * @return array{stop_ids: list<int|string>, load: float, distance_km: float, cost: float, leg_distances: list<float>}
     */
    private function buildRouteForVehicle(
        float $depotLat,
        float $depotLng,
        array $remaining,
        ?float $capacity,
        float $costPerKm,
    ): array {
        $cap = $capacity ?? PHP_FLOAT_MAX;
        $stopIds = [];
        $legDistances = [];
        $load = 0.0;
        $distance = 0.0;
        $lat = $depotLat;
        $lng = $depotLng;
        $pool = $remaining;

        while ($pool !== []) {
            $bestId = null;
            $bestDist = PHP_FLOAT_MAX;

            foreach ($pool as $id => $stop) {
                $demand = (float) $stop['demand'];
                if ($load + $demand > $cap + 1e-6) {
                    continue;
                }
                $d = Haversine::distanceKm($lat, $lng, (float) $stop['lat'], (float) $stop['lng']);
                if ($d < $bestDist) {
                    $bestDist = $d;
                    $bestId = $id;
                }
            }

            if ($bestId === null) {
                break;
            }

            $stop = $pool[$bestId];
            $stopIds[] = $stop['id'];
            $legDistances[] = round($bestDist, 2);
            $distance += $bestDist;
            $load += (float) $stop['demand'];
            $lat = (float) $stop['lat'];
            $lng = (float) $stop['lng'];
            unset($pool[$bestId]);
        }

        if ($stopIds === []) {
            return [
                'stop_ids' => [],
                'load' => 0.0,
                'distance_km' => 0.0,
                'cost' => 0.0,
                'leg_distances' => [],
            ];
        }

        $returnLeg = Haversine::distanceKm($lat, $lng, $depotLat, $depotLng);
        $legDistances[] = round($returnLeg, 2);
        $distance += $returnLeg;

        return [
            'stop_ids' => $stopIds,
            'load' => round($load, 2),
            'distance_km' => round($distance, 2),
            'cost' => round($distance * $costPerKm, 2),
            'leg_distances' => $legDistances,
        ];
    }

    /**
     * @param  list<int|string>  $stopIds
     * @param  array<string, Stop>  $indexed
     * @return list<float>
     */
    private function legDistances(float $depotLat, float $depotLng, array $stopIds, array $indexed): array
    {
        $legs = [];
        $lat = $depotLat;
        $lng = $depotLng;

        foreach ($stopIds as $id) {
            $stop = $indexed[(string) $id];
            $legs[] = round(Haversine::distanceKm($lat, $lng, (float) $stop['lat'], (float) $stop['lng']), 2);
            $lat = (float) $stop['lat'];
            $lng = (float) $stop['lng'];
        }

        $legs[] = round(Haversine::distanceKm($lat, $lng, $depotLat, $depotLng), 2);

        return $legs;
    }

    /**
     * @param  list<Stop>  $stops
     * @return array<string, Stop>
     */
    private function indexStops(array $stops): array
    {
        $indexed = [];
        foreach ($stops as $stop) {
            $indexed[(string) $stop['id']] = $stop;
        }

        return $indexed;
    }
}
