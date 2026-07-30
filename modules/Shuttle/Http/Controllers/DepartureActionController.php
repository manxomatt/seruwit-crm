<?php

namespace Modules\Shuttle\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\Shuttle\Support\DepartureDispatchService;
use Modules\Shuttle\Support\DepartureRouteOptimizer;
use Throwable;

class DepartureActionController extends Controller
{
    public function lock(ShuttleDeparture $departure, DepartureDispatchService $dispatch): RedirectResponse
    {
        try {
            $dispatch->lock($departure);
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', __('shuttle.messages.departure_locked'));
    }

    public function optimize(ShuttleDeparture $departure, DepartureRouteOptimizer $optimizer): RedirectResponse
    {
        try {
            $result = $optimizer->optimize($departure);
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        $message = __('shuttle.messages.departure_optimized', [
            'stops' => $result['stop_count'],
            'km' => $result['total_distance_km'],
        ]);

        if (($result['estimated_duration_minutes'] ?? null) !== null) {
            $message .= ' '.__('shuttle.messages.optimize_eta', [
                'minutes' => $result['estimated_duration_minutes'],
            ]);
        }

        if (! empty($result['used_osrm'])) {
            $message .= ' '.__('shuttle.messages.optimize_osrm');
        }

        if ($result['unassigned'] !== []) {
            $message .= ' '.__('shuttle.messages.optimize_unassigned', [
                'items' => implode(', ', $result['unassigned']),
            ]);
        }

        return back()->with('success', $message);
    }

    public function dispatch(Request $request, ShuttleDeparture $departure, DepartureDispatchService $dispatch): RedirectResponse
    {
        $data = $request->validate([
            'vehicle_id' => ['nullable', 'exists:vehicles,id'],
            'driver_id' => ['nullable', 'exists:drivers,id'],
        ]);

        try {
            $dispatch->dispatch($departure, $data);
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', __('shuttle.messages.departure_dispatched'));
    }

    public function complete(ShuttleDeparture $departure, DepartureDispatchService $dispatch): RedirectResponse
    {
        try {
            $dispatch->complete($departure);
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', __('shuttle.messages.departure_completed'));
    }
}
