<?php

namespace Modules\Shuttle\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Shuttle\Models\ShuttleDeparture;

class DepartureController extends Controller
{
    public function index(): Response
    {
        $departures = ShuttleDeparture::query()
            ->with(['corridor', 'vehicle', 'driver'])
            ->when(request('status'), fn ($q, $status) => $q->where('status', $status))
            ->when(request('date'), fn ($q, $date) => $q->whereDate('depart_date', $date))
            ->orderByDesc('depart_date')
            ->orderBy('depart_time')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Shuttle/Departures/Index', [
            'departures' => $departures,
            'filters' => request()->only(['status', 'date']),
            'can' => [
                'update' => auth()->user()?->hasPermissionFor('shuttle', 'update') ?? false,
                'optimize' => auth()->user()?->hasPermissionFor('shuttle', 'optimize') ?? false,
                'dispatch' => auth()->user()?->hasPermissionFor('shuttle', 'dispatch') ?? false,
            ],
        ]);
    }

    public function show(ShuttleDeparture $departure): Response
    {
        $departure->load([
            'corridor.originLocation',
            'corridor.destinationLocation',
            'vehicle',
            'driver',
            'originPool',
            'destinationPool',
            'bookings.partner',
            'bookings.passengers',
            'routeStops.booking',
        ]);

        return Inertia::render('Modules/Shuttle/Departures/Show', [
            'departure' => $departure,
            'vehicles' => Vehicle::query()->where('status', Vehicle::STATUS_ACTIVE)->orderBy('name')->get(['id', 'name', 'plate_number', 'capacity_seats']),
            'drivers' => Driver::query()->orderBy('name')->get(['id', 'name']),
            'can' => [
                'update' => auth()->user()?->hasPermissionFor('shuttle', 'update') ?? false,
                'optimize' => auth()->user()?->hasPermissionFor('shuttle', 'optimize') ?? false,
                'dispatch' => auth()->user()?->hasPermissionFor('shuttle', 'dispatch') ?? false,
            ],
        ]);
    }
}
