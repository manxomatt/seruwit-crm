<?php

namespace Modules\TransportationManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\TransportationManagement\Actions\TripStopTransitions;
use Modules\TransportationManagement\Http\Requests\StoreTripStopRequest;
use Modules\TransportationManagement\Http\Requests\UpdateTripStopRequest;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;

class TripStopController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Store a newly created stop for the given trip.
     */
    public function store(StoreTripStopRequest $request, Trip $trip): RedirectResponse
    {
        if ($trip->status !== Trip::STATUS_SCHEDULED) {
            return back()->with('error', 'Stops can only be added while the trip is scheduled.');
        }

        $trip->stops()->create([
            ...$request->validated(),
            'sequence' => ((int) $trip->stops()->max('sequence')) + 1,
        ]);

        return redirect()->route($this->getRoutePrefix().'.transportation.trips.show', $trip)
            ->with('success', 'Stop added.');
    }

    /**
     * Update the specified stop.
     */
    public function update(UpdateTripStopRequest $request, Trip $trip, TripStop $stop): RedirectResponse
    {
        if ($stop->trip_id !== $trip->id) {
            abort(404);
        }

        if ($trip->status !== Trip::STATUS_SCHEDULED) {
            return back()->with('error', 'Stops can only be edited while the trip is scheduled.');
        }

        if ($stop->status !== TripStop::STATUS_PENDING) {
            return back()->with('error', 'Only a pending stop can be edited.');
        }

        $stop->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.transportation.trips.show', $trip)
            ->with('success', 'Stop updated.');
    }

    /**
     * Remove the specified stop.
     */
    public function destroy(Trip $trip, TripStop $stop): RedirectResponse
    {
        if ($stop->trip_id !== $trip->id) {
            abort(404);
        }

        if ($stop->status !== TripStop::STATUS_PENDING) {
            return back()->with('error', 'Only a pending stop can be removed.');
        }

        if ($stop->delivery_order_id !== null) {
            return back()->with('error', 'This stop belongs to a delivery order; detach the order instead.');
        }

        $stop->delete();

        return redirect()->route($this->getRoutePrefix().'.transportation.trips.show', $trip)
            ->with('success', 'Stop removed.');
    }

    /**
     * Mark the stop as arrived.
     */
    public function arrive(Trip $trip, TripStop $stop, TripStopTransitions $transitions): RedirectResponse
    {
        if ($stop->trip_id !== $trip->id) {
            abort(404);
        }

        $result = $transitions->arrive($trip, $stop);

        return back()->with($result->ok ? 'success' : 'error', $result->message);
    }

    /**
     * Mark the stop as completed.
     */
    public function complete(Trip $trip, TripStop $stop, TripStopTransitions $transitions): RedirectResponse
    {
        if ($stop->trip_id !== $trip->id) {
            abort(404);
        }

        $result = $transitions->complete($trip, $stop);

        return back()->with($result->ok ? 'success' : 'error', $result->message);
    }
}
