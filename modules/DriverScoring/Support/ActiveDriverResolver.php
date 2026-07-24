<?php

namespace Modules\DriverScoring\Support;

use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\Schema;

/**
 * Soft-resolves which Fleet driver is currently operating a vehicle.
 *
 * Transportation owns trips; Scoring must not hard-require that Vertical.
 */
final class ActiveDriverResolver
{
    /**
     * @return array{driver_id: int|null, trip_id: int|null}
     */
    public function forVehicle(int $vehicleId): array
    {
        if (! Modules::available('transportation')) {
            return ['driver_id' => null, 'trip_id' => null];
        }

        if (! class_exists(\Modules\TransportationManagement\Models\Trip::class)) {
            return ['driver_id' => null, 'trip_id' => null];
        }

        if (! Schema::hasTable('trips')) {
            return ['driver_id' => null, 'trip_id' => null];
        }

        $trip = \Modules\TransportationManagement\Models\Trip::query()
            ->where('vehicle_id', $vehicleId)
            ->where('status', \Modules\TransportationManagement\Models\Trip::STATUS_IN_PROGRESS)
            ->orderByDesc('started_at')
            ->first(['id', 'driver_id']);

        if ($trip === null) {
            return ['driver_id' => null, 'trip_id' => null];
        }

        return [
            'driver_id' => $trip->driver_id,
            'trip_id' => $trip->id,
        ];
    }
}
