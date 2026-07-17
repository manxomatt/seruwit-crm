<?php

namespace Modules\TransportationManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Modules\TransportationManagement\Models\Trip;

class CalendarController extends Controller
{
    /**
     * Display trips for a given month, grouped by date.
     */
    public function index(): Response
    {
        $month = Carbon::parse(request('month', now()->toDateString()).'-01');
        $start = $month->copy()->startOfMonth();
        $end = $month->copy()->endOfMonth();

        $trips = Trip::query()
            ->with(['vehicle:id,name,plate_number', 'driver:id,name'])
            ->whereBetween('scheduled_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->orderBy('scheduled_at')
            ->get()
            ->groupBy(fn (Trip $trip) => $trip->scheduled_at->toDateString());

        return Inertia::render('Modules/TransportationManagement/Calendar/Index', [
            'month' => $month->format('Y-m'),
            'tripsByDate' => $trips,
        ]);
    }
}
