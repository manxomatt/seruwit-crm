<?php

namespace Modules\Tracking\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Models\VehiclePosition;
use Modules\Tracking\Support\PositionTrail;

class TrackingHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $request->validate([
            'vehicle_id' => ['nullable', 'integer', 'exists:vehicles,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $vehicleId = $request->integer('vehicle_id') ?: null;
        $from = Carbon::parse($request->input('from', now()->startOfDay()->toDateTimeString()));
        $to = Carbon::parse($request->input('to', now()->toDateTimeString()));

        if ($to->lt($from)) {
            $to = $from->copy();
        }

        $trail = [];
        $stats = [
            'points' => 0,
            'distance_km' => 0.0,
            'max_speed_kph' => 0.0,
        ];

        if ($vehicleId) {
            $positions = VehiclePosition::query()
                ->where('vehicle_id', $vehicleId)
                ->whereBetween('recorded_at', [$from, $to])
                ->orderBy('recorded_at')
                ->get();

            $thinned = PositionTrail::thin($positions);
            $stats = [
                'points' => $positions->count(),
                'distance_km' => PositionTrail::distanceKm($positions),
                'max_speed_kph' => round((float) $positions->max('speed_kph'), 1),
            ];

            $trail = $thinned->map(fn (VehiclePosition $position): array => [
                'lat' => (float) $position->latitude,
                'lng' => (float) $position->longitude,
                'speed_kph' => $position->speed_kph !== null ? (float) $position->speed_kph : null,
                'recorded_at' => $position->recorded_at?->toDateTimeString(),
            ])->values()->all();
        }

        return Inertia::render('Modules/Tracking/History', [
            'vehicles' => Vehicle::query()
                ->whereHas('gpsDevice')
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number']),
            'filters' => [
                'vehicle_id' => $vehicleId,
                'from' => $from->toDateTimeString(),
                'to' => $to->toDateTimeString(),
            ],
            'trail' => $trail,
            'stats' => $stats,
        ]);
    }
}
