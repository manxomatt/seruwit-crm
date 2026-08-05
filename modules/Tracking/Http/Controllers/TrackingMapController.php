<?php

namespace Modules\Tracking\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\GpsSource;
use Modules\Tracking\Support\TrackingTimezone;

class TrackingMapController extends Controller
{
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
        $sources = GpsSource::query()->orderBy('name')->get();
        $pollEnabled = $sources->contains(fn (GpsSource $source) => $source->poll_enabled && $source->isConfigured());
        $lastPolledAt = $sources->max('last_polled_at');
        $lastPollError = $sources
            ->filter(fn (GpsSource $source) => filled($source->last_poll_error))
            ->sortByDesc('last_polled_at')
            ->first()
            ?->last_poll_error;
        $hasGpsServerSource = $sources->contains(fn (GpsSource $source) => $source->usesGpsServer());

        $devices = GpsDevice::query()
            ->with(['vehicle:id,name,plate_number,status', 'source:id,name,provider'])
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
            'devices' => $hasGpsServerSource
                ? $devices->map(fn (GpsDevice $device) => $this->deviceForGpsServerMap($device))->values()->all()
                : $devices,
            'pairableVehicles' => Vehicle::query()
                ->whereDoesntHave('gpsDevice')
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'odometer_km']),
            'activeRentalVehicleIds' => $activeRentalVehicleIds,
            'rentalFilterAvailable' => Modules::available('rental'),
            'pollEnabled' => $pollEnabled,
            'lastPolledAt' => $hasGpsServerSource
                ? TrackingTimezone::formatForDisplay($lastPolledAt)
                : $lastPolledAt?->toDateTimeString(),
            'lastPollError' => $lastPollError,
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
        $payload = $device->toArray();
        $payload['last_recorded_at'] = TrackingTimezone::formatForDisplay($device->last_recorded_at);
        $payload['last_polled_at'] = TrackingTimezone::formatForDisplay($device->last_polled_at);
        $payload['last_seen_at'] = TrackingTimezone::formatForDisplay($device->last_seen_at);

        return $payload;
    }
}
