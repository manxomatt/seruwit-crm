<?php

namespace Modules\Shuttle\Support;

use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\DB;
use Modules\Shuttle\Models\ShuttleDeparture;
use RuntimeException;

class DepartureDispatchService
{
    public function lock(ShuttleDeparture $departure): ShuttleDeparture
    {
        if ($departure->status !== ShuttleDeparture::STATUS_OPEN && $departure->status !== ShuttleDeparture::STATUS_OPTIMIZED) {
            throw new RuntimeException(__('shuttle.messages.lock_invalid_status'));
        }

        $departure->update(['status' => ShuttleDeparture::STATUS_LOCKED]);

        return $departure->fresh();
    }

    /**
     * @param  array{vehicle_id?: int|null, driver_id?: int|null}  $attrs
     */
    public function dispatch(ShuttleDeparture $departure, array $attrs = []): ShuttleDeparture
    {
        if (! in_array($departure->status, [
            ShuttleDeparture::STATUS_LOCKED,
            ShuttleDeparture::STATUS_OPTIMIZED,
            ShuttleDeparture::STATUS_OPEN,
        ], true)) {
            throw new RuntimeException(__('shuttle.messages.dispatch_invalid_status'));
        }

        return DB::transaction(function () use ($departure, $attrs): ShuttleDeparture {
            if (isset($attrs['vehicle_id'])) {
                $departure->vehicle_id = $attrs['vehicle_id'];
            }
            if (array_key_exists('driver_id', $attrs)) {
                $departure->driver_id = $attrs['driver_id'];
            }

            if (! $departure->vehicle_id) {
                throw new RuntimeException(__('shuttle.messages.dispatch_requires_vehicle'));
            }

            $conflicts = $this->vehicleConflictReasons($departure);
            if ($conflicts !== []) {
                throw new RuntimeException(implode(' ', $conflicts));
            }

            $departure->status = ShuttleDeparture::STATUS_DISPATCHED;
            $departure->dispatched_at = now();
            $departure->save();

            return $departure->fresh(['vehicle', 'driver', 'routeStops']);
        });
    }

    public function complete(ShuttleDeparture $departure): ShuttleDeparture
    {
        if (! in_array($departure->status, [
            ShuttleDeparture::STATUS_DISPATCHED,
            ShuttleDeparture::STATUS_IN_TRANSIT,
        ], true)) {
            throw new RuntimeException(__('shuttle.messages.complete_invalid_status'));
        }

        $departure->update([
            'status' => ShuttleDeparture::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        $departure->bookings()
            ->whereIn('status', ['confirmed', 'boarded'])
            ->update(['status' => 'completed']);

        return $departure->fresh();
    }

    /**
     * @return list<string>
     */
    public function vehicleConflictReasons(ShuttleDeparture $departure): array
    {
        $reasons = [];
        $vehicleId = $departure->vehicle_id;
        $date = $departure->depart_date?->toDateString();

        if (! $vehicleId || ! $date) {
            return $reasons;
        }

        $other = ShuttleDeparture::query()
            ->where('vehicle_id', $vehicleId)
            ->whereDate('depart_date', $date)
            ->where('id', '!=', $departure->id)
            ->whereIn('status', [
                ShuttleDeparture::STATUS_DISPATCHED,
                ShuttleDeparture::STATUS_IN_TRANSIT,
                ShuttleDeparture::STATUS_OPTIMIZED,
                ShuttleDeparture::STATUS_LOCKED,
            ])
            ->exists();

        if ($other) {
            $reasons[] = __('shuttle.validation.vehicle_shuttle_conflict');
        }

        if (Modules::available('transportation') && class_exists(\Modules\TransportationManagement\Models\Trip::class)) {
            if (\Modules\TransportationManagement\Models\Trip::hasActiveTripOn('vehicle_id', $vehicleId, $date)) {
                $reasons[] = __('shuttle.validation.vehicle_trip_conflict');
            }
        }

        if (Modules::available('rental') && class_exists(\Modules\Rental\Models\Rental::class)) {
            $activeRental = \Modules\Rental\Models\Rental::query()
                ->where('vehicle_id', $vehicleId)
                ->whereNotIn('status', ['cancelled', 'completed'])
                ->whereDate('start_date', '<=', $date)
                ->whereDate('end_date', '>=', $date)
                ->exists();

            if ($activeRental) {
                $reasons[] = __('shuttle.validation.vehicle_rental_conflict');
            }
        }

        return $reasons;
    }
}
