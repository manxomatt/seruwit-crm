<?php

namespace Modules\Tracking\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Exceptions\TraccarException;
use Modules\Tracking\Http\Requests\PairGpsDeviceRequest;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Services\TraccarClient;

class GpsDeviceController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display the tenant's trackers and what they are paired to.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $search = trim((string) $request->input('search', ''));

        return Inertia::render('Modules/Tracking/Devices/Index', [
            'devices' => GpsDevice::query()
                ->with('vehicle:id,name,plate_number')
                ->when($search !== '', function ($query) use ($search) {
                    $like = '%'.$search.'%';

                    $query->where(function ($q) use ($like) {
                        $q->where('name', 'ilike', $like)
                            ->orWhere('unique_id', 'ilike', $like)
                            ->orWhereHas('vehicle', function ($vehicleQuery) use ($like) {
                                $vehicleQuery->where(function ($vq) use ($like) {
                                    $vq->where('name', 'ilike', $like)
                                        ->orWhere('plate_number', 'ilike', $like);
                                });
                            });
                    });
                })
                ->orderBy('name')
                ->paginate(15)
                ->withQueryString(),
            // Only vehicles without a tracker: a vehicle carries at most one.
            'pairableVehicles' => Vehicle::query()
                ->whereDoesntHave('gpsDevice')
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'odometer_km']),
            'filters' => [
                'search' => $search !== '' ? $search : null,
            ],
            'can' => [
                'create' => $user->hasPermissionFor('tracking', 'create'),
                'update' => $user->hasPermissionFor('tracking', 'update'),
                'delete' => $user->hasPermissionFor('tracking', 'delete'),
            ],
        ]);
    }

    /**
     * Import the device list from Traccar. Existing rows are updated rather
     * than replaced so pairings and odometer baselines survive a re-sync.
     */
    public function sync(): RedirectResponse
    {
        $config = TrackingConfig::current();

        if (! $config->isConfigured()) {
            return back()->with('error', __('tracking.messages.configure_first'));
        }

        try {
            $devices = (new TraccarClient($config))->devices();
        } catch (TraccarException $e) {
            return back()->with('error', $e->getMessage());
        }

        $synced = 0;

        foreach ($devices as $device) {
            $traccarId = Arr::get($device, 'id');
            $uniqueId = Arr::get($device, 'uniqueId');

            if (! is_numeric($traccarId) || ! filled($uniqueId)) {
                continue;
            }

            GpsDevice::updateOrCreate(
                ['traccar_device_id' => (int) $traccarId],
                [
                    'unique_id' => (string) $uniqueId,
                    'name' => (string) (Arr::get($device, 'name') ?: $uniqueId),
                    'status' => Arr::get($device, 'status'),
                ],
            );

            $synced++;
        }

        return back()->with('success', __('tracking.messages.synced', ['count' => $synced]));
    }

    /**
     * Pair a device to a vehicle, capturing the vehicle's current odometer as
     * the baseline every future GPS kilometre is added to.
     */
    public function pair(PairGpsDeviceRequest $request, GpsDevice $device): RedirectResponse
    {
        if ($device->vehicle_id !== null) {
            return back()->with('error', __('tracking.messages.already_paired'));
        }

        $vehicle = Vehicle::findOrFail($request->validated()['vehicle_id']);

        if ($vehicle->gpsDevice()->exists()) {
            return back()->with('error', __('tracking.messages.vehicle_has_tracker'));
        }

        $device->update([
            'vehicle_id' => $vehicle->id,
            'odometer_base_km' => $vehicle->odometer_km,
            'accumulated_distance_m' => 0,
            // Dropped so the first poll after pairing measures from this
            // moment rather than crediting the vehicle with the tracker's
            // entire previous life.
            'traccar_total_distance_m' => null,
        ]);

        return back()->with('success', __('tracking.messages.paired', ['vehicle' => $vehicle->name]));
    }

    /**
     * Detach a device from its vehicle. History keeps its own vehicle snapshot,
     * so past positions stay attributed correctly.
     */
    public function unpair(GpsDevice $device): RedirectResponse
    {
        $device->update([
            'vehicle_id' => null,
            'accumulated_distance_m' => 0,
            'odometer_base_km' => 0,
            'traccar_total_distance_m' => null,
        ]);

        return back()->with('success', __('tracking.messages.unpaired'));
    }

    /**
     * Remove a device and its position history.
     */
    public function destroy(GpsDevice $device): RedirectResponse
    {
        if ($device->vehicle_id !== null) {
            return back()->with('error', __('tracking.messages.unpair_before_delete'));
        }

        $device->delete();

        return redirect()->route($this->getRoutePrefix().'.tracking.devices.index')
            ->with('success', __('tracking.messages.deleted'));
    }
}
