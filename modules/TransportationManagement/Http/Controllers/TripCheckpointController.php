<?php

namespace Modules\TransportationManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\TransportationManagement\Http\Requests\StoreCheckpointRequest;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripCheckpoint;

class TripCheckpointController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Store a newly created checkpoint for the given trip.
     */
    public function store(StoreCheckpointRequest $request, Trip $trip): RedirectResponse
    {
        $trip->checkpoints()->create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.transportation.trips.show', $trip)
            ->with('success', 'Checkpoint logged.');
    }

    /**
     * Remove the specified checkpoint.
     */
    public function destroy(Trip $trip, TripCheckpoint $checkpoint): RedirectResponse
    {
        if ($checkpoint->trip_id !== $trip->id) {
            abort(404);
        }

        $checkpoint->delete();

        return redirect()->route($this->getRoutePrefix().'.transportation.trips.show', $trip)
            ->with('success', 'Checkpoint removed.');
    }
}
