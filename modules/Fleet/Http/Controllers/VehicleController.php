<?php

namespace Modules\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Http\Requests\StoreVehicleRequest;
use Modules\Fleet\Http\Requests\UpdateVehicleRequest;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\FuelConsumptionCalculator;
use Modules\Fleet\Support\FuelLogRecorder;

class VehicleController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the vehicles.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $vehicles = Vehicle::query()
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('plate_number', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%");
                });
            })
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Fleet/Vehicles/Index', [
            'vehicles' => $vehicles,
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('fleet', 'create'),
                'update' => $user->hasPermissionFor('fleet', 'update'),
                'delete' => $user->hasPermissionFor('fleet', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new vehicle.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Fleet/Vehicles/Create');
    }

    /**
     * Store a newly created vehicle in storage.
     */
    public function store(StoreVehicleRequest $request): RedirectResponse
    {
        $vehicle = Vehicle::create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.fleet.vehicles.show', $vehicle)
            ->with('success', 'Vehicle created successfully.');
    }

    /**
     * Display the specified vehicle.
     */
    public function show(Vehicle $vehicle, FuelConsumptionCalculator $calculator, FuelLogRecorder $recorder): Response
    {
        $user = Auth::user();

        $vehicle->load(['maintenanceLogs', 'fuelLogs.driver']);

        $trackingEnabled = Modules::available('tracking');

        if ($trackingEnabled) {
            $vehicle->load('gpsDevice');
        }

        return Inertia::render('Modules/Fleet/Vehicles/Show', [
            'vehicle' => $vehicle,
            'trackingEnabled' => $trackingEnabled,
            'fuelSummary' => [
                'average_km_per_liter' => $calculator->recentAverageKmPerLiter($vehicle),
                'expected_km_per_liter' => $vehicle->expected_km_per_liter !== null
                    ? (float) $vehicle->expected_km_per_liter
                    : null,
                'anomaly_count' => $vehicle->fuelLogs->filter(fn ($log) => $log->hasAnomalies())->count(),
                'suggested_odometer_km' => (int) $vehicle->odometer_km,
                'suggested_odometer_source' => $recorder->suggestOdometerSource($vehicle),
            ],
            'drivers' => Driver::query()->orderBy('name')->get(['id', 'name']),
            'can' => [
                'update' => $user->hasPermissionFor('fleet', 'update'),
                'delete' => $user->hasPermissionFor('fleet', 'delete'),
                'create' => $user->hasPermissionFor('fleet', 'create'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified vehicle.
     */
    public function edit(Vehicle $vehicle): Response
    {
        return Inertia::render('Modules/Fleet/Vehicles/Edit', [
            'vehicle' => $vehicle,
        ]);
    }

    /**
     * Update the specified vehicle in storage.
     */
    public function update(UpdateVehicleRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $vehicle->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.fleet.vehicles.show', $vehicle)
            ->with('success', 'Vehicle updated successfully.');
    }

    /**
     * Remove the specified vehicle from storage.
     *
     * Fleet has no knowledge of Trip or any other module that might reference
     * this vehicle, so it cannot check "is this vehicle busy" itself — the
     * database's own foreign key constraint is what stops the delete, and this
     * just turns that into a readable message instead of a 500. The delete is
     * wrapped in its own transaction so a constraint violation only rolls back
     * this statement (via a savepoint) instead of poisoning an outer one.
     */
    public function destroy(Vehicle $vehicle): RedirectResponse
    {
        try {
            DB::transaction(fn () => $vehicle->delete());
        } catch (QueryException) {
            return back()->with('error', 'This vehicle is still referenced by other records and cannot be deleted.');
        }

        return redirect()->route($this->getRoutePrefix().'.fleet.vehicles.index')
            ->with('success', 'Vehicle deleted successfully.');
    }
}
