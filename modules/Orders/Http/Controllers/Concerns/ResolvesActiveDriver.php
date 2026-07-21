<?php

namespace Modules\Orders\Http\Controllers\Concerns;

use Illuminate\Support\Facades\Auth;
use Modules\Fleet\Models\Driver;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;

/**
 * Resolves the Fleet driver behind the signed-in user and enforces that the
 * driver only ever touches their own trips and stops. The route already gates
 * on the orders,deliver capability; this narrows it from "any driver" to
 * "this driver's own work".
 */
trait ResolvesActiveDriver
{
    protected function activeDriver(): Driver
    {
        $driver = Driver::forUser(Auth::user());

        abort_if($driver === null, 403, 'This account is not linked to a driver.');

        return $driver;
    }

    protected function ensureTripBelongsToDriver(Trip $trip, Driver $driver): void
    {
        abort_if($trip->driver_id !== $driver->id, 403);
    }

    protected function ensureStopBelongsToDriver(TripStop $stop, Driver $driver): void
    {
        $this->ensureTripBelongsToDriver($stop->trip, $driver);
    }
}
