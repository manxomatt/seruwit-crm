<?php

namespace Modules\Fleet\Support;

use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;

/**
 * Flags suspicious fuel fills (tank overfill, odometer regression, efficiency drop).
 */
final class FuelAnomalyDetector
{
    public function __construct(private readonly FuelConsumptionCalculator $calculator) {}

    /**
     * @param  array{distance_since_last_km: int|null, km_per_liter: float|null, liters_per_100km: float|null, previous: FuelLog|null}  $consumption
     * @return list<array{code: string, message: string, severity: string}>
     */
    public function detect(Vehicle $vehicle, FuelLog $fill, array $consumption): array
    {
        $flags = [];

        if ($vehicle->tank_capacity_liters !== null && (float) $fill->liters > (float) $vehicle->tank_capacity_liters + 0.01) {
            $flags[] = [
                'code' => 'over_capacity',
                'severity' => 'warning',
                'message' => sprintf(
                    'Fill of %s L exceeds tank capacity (%s L).',
                    $fill->liters,
                    $vehicle->tank_capacity_liters,
                ),
            ];
        }

        $previous = $consumption['previous'];
        if ($previous && $fill->odometer_km !== null && $previous->odometer_km !== null) {
            if ((int) $fill->odometer_km < (int) $previous->odometer_km) {
                $flags[] = [
                    'code' => 'odometer_regression',
                    'severity' => 'critical',
                    'message' => sprintf(
                        'Odometer %s km is below previous fill (%s km).',
                        number_format((int) $fill->odometer_km),
                        number_format((int) $previous->odometer_km),
                    ),
                ];
            } elseif ((int) $fill->odometer_km === (int) $previous->odometer_km) {
                $flags[] = [
                    'code' => 'no_odometer_increase',
                    'severity' => 'warning',
                    'message' => 'Odometer did not increase since the previous fill.',
                ];
            }
        }

        $kmPerLiter = $consumption['km_per_liter'];
        $distance = $consumption['distance_since_last_km'];
        $minDistance = (int) config('fleet.fuel.min_distance_km_for_efficiency', 20);

        if ($kmPerLiter !== null && $distance !== null && $distance >= $minDistance) {
            $baseline = $vehicle->expected_km_per_liter !== null
                ? (float) $vehicle->expected_km_per_liter
                : $this->calculator->recentAverageKmPerLiter($vehicle);

            $ratio = (float) config('fleet.fuel.efficiency_drop_ratio', 0.65);

            if ($baseline !== null && $baseline > 0 && $kmPerLiter < $baseline * $ratio) {
                $flags[] = [
                    'code' => 'efficiency_drop',
                    'severity' => 'warning',
                    'message' => sprintf(
                        'Efficiency %.2f km/L is below %.0f%% of baseline %.2f km/L.',
                        $kmPerLiter,
                        $ratio * 100,
                        $baseline,
                    ),
                ];
            }
        }

        return $flags;
    }
}
