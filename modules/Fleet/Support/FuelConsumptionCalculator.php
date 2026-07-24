<?php

namespace Modules\Fleet\Support;

use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;

/**
 * Derives distance and efficiency between consecutive fuel fills.
 */
final class FuelConsumptionCalculator
{
    /**
     * @return array{
     *     distance_since_last_km: int|null,
     *     km_per_liter: float|null,
     *     liters_per_100km: float|null,
     *     previous: FuelLog|null
     * }
     */
    public function forFill(Vehicle $vehicle, FuelLog $fill, ?FuelLog $previous = null): array
    {
        $previous ??= $this->previousFill($vehicle, $fill);

        if ($previous === null || $fill->odometer_km === null || $previous->odometer_km === null) {
            return [
                'distance_since_last_km' => null,
                'km_per_liter' => null,
                'liters_per_100km' => null,
                'previous' => $previous,
            ];
        }

        $distance = (int) $fill->odometer_km - (int) $previous->odometer_km;
        $liters = (float) $fill->liters;

        if ($distance <= 0 || $liters <= 0) {
            return [
                'distance_since_last_km' => max(0, $distance),
                'km_per_liter' => null,
                'liters_per_100km' => null,
                'previous' => $previous,
            ];
        }

        $kmPerLiter = round($distance / $liters, 2);
        $litersPer100 = round(($liters / $distance) * 100, 2);

        return [
            'distance_since_last_km' => $distance,
            'km_per_liter' => $kmPerLiter,
            'liters_per_100km' => $litersPer100,
            'previous' => $previous,
        ];
    }

    /**
     * Estimated liters for a trip distance using the vehicle's recent efficiency,
     * falling back to expected_km_per_liter.
     */
    public function estimateLitersForDistance(Vehicle $vehicle, float $distanceKm): ?float
    {
        if ($distanceKm <= 0) {
            return 0.0;
        }

        $kmPerLiter = $this->recentAverageKmPerLiter($vehicle)
            ?? ($vehicle->expected_km_per_liter !== null ? (float) $vehicle->expected_km_per_liter : null);

        if ($kmPerLiter === null || $kmPerLiter <= 0) {
            return null;
        }

        return round($distanceKm / $kmPerLiter, 2);
    }

    public function recentAverageKmPerLiter(Vehicle $vehicle, ?int $limit = null): ?float
    {
        $limit ??= (int) config('fleet.fuel.rolling_average_fills', 5);

        $values = FuelLog::query()
            ->where('vehicle_id', $vehicle->id)
            ->whereNotNull('km_per_liter')
            ->where('km_per_liter', '>', 0)
            ->orderByDesc('filled_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->pluck('km_per_liter');

        if ($values->isEmpty()) {
            return null;
        }

        return round((float) $values->avg(), 2);
    }

    public function previousFill(Vehicle $vehicle, FuelLog $fill): ?FuelLog
    {
        return FuelLog::query()
            ->where('vehicle_id', $vehicle->id)
            ->where(function ($query) use ($fill): void {
                $query->where('filled_at', '<', $fill->filled_at)
                    ->orWhere(function ($q) use ($fill): void {
                        $q->whereDate('filled_at', $fill->filled_at)
                            ->where('id', '<', $fill->id);
                    });
            })
            ->when($fill->exists, fn ($q) => $q->where('id', '!=', $fill->id))
            ->orderByDesc('filled_at')
            ->orderByDesc('id')
            ->first();
    }
}
