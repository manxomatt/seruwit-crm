<?php

namespace Modules\TransportationManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\TransportationManagement\Http\Requests\StoreVehicleRequest;
use Modules\TransportationManagement\Http\Requests\UpdateVehicleRequest;
use Modules\TransportationManagement\Models\Vehicle;

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

        return Inertia::render('Modules/TransportationManagement/Vehicles/Index', [
            'vehicles' => $vehicles,
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('transportation', 'create'),
                'update' => $user->hasPermissionFor('transportation', 'update'),
                'delete' => $user->hasPermissionFor('transportation', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new vehicle.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/TransportationManagement/Vehicles/Create');
    }

    /**
     * Store a newly created vehicle in storage.
     */
    public function store(StoreVehicleRequest $request): RedirectResponse
    {
        $vehicle = Vehicle::create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.transportation.vehicles.show', $vehicle)
            ->with('success', 'Vehicle created successfully.');
    }

    /**
     * Display the specified vehicle.
     */
    public function show(Vehicle $vehicle): Response
    {
        $user = Auth::user();

        $vehicle->load(['maintenanceLogs', 'fuelLogs']);

        return Inertia::render('Modules/TransportationManagement/Vehicles/Show', [
            'vehicle' => $vehicle,
            'can' => [
                'update' => $user->hasPermissionFor('transportation', 'update'),
                'delete' => $user->hasPermissionFor('transportation', 'delete'),
                'create' => $user->hasPermissionFor('transportation', 'create'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified vehicle.
     */
    public function edit(Vehicle $vehicle): Response
    {
        return Inertia::render('Modules/TransportationManagement/Vehicles/Edit', [
            'vehicle' => $vehicle,
        ]);
    }

    /**
     * Update the specified vehicle in storage.
     */
    public function update(UpdateVehicleRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $vehicle->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.transportation.vehicles.show', $vehicle)
            ->with('success', 'Vehicle updated successfully.');
    }

    /**
     * Remove the specified vehicle from storage.
     */
    public function destroy(Vehicle $vehicle): RedirectResponse
    {
        if ($vehicle->hasActiveTrip()) {
            return back()->with('error', 'This vehicle has an active trip and cannot be deleted.');
        }

        $vehicle->delete();

        return redirect()->route($this->getRoutePrefix().'.transportation.vehicles.index')
            ->with('success', 'Vehicle deleted successfully.');
    }
}
