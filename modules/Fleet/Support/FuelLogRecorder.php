<?php

namespace Modules\Fleet\Support;

use Illuminate\Support\Facades\DB;
use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;

/**
 * Persists a fuel fill, computes consumption vs the previous fill, detects
 * anomalies, and optionally advances the vehicle odometer (GPS-synced or manual).
 */
class FuelLogRecorder
{
    public const ODOMETER_SOURCE_MANUAL = 'manual';

    public const ODOMETER_SOURCE_VEHICLE = 'vehicle';

    public const ODOMETER_SOURCE_GPS = 'gps';

    public function __construct(
        private readonly FuelConsumptionCalculator $calculator,
        private readonly FuelAnomalyDetector $detector,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function record(Vehicle $vehicle, array $attributes): FuelLog
    {
        return DB::transaction(function () use ($vehicle, $attributes): FuelLog {
            $odometerSource = $attributes['odometer_source'] ?? null;
            $odometer = isset($attributes['odometer_km']) && $attributes['odometer_km'] !== null && $attributes['odometer_km'] !== ''
                ? (int) $attributes['odometer_km']
                : null;

            if ($odometer === null && $vehicle->odometer_km > 0) {
                $odometer = (int) $vehicle->odometer_km;
                $odometerSource ??= $this->suggestOdometerSource($vehicle);
            }

            $liters = (float) $attributes['liters'];
            $cost = (float) $attributes['cost'];
            $pricePerLiter = $attributes['price_per_liter'] ?? null;
            if ($pricePerLiter === null && $liters > 0) {
                $pricePerLiter = round($cost / $liters, 2);
            }

            $fill = $vehicle->fuelLogs()->make([
                'driver_id' => $attributes['driver_id'] ?? null,
                'filled_at' => $attributes['filled_at'],
                'liters' => $liters,
                'cost' => $cost,
                'odometer_km' => $odometer,
                'station_name' => $attributes['station_name'] ?? null,
                'receipt_number' => $attributes['receipt_number'] ?? null,
                'is_full_tank' => (bool) ($attributes['is_full_tank'] ?? false),
                'price_per_liter' => $pricePerLiter,
                'odometer_source' => $odometerSource,
                'notes' => $attributes['notes'] ?? null,
            ]);
            $fill->save();

            $consumption = $this->calculator->forFill($vehicle, $fill);
            $flags = $this->detector->detect($vehicle, $fill, $consumption);

            $fill->update([
                'distance_since_last_km' => $consumption['distance_since_last_km'],
                'km_per_liter' => $consumption['km_per_liter'],
                'liters_per_100km' => $consumption['liters_per_100km'],
                'anomaly_flags' => $flags === [] ? null : $flags,
            ]);

            if ($odometer !== null && $odometer > (int) $vehicle->odometer_km) {
                $vehicle->update(['odometer_km' => $odometer]);
            }

            return $fill->fresh(['driver', 'vehicle']);
        });
    }

    public function suggestOdometerSource(Vehicle $vehicle): string
    {
        if ($vehicle->relationLoaded('gpsDevice') && $vehicle->gpsDevice) {
            return self::ODOMETER_SOURCE_GPS;
        }

        if (method_exists($vehicle, 'gpsDevice')) {
            try {
                if ($vehicle->gpsDevice()->exists()) {
                    return self::ODOMETER_SOURCE_GPS;
                }
            } catch (\Throwable) {
                // Relation may be unregistered when Tracking is not installed.
            }
        }

        return self::ODOMETER_SOURCE_VEHICLE;
    }
}
