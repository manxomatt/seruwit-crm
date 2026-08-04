<?php

namespace Modules\Tracking\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Support\TrackingTimezone;

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

        // Every device that has reported a fix, paired or not: right after a
        // sync the whole fleet is unpaired, and a map that hid it would look
        // broken. Paired devices carry their vehicle's name; the rest fall back
        // to the device name and are flagged unpaired on the client.
        $devices = GpsDevice::query()
            ->with('vehicle:id,name,plate_number,status')
            ->whereNotNull('last_latitude')
            ->orderBy('name')
            ->get();

        $activeRentalVehicleIds = [];

        if (Modules::available('rental') && class_exists(\Modules\Rental\Models\Rental::class)) {
            $activeRentalVehicleIds = \Modules\Rental\Models\Rental::query()
                ->where('status', \Modules\Rental\Models\Rental::STATUS_ACTIVE)
                ->pluck('vehicle_id')
                ->map(fn ($id) => (int) $id)
                ->values()
                ->all();
        }

        return Inertia::render('Modules/Tracking/Map', [
            'devices' => $config->usesGpsServer()
                ? $devices->map(fn (GpsDevice $device) => $this->deviceForGpsServerMap($device))->values()->all()
                : $devices,
            'pairableVehicles' => Vehicle::query()
                ->whereDoesntHave('gpsDevice')
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'odometer_km']),
            'activeRentalVehicleIds' => $activeRentalVehicleIds,
            'rentalFilterAvailable' => Modules::available('rental'),
            'pollEnabled' => $config->poll_enabled,
            'lastPolledAt' => $config->usesGpsServer()
                ? TrackingTimezone::formatForDisplay($config->last_polled_at)
                : $config->last_polled_at?->toDateTimeString(),
            'lastPollError' => $config->last_poll_error,
            'can' => [
                'update' => $user->hasPermissionFor('tracking', 'update'),
            ],
        ]);
    }

    /**
     * GPS-Server stores UTC instants; present them in the tenant's general
     * timezone so the map timestamps match Settings → Timezone.
     *
     * @return array<string, mixed>
     */
    private function deviceForGpsServerMap(GpsDevice $device): array
    {
        return [
            ...$device->toArray(),
            'last_recorded_at' => TrackingTimezone::formatForDisplay($device->last_recorded_at),
            'last_seen_at' => TrackingTimezone::formatForDisplay($device->last_seen_at),
            'last_polled_at' => TrackingTimezone::formatForDisplay($device->last_polled_at),
            'vehicle' => $device->vehicle,
        ];
    }
}
