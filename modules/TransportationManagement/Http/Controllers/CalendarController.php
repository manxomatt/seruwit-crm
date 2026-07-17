<?php

namespace Modules\TransportationManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Modules\TransportationManagement\Models\Trip;

class CalendarController extends Controller
{
    public const VIEWS = ['week', 'month', 'year'];

    /**
     * Display trips for a given period (week, month, or year), grouped by date.
     * The period boundaries are derived from the `date` anchor so the frontend
     * only ever needs to send a single date, regardless of view.
     */
    public function index(): Response
    {
        $view = request('view', 'month');
        $view = in_array($view, self::VIEWS, true) ? $view : 'month';

        $date = Carbon::parse(request('date', now()->toDateString()));

        [$start, $end] = match ($view) {
            'week' => [$date->copy()->startOfWeek(Carbon::SUNDAY), $date->copy()->endOfWeek(Carbon::SATURDAY)],
            'year' => [$date->copy()->startOfYear(), $date->copy()->endOfYear()],
            default => [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()],
        };

        $trips = Trip::query()
            ->with(['vehicle:id,name,plate_number', 'driver:id,name'])
            ->whereBetween('scheduled_at', [$start->startOfDay(), $end->endOfDay()])
            ->orderBy('scheduled_at')
            ->get()
            ->groupBy(fn (Trip $trip) => $trip->scheduled_at->toDateString());

        return Inertia::render('Modules/TransportationManagement/Calendar/Index', [
            'view' => $view,
            'date' => $date->toDateString(),
            'tripsByDate' => $trips,
        ]);
    }
}
