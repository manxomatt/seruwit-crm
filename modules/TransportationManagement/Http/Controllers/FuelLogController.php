<?php

namespace Modules\TransportationManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\TransportationManagement\Http\Requests\StoreFuelLogRequest;
use Modules\TransportationManagement\Models\FuelLog;
use Modules\TransportationManagement\Models\Vehicle;

class FuelLogController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Store a newly created fuel log for the given vehicle.
     */
    public function store(StoreFuelLogRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $vehicle->fuelLogs()->create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.transportation.vehicles.show', $vehicle)
            ->with('success', 'Fuel log added.');
    }

    /**
     * Remove the specified fuel log.
     */
    public function destroy(Vehicle $vehicle, FuelLog $fuelLog): RedirectResponse
    {
        if ($fuelLog->vehicle_id !== $vehicle->id) {
            abort(404);
        }

        $fuelLog->delete();

        return redirect()->route($this->getRoutePrefix().'.transportation.vehicles.show', $vehicle)
            ->with('success', 'Fuel log deleted.');
    }
}
