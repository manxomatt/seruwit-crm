<?php

namespace Modules\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\Fleet\Http\Requests\StoreFuelLogRequest;
use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;

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

        return redirect()->route($this->getRoutePrefix().'.fleet.vehicles.show', $vehicle)
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

        return redirect()->route($this->getRoutePrefix().'.fleet.vehicles.show', $vehicle)
            ->with('success', 'Fuel log deleted.');
    }
}
