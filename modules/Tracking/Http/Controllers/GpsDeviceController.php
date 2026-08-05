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
use Modules\Tracking\Exceptions\GpsProviderException;
use Modules\Tracking\Http\Requests\PairGpsDeviceRequest;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\GpsSource;
use Modules\Tracking\Services\GpsProviderFactory;

class GpsDeviceController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        $user = Auth::user();
        $search = trim((string) $request->input('search', ''));
        $sourceId = $request->integer('source_id') ?: null;

        return Inertia::render('Modules/Tracking/Devices/Index', [
            'devices' => GpsDevice::query()
                ->with(['vehicle:id,name,plate_number', 'source:id,name,provider'])
                ->when($sourceId, fn ($query) => $query->where('gps_source_id', $sourceId))
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
            'pairableVehicles' => Vehicle::query()
                ->whereDoesntHave('gpsDevice')
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'odometer_km']),
            'sources' => GpsSource::query()
                ->orderBy('name')
                ->get(['id', 'name', 'provider']),
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'source_id' => $sourceId,
            ],
            'can' => [
                'create' => $user->hasPermissionFor('tracking', 'create'),
                'update' => $user->hasPermissionFor('tracking', 'update'),
                'delete' => $user->hasPermissionFor('tracking', 'delete'),
            ],
        ]);
    }

    public function sync(Request $request, GpsProviderFactory $providers): RedirectResponse
    {
        $sourceId = $request->integer('source_id') ?: null;

        $sources = GpsSource::query()
            ->when($sourceId, fn ($query) => $query->whereKey($sourceId))
            ->get()
            ->filter(fn (GpsSource $source) => $source->isConfigured());

        if ($sources->isEmpty()) {
            return back()->with('error', __('tracking.messages.configure_first'));
        }

        $synced = 0;

        try {
            foreach ($sources as $source) {
                $synced += $this->syncSource($source, $providers);
            }
        } catch (GpsProviderException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', __('tracking.messages.synced', ['count' => $synced]));
    }

    /**
     * @throws GpsProviderException
     */
    private function syncSource(GpsSource $source, GpsProviderFactory $providers): int
    {
        $client = $providers->make($source);

        if ($source->usesTraccar()) {
            return $this->syncFromTraccar($source, $client->listDevices());
        }

        return $this->syncImeiObjects($source, $client->listDevices());
    }

    /**
     * @param  array<int, array<string, mixed>>  $devices
     */
    private function syncFromTraccar(GpsSource $source, array $devices): int
    {
        $synced = 0;

        foreach ($devices as $device) {
            $externalId = Arr::get($device, 'id');
            $uniqueId = Arr::get($device, 'uniqueId');

            if (! is_numeric($externalId) || ! filled($uniqueId)) {
                continue;
            }

            GpsDevice::updateOrCreate(
                [
                    'gps_source_id' => $source->id,
                    'external_device_id' => (int) $externalId,
                ],
                [
                    'unique_id' => (string) $uniqueId,
                    'name' => (string) (Arr::get($device, 'name') ?: $uniqueId),
                    'status' => Arr::get($device, 'status'),
                ],
            );

            $synced++;
        }

        return $synced;
    }

    /**
     * @param  array<int, array<string, mixed>>  $objects
     */
    private function syncImeiObjects(GpsSource $source, array $objects): int
    {
        $synced = 0;

        foreach ($objects as $object) {
            $imei = trim((string) Arr::get($object, 'imei', ''));

            if ($imei === '' || ! ctype_digit($imei)) {
                continue;
            }

            $active = filter_var(Arr::get($object, 'active'), FILTER_VALIDATE_BOOLEAN);

            GpsDevice::updateOrCreate(
                [
                    'gps_source_id' => $source->id,
                    'external_device_id' => (int) $imei,
                ],
                [
                    'unique_id' => $imei,
                    'name' => (string) (Arr::get($object, 'name') ?: $imei),
                    'status' => $active ? 'online' : 'offline',
                ],
            );

            $synced++;
        }

        return $synced;
    }

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
            'provider_total_distance_m' => null,
        ]);

        return back()->with('success', __('tracking.messages.paired', ['vehicle' => $vehicle->name]));
    }

    public function unpair(GpsDevice $device): RedirectResponse
    {
        $device->update([
            'vehicle_id' => null,
            'accumulated_distance_m' => 0,
            'odometer_base_km' => 0,
            'provider_total_distance_m' => null,
        ]);

        return back()->with('success', __('tracking.messages.unpaired'));
    }

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
