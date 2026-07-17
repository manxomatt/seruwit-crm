<?php

namespace Modules\TransportationManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\TransportationManagement\Http\Requests\StoreDriverRequest;
use Modules\TransportationManagement\Http\Requests\UpdateDriverRequest;
use Modules\TransportationManagement\Models\Driver;

class DriverController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the drivers.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $drivers = Driver::query()
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('license_number', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/TransportationManagement/Drivers/Index', [
            'drivers' => $drivers,
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
     * Show the form for creating a new driver.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/TransportationManagement/Drivers/Create');
    }

    /**
     * Store a newly created driver in storage.
     */
    public function store(StoreDriverRequest $request): RedirectResponse
    {
        $driver = Driver::create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.transportation.drivers.show', $driver)
            ->with('success', 'Driver created successfully.');
    }

    /**
     * Display the specified driver.
     */
    public function show(Driver $driver): Response
    {
        $user = Auth::user();

        $driver->load(['trips' => fn ($query) => $query->latest()->with('vehicle')]);

        return Inertia::render('Modules/TransportationManagement/Drivers/Show', [
            'driver' => $driver,
            'can' => [
                'update' => $user->hasPermissionFor('transportation', 'update'),
                'delete' => $user->hasPermissionFor('transportation', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified driver.
     */
    public function edit(Driver $driver): Response
    {
        return Inertia::render('Modules/TransportationManagement/Drivers/Edit', [
            'driver' => $driver,
        ]);
    }

    /**
     * Update the specified driver in storage.
     */
    public function update(UpdateDriverRequest $request, Driver $driver): RedirectResponse
    {
        $driver->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.transportation.drivers.show', $driver)
            ->with('success', 'Driver updated successfully.');
    }

    /**
     * Remove the specified driver from storage.
     */
    public function destroy(Driver $driver): RedirectResponse
    {
        if ($driver->hasActiveTrip()) {
            return back()->with('error', 'This driver has an active trip and cannot be deleted.');
        }

        $driver->delete();

        return redirect()->route($this->getRoutePrefix().'.transportation.drivers.index')
            ->with('success', 'Driver deleted successfully.');
    }
}
