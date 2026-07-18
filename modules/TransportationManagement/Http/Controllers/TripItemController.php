<?php

namespace Modules\TransportationManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\TransportationManagement\Http\Requests\StoreTripItemRequest;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripItem;

class TripItemController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Store a newly created cargo item for the given trip.
     */
    public function store(StoreTripItemRequest $request, Trip $trip): RedirectResponse
    {
        $trip->items()->create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.transportation.trips.show', $trip)
            ->with('success', 'Cargo item added.');
    }

    /**
     * Remove the specified cargo item.
     */
    public function destroy(Trip $trip, TripItem $item): RedirectResponse
    {
        if ($item->trip_id !== $trip->id) {
            abort(404);
        }

        $item->delete();

        return redirect()->route($this->getRoutePrefix().'.transportation.trips.show', $trip)
            ->with('success', 'Cargo item removed.');
    }
}
