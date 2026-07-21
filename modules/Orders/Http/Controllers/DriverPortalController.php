<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Orders\Http\Controllers\Concerns\ResolvesActiveDriver;
use Modules\TransportationManagement\Actions\TripStopTransitions;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;

/**
 * The mobile portal a driver uses in the field: their trips for today, the
 * stops on a trip, and the actions that move a trip forward. POD capture lives
 * in PodController; everything here is navigation and stop progress.
 */
class DriverPortalController extends Controller
{
    use ResolvesActiveDriver;

    public function today(): Response
    {
        $driver = $this->activeDriver();

        $trips = Trip::query()
            ->where('driver_id', $driver->id)
            ->whereIn('status', [Trip::STATUS_SCHEDULED, Trip::STATUS_IN_PROGRESS])
            ->whereDate('scheduled_at', now()->toDateString())
            ->with(['vehicle:id,plate_number,name', 'customer:id,name'])
            ->withCount('stops')
            ->orderBy('scheduled_at')
            ->get();

        return Inertia::render('Modules/Orders/Driver/Today', [
            'driverName' => $driver->name,
            'trips' => $trips,
        ]);
    }

    public function trip(Trip $trip): Response
    {
        $driver = $this->activeDriver();
        $this->ensureTripBelongsToDriver($trip, $driver);

        $trip->load([
            'vehicle:id,plate_number,name',
            'customer:id,name',
            'stops.deliveryOrder.customer:id,name',
            'stops.deliveryOrder.pod',
        ]);

        return Inertia::render('Modules/Orders/Driver/Trip', [
            'driverName' => $driver->name,
            'trip' => $trip,
        ]);
    }

    public function startTrip(Trip $trip): RedirectResponse
    {
        $driver = $this->activeDriver();
        $this->ensureTripBelongsToDriver($trip, $driver);

        if ($trip->status !== Trip::STATUS_SCHEDULED) {
            return back()->with('error', 'This trip has already been started.');
        }

        // Eloquent update so TripObserver fires and advances the orders from
        // assigned to in_transit (and notifies staff).
        $trip->update(['status' => Trip::STATUS_IN_PROGRESS]);

        return back()->with('success', 'Trip started.');
    }

    public function arriveStop(Trip $trip, TripStop $stop, TripStopTransitions $transitions): RedirectResponse
    {
        $driver = $this->activeDriver();
        $this->ensureTripBelongsToDriver($trip, $driver);
        abort_if($stop->trip_id !== $trip->id, 404);

        $result = $transitions->arrive($trip, $stop);

        return back()->with($result->ok ? 'success' : 'error', $result->message);
    }
}
