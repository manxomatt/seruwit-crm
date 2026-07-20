<?php

namespace Modules\Tracking\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\TrackingConfig;

class TrackingMapController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * The live fleet map. Reads only the denormalized last fix on each device,
     * so refreshing this page never touches the position history table.
     */
    public function index(): Response
    {
        $user = Auth::user();
        $config = TrackingConfig::current();

        $devices = GpsDevice::query()
            ->with('vehicle:id,name,plate_number,status')
            ->paired()
            ->whereNotNull('last_latitude')
            ->orderBy('name')
            ->get();

        return Inertia::render('Modules/Tracking/Map', [
            'devices' => $devices,
            'pollEnabled' => $config->poll_enabled,
            'lastPolledAt' => $config->last_polled_at?->toDateTimeString(),
            'lastPollError' => $config->last_poll_error,
            'can' => [
                'update' => $user->hasPermissionFor('tracking', 'update'),
            ],
        ]);
    }
}
