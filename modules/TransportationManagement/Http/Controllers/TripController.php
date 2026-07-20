<?php

namespace Modules\TransportationManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Customer\Models\Customer;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Product\Models\Product;
use Modules\TransportationManagement\Http\Requests\StoreTripRequest;
use Modules\TransportationManagement\Http\Requests\UpdateTripRequest;
use Modules\TransportationManagement\Models\Trip;

class TripController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the trips.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $trips = Trip::query()
            ->with(['vehicle', 'driver', 'customer'])
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('origin', 'like', "%{$search}%")
                        ->orWhere('destination', 'like', "%{$search}%");
                });
            })
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest('scheduled_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/TransportationManagement/Trips/Index', [
            'trips' => $trips,
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
     * Show the form for creating a new trip.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/TransportationManagement/Trips/Create', [
            'vehicles' => Vehicle::query()->orderBy('name')->get(['id', 'name', 'plate_number', 'status']),
            'drivers' => Driver::query()->orderBy('name')->get(['id', 'name', 'license_number', 'status']),
            'customers' => Customer::query()->orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    /**
     * Store a newly created trip in storage.
     */
    public function store(StoreTripRequest $request): RedirectResponse
    {
        $trip = Trip::create([
            ...$request->validated(),
            'code' => Trip::nextCode(),
        ]);

        return redirect()->route($this->getRoutePrefix().'.transportation.trips.show', $trip)
            ->with('success', 'Trip created successfully.');
    }

    /**
     * Display the specified trip.
     */
    public function show(Trip $trip): Response
    {
        $user = Auth::user();

        $trip->load(['vehicle', 'driver', 'customer', 'checkpoints', 'items.product', 'stops']);

        $ordersEnabled = Modules::available('orders');

        if ($ordersEnabled) {
            $trip->load(['deliveryOrders.customer', 'stops.deliveryOrder']);
        }

        // A GPS-fed trip carries thousands of checkpoints, so the trail is
        // thinned before it reaches the payload — the drawn line is
        // indistinguishable and the response stays a sensible size.
        $trip->setRelation('checkpoints', $this->thinTrail($trip->checkpoints));

        $trackingEnabled = Modules::available('tracking');
        $livePosition = null;

        if ($trackingEnabled && $trip->vehicle?->gpsDevice?->hasPosition()) {
            $device = $trip->vehicle->gpsDevice;

            $livePosition = [
                'latitude' => $device->last_latitude,
                'longitude' => $device->last_longitude,
                'speed_kph' => $device->last_speed_kph,
                'recorded_at' => $device->last_recorded_at?->toDateTimeString(),
            ];
        }

        return Inertia::render('Modules/TransportationManagement/Trips/Show', [
            'trip' => $trip,
            'ordersEnabled' => $ordersEnabled,
            'trackingEnabled' => $trackingEnabled,
            'livePosition' => $livePosition,
            'products' => Product::query()->where('status', 'active')->orderBy('name')->get(['id', 'code', 'name', 'unit']),
            'can' => [
                'update' => $user->hasPermissionFor('transportation', 'update'),
                'delete' => $user->hasPermissionFor('transportation', 'delete'),
                'create' => $user->hasPermissionFor('transportation', 'create'),
            ],
        ]);
    }

    /**
     * Keeps every checkpoint up to a readable ceiling, then samples evenly.
     * The first and last points are always kept so the trail still starts and
     * ends where the trip did.
     *
     * @param  \Illuminate\Support\Collection<int, \Modules\TransportationManagement\Models\TripCheckpoint>  $checkpoints
     * @return \Illuminate\Support\Collection<int, \Modules\TransportationManagement\Models\TripCheckpoint>
     */
    protected function thinTrail($checkpoints)
    {
        $limit = 500;

        if ($checkpoints->count() <= $limit) {
            return $checkpoints;
        }

        $step = (int) ceil($checkpoints->count() / $limit);

        return $checkpoints
            ->values()
            ->filter(fn ($checkpoint, $index) => $index % $step === 0 || $index === $checkpoints->count() - 1)
            ->values();
    }

    /**
     * Update the specified trip in storage. Only meaningful while the trip is
     * still scheduled — reassigning vehicle/driver mid-trip is not supported.
     */
    public function update(UpdateTripRequest $request, Trip $trip): RedirectResponse
    {
        if ($trip->status !== Trip::STATUS_SCHEDULED) {
            return back()->with('error', 'Only a scheduled trip can be edited.');
        }

        $trip->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.transportation.trips.show', $trip)
            ->with('success', 'Trip updated successfully.');
    }

    /**
     * Remove the specified trip from storage.
     */
    public function destroy(Trip $trip): RedirectResponse
    {
        if ($trip->status === Trip::STATUS_IN_PROGRESS) {
            return back()->with('error', 'An in-progress trip cannot be deleted.');
        }

        $trip->delete();

        return redirect()->route($this->getRoutePrefix().'.transportation.trips.index')
            ->with('success', 'Trip deleted successfully.');
    }

    /**
     * Move a scheduled trip to in-progress.
     */
    public function start(Trip $trip): RedirectResponse
    {
        if ($trip->status !== Trip::STATUS_SCHEDULED) {
            return back()->with('error', 'Only a scheduled trip can be started.');
        }

        $trip->update([
            'status' => Trip::STATUS_IN_PROGRESS,
            'started_at' => now(),
        ]);

        return back()->with('success', 'Trip started.');
    }

    /**
     * Mark an in-progress trip as completed.
     */
    public function complete(Trip $trip): RedirectResponse
    {
        if ($trip->status !== Trip::STATUS_IN_PROGRESS) {
            return back()->with('error', 'Only an in-progress trip can be completed.');
        }

        $trip->update([
            'status' => Trip::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        return back()->with('success', 'Trip completed.');
    }

    /**
     * Cancel a scheduled or in-progress trip.
     */
    public function cancel(Request $request, Trip $trip): RedirectResponse
    {
        if (! in_array($trip->status, [Trip::STATUS_SCHEDULED, Trip::STATUS_IN_PROGRESS], true)) {
            return back()->with('error', 'This trip can no longer be cancelled.');
        }

        $request->validate([
            'cancelled_reason' => ['required', 'string', 'max:255'],
        ]);

        $trip->update([
            'status' => Trip::STATUS_CANCELLED,
            'cancelled_reason' => $request->input('cancelled_reason'),
        ]);

        return back()->with('success', 'Trip cancelled.');
    }
}
