<?php

namespace Modules\Shuttle\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttleCorridor;
use Modules\Shuttle\Models\ShuttleDeparture;

class ShuttleDashboardController extends Controller
{
    public function index(): Response
    {
        $today = today()->toDateString();

        return Inertia::render('Modules/Shuttle/Dashboard', [
            'stats' => [
                'corridors' => ShuttleCorridor::query()->where('is_active', true)->count(),
                'departures_today' => ShuttleDeparture::query()->whereDate('depart_date', $today)->count(),
                'open_departures' => ShuttleDeparture::query()->where('status', ShuttleDeparture::STATUS_OPEN)->count(),
                'bookings_today' => ShuttleBooking::query()->whereDate('created_at', $today)->count(),
            ],
            'upcomingDepartures' => ShuttleDeparture::query()
                ->with(['corridor', 'vehicle', 'driver'])
                ->whereDate('depart_date', '>=', $today)
                ->whereNotIn('status', [ShuttleDeparture::STATUS_CANCELLED, ShuttleDeparture::STATUS_COMPLETED])
                ->orderBy('depart_date')
                ->orderBy('depart_time')
                ->limit(10)
                ->get(),
            'can' => [
                'create' => auth()->user()?->hasPermissionFor('shuttle', 'create') ?? false,
                'optimize' => auth()->user()?->hasPermissionFor('shuttle', 'optimize') ?? false,
            ],
        ]);
    }
}
