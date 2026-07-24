<?php

namespace Modules\TransportationManagement\Support;

use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Support\FuelConsumptionCalculator;
use Modules\TransportationManagement\Models\Trip;

/**
 * Estimates fuel used on a trip from Fleet efficiency metrics and trip distance.
 *
 * Transportation owns the trip window; Fleet owns fills — no trip_id on fuel_logs.
 */
class TripFuelAttribution
{
    public function __construct(private readonly FuelConsumptionCalculator $calculator) {}

    /**
     * @return array{
     *     distance_km: float|null,
     *     estimated_liters: float|null,
     *     estimated_cost: float|null,
     *     km_per_liter: float|null,
     *     liters_per_100km: float|null,
     *     fills_in_window: int,
     *     source: string
     * }
     */
    public function forTrip(Trip $trip): array
    {
        $distance = $trip->distance_km !== null ? (float) $trip->distance_km : null;
        $vehicle = $trip->vehicle;

        if ($vehicle === null) {
            return $this->empty($distance);
        }

        $kmPerLiter = $this->calculator->recentAverageKmPerLiter($vehicle)
            ?? ($vehicle->expected_km_per_liter !== null ? (float) $vehicle->expected_km_per_liter : null);

        $estimatedLiters = $distance !== null
            ? $this->calculator->estimateLitersForDistance($vehicle, $distance)
            : null;

        $avgPrice = FuelLog::query()
            ->where('vehicle_id', $vehicle->id)
            ->whereNotNull('price_per_liter')
            ->orderByDesc('filled_at')
            ->limit(5)
            ->avg('price_per_liter');

        $fillsInWindow = 0;
        if ($trip->started_at && $trip->completed_at) {
            $fillsInWindow = FuelLog::query()
                ->where('vehicle_id', $vehicle->id)
                ->whereBetween('filled_at', [$trip->started_at->toDateString(), $trip->completed_at->toDateString()])
                ->count();
        }

        return [
            'distance_km' => $distance,
            'estimated_liters' => $estimatedLiters,
            'estimated_cost' => $estimatedLiters !== null && $avgPrice
                ? round($estimatedLiters * (float) $avgPrice, 2)
                : null,
            'km_per_liter' => $kmPerLiter,
            'liters_per_100km' => $kmPerLiter && $kmPerLiter > 0 ? round(100 / $kmPerLiter, 2) : null,
            'fills_in_window' => $fillsInWindow,
            'source' => $kmPerLiter !== null ? 'fleet_efficiency' : 'unavailable',
        ];
    }

    /**
     * @return array{
     *     distance_km: float|null,
     *     estimated_liters: float|null,
     *     estimated_cost: float|null,
     *     km_per_liter: float|null,
     *     liters_per_100km: float|null,
     *     fills_in_window: int,
     *     source: string
     * }
     */
    private function empty(?float $distance): array
    {
        return [
            'distance_km' => $distance,
            'estimated_liters' => null,
            'estimated_cost' => null,
            'km_per_liter' => null,
            'liters_per_100km' => null,
            'fills_in_window' => 0,
            'source' => 'unavailable',
        ];
    }
}
