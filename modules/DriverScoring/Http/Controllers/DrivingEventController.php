<?php

namespace Modules\DriverScoring\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\DriverScoring\Models\DrivingEvent;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;

class DrivingEventController extends Controller
{
    public function index(Request $request): Response
    {
        $events = DrivingEvent::query()
            ->with(['driver:id,name', 'vehicle:id,name,plate_number'])
            ->when($request->integer('driver_id'), fn ($q, $id) => $q->where('driver_id', $id))
            ->when($request->integer('vehicle_id'), fn ($q, $id) => $q->where('vehicle_id', $id))
            ->when($request->string('type')->toString(), fn ($q, $type) => $q->where('type', $type))
            ->latest('recorded_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/DriverScoring/Events/Index', [
            'events' => $events,
            'drivers' => Driver::query()->orderBy('name')->get(['id', 'name']),
            'vehicles' => Vehicle::query()->orderBy('name')->get(['id', 'name', 'plate_number']),
            'filters' => [
                'driver_id' => $request->integer('driver_id') ?: null,
                'vehicle_id' => $request->integer('vehicle_id') ?: null,
                'type' => $request->string('type')->toString() ?: null,
            ],
        ]);
    }
}
