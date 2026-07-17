<?php

namespace Modules\TransportationManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\TransportationManagement\Http\Requests\StoreMaintenanceLogRequest;
use Modules\TransportationManagement\Http\Requests\UpdateMaintenanceLogRequest;
use Modules\TransportationManagement\Models\Vehicle;
use Modules\TransportationManagement\Models\VehicleMaintenanceLog;

class VehicleMaintenanceLogController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Store a newly created maintenance log for the given vehicle.
     */
    public function store(StoreMaintenanceLogRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $vehicle->maintenanceLogs()->create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.transportation.vehicles.show', $vehicle)
            ->with('success', 'Maintenance log added.');
    }

    /**
     * Update the specified maintenance log.
     */
    public function update(UpdateMaintenanceLogRequest $request, Vehicle $vehicle, VehicleMaintenanceLog $maintenanceLog): RedirectResponse
    {
        if ($maintenanceLog->vehicle_id !== $vehicle->id) {
            abort(404);
        }

        $maintenanceLog->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.transportation.vehicles.show', $vehicle)
            ->with('success', 'Maintenance log updated.');
    }

    /**
     * Remove the specified maintenance log.
     */
    public function destroy(Vehicle $vehicle, VehicleMaintenanceLog $maintenanceLog): RedirectResponse
    {
        if ($maintenanceLog->vehicle_id !== $vehicle->id) {
            abort(404);
        }

        $maintenanceLog->delete();

        return redirect()->route($this->getRoutePrefix().'.transportation.vehicles.show', $vehicle)
            ->with('success', 'Maintenance log deleted.');
    }
}
