<?php

namespace Modules\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Http\Requests\StoreFuelLogRequest;
use Modules\Fleet\Models\FuelLog;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\FuelLogRecorder;

class FuelLogController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Fleet-wide fuel log index with anomaly filter.
     */
    public function index(Request $request): Response
    {
        $logs = FuelLog::query()
            ->with(['vehicle:id,name,plate_number', 'driver:id,name'])
            ->when($request->integer('vehicle_id'), fn ($q, $id) => $q->where('vehicle_id', $id))
            ->when($request->boolean('anomalies_only'), fn ($q) => $q->whereNotNull('anomaly_flags'))
            ->latest('filled_at')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Modules/Fleet/Fuel/Index', [
            'logs' => $logs,
            'vehicles' => Vehicle::query()->orderBy('name')->get(['id', 'name', 'plate_number']),
            'filters' => [
                'vehicle_id' => $request->integer('vehicle_id') ?: null,
                'anomalies_only' => $request->boolean('anomalies_only'),
            ],
            'can' => [
                'create' => $request->user()?->hasPermissionFor('fleet', 'create') ?? false,
            ],
        ]);
    }

    public function store(
        StoreFuelLogRequest $request,
        Vehicle $vehicle,
        FuelLogRecorder $recorder,
    ): RedirectResponse {
        $log = $recorder->record($vehicle, $request->validated());

        $message = $log->hasAnomalies()
            ? __('fleet.messages.fuel_added_anomaly')
            : __('fleet.messages.fuel_added');

        return redirect()->route($this->getRoutePrefix().'.fleet.vehicles.show', $vehicle)
            ->with($log->hasAnomalies() ? 'warning' : 'success', $message);
    }

    public function destroy(Vehicle $vehicle, FuelLog $fuelLog): RedirectResponse
    {
        if ($fuelLog->vehicle_id !== $vehicle->id) {
            abort(404);
        }

        $fuelLog->delete();

        return redirect()->route($this->getRoutePrefix().'.fleet.vehicles.show', $vehicle)
            ->with('success', __('fleet.messages.fuel_deleted'));
    }

    /**
     * Suggested odometer when opening the fill form (GPS-backed vehicle reading).
     *
     * @return array{odometer_km: int, odometer_source: string, tracking_enabled: bool}
     */
    public function suggestOdometer(Vehicle $vehicle, FuelLogRecorder $recorder): array
    {
        $trackingEnabled = Modules::available('tracking');
        if ($trackingEnabled) {
            $vehicle->loadMissing('gpsDevice');
        }

        return [
            'odometer_km' => (int) $vehicle->odometer_km,
            'odometer_source' => $recorder->suggestOdometerSource($vehicle),
            'tracking_enabled' => $trackingEnabled,
        ];
    }
}
