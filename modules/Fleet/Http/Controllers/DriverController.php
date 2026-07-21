<?php

namespace Modules\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Http\Requests\StoreDriverRequest;
use Modules\Fleet\Http\Requests\UpdateDriverRequest;
use Modules\Fleet\Models\Driver;

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

        return Inertia::render('Modules/Fleet/Drivers/Index', [
            'drivers' => $drivers,
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
     * Show the form for creating a new driver.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Fleet/Drivers/Create');
    }

    /**
     * Store a newly created driver in storage.
     */
    public function store(StoreDriverRequest $request): RedirectResponse
    {
        $driver = Driver::create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.fleet.drivers.show', $driver)
            ->with('success', 'Driver created successfully.');
    }

    /**
     * Display the specified driver.
     */
    public function show(Driver $driver): Response
    {
        $user = Auth::user();

        $driver->load('user:id,name,username,email');

        return Inertia::render('Modules/Fleet/Drivers/Show', [
            'driver' => $driver,
            'can' => [
                'update' => $user->hasPermissionFor('fleet', 'update'),
                'delete' => $user->hasPermissionFor('fleet', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified driver.
     */
    public function edit(Driver $driver): Response
    {
        return Inertia::render('Modules/Fleet/Drivers/Edit', [
            'driver' => $driver,
        ]);
    }

    /**
     * Update the specified driver in storage.
     */
    public function update(UpdateDriverRequest $request, Driver $driver): RedirectResponse
    {
        $driver->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.fleet.drivers.show', $driver)
            ->with('success', 'Driver updated successfully.');
    }

    /**
     * Remove the specified driver from storage.
     *
     * Fleet has no knowledge of Trip or any other module that might reference
     * this driver, so it cannot check "is this driver busy" itself — the
     * database's own foreign key constraint is what stops the delete, and this
     * just turns that into a readable message instead of a 500. The delete is
     * wrapped in its own transaction so a constraint violation only rolls back
     * this statement (via a savepoint) instead of poisoning an outer one.
     */
    public function destroy(Driver $driver): RedirectResponse
    {
        try {
            DB::transaction(fn () => $driver->delete());
        } catch (QueryException) {
            return back()->with('error', 'This driver is still referenced by other records and cannot be deleted.');
        }

        return redirect()->route($this->getRoutePrefix().'.fleet.drivers.index')
            ->with('success', 'Driver deleted successfully.');
    }
}
