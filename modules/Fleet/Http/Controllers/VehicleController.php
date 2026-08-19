<?php

namespace Modules\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Http\Requests\BatchDeleteVehiclesRequest;
use Modules\Fleet\Http\Requests\BatchUpdateVehicleStatusRequest;
use Modules\Fleet\Http\Requests\StoreVehicleRequest;
use Modules\Fleet\Http\Requests\UpdateVehicleRequest;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\AccessibleFleetBases;
use Modules\Fleet\Support\FuelConsumptionCalculator;
use Modules\Fleet\Support\FuelLogRecorder;
use Modules\Maintenance\Models\WorkOrder;

class VehicleController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the vehicles.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $vehicles = Vehicle::query()
            ->with('homeBase:id,code,name')
            ->when(request('search'), function ($query, $search) {
                $like = "%{$search}%";

                $query->where(function ($q) use ($like) {
                    $q->where('name', 'ilike', $like)
                        ->orWhere('plate_number', 'ilike', $like)
                        ->orWhere('brand', 'ilike', $like)
                        ->orWhere('color', 'ilike', $like);
                });
            })
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->when(request('type'), fn ($query, $type) => $query->where('type', $type))
            ->when(request('home_base_id'), fn ($query, $baseId) => $query->where('home_base_id', $baseId))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Fleet/Vehicles/Index', [
            'vehicles' => $vehicles,
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
                'type' => request('type'),
                'home_base_id' => request('home_base_id'),
            ],
            'bases' => $this->homeBaseOptions(),
            'can' => [
                'create' => $user->hasPermissionFor('fleet', 'create'),
                'update' => $user->hasPermissionFor('fleet', 'update'),
                'delete' => $user->hasPermissionFor('fleet', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new vehicle.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Fleet/Vehicles/Create', [
            'bases' => $this->homeBaseOptions(),
        ]);
    }

    /**
     * Store a newly created vehicle in storage.
     */
    public function store(StoreVehicleRequest $request): RedirectResponse
    {
        $vehicle = Vehicle::create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.fleet.vehicles.show', $vehicle)
            ->with('success', __('fleet.messages.vehicle_created'));
    }

    /**
     * Display the specified vehicle.
     */
    public function show(Vehicle $vehicle, FuelConsumptionCalculator $calculator, FuelLogRecorder $recorder): Response
    {
        $user = Auth::user();

        $maintenanceEnabled = Modules::available('maintenance');

        $vehicle->load(['fuelLogs.driver', 'homeBase:id,code,name']);

        if (! $maintenanceEnabled) {
            $vehicle->load(['maintenanceLogs']);
        }

        $trackingEnabled = Modules::available('tracking');

        if ($trackingEnabled) {
            $vehicle->load('gpsDevice');
        }

        return Inertia::render('Modules/Fleet/Vehicles/Show', [
            'vehicle' => $vehicle,
            'trackingEnabled' => $trackingEnabled,
            'documentsEnabled' => Modules::available('document'),
            'documentSummary' => $this->vehicleDocumentSummary($vehicle),
            'maintenanceEnabled' => $maintenanceEnabled,
            'serviceHistory' => $maintenanceEnabled
                ? WorkOrder::query()
                    ->where('vehicle_id', $vehicle->id)
                    ->with('category:id,name')
                    ->latest('completed_at')
                    ->latest('id')
                    ->limit(50)
                    ->get([
                        'id',
                        'reference_number',
                        'title',
                        'status',
                        'type',
                        'category_id',
                        'scheduled_date',
                        'completed_at',
                        'actual_labor_cost',
                        'actual_parts_cost',
                        'vendor_name',
                        'mechanic_name',
                    ])
                    ->map(fn (WorkOrder $wo): array => [
                        'id' => $wo->id,
                        'reference_number' => $wo->reference_number,
                        'title' => $wo->title,
                        'status' => $wo->status,
                        'type' => $wo->type,
                        'category' => $wo->category?->name,
                        'scheduled_date' => $wo->scheduled_date?->toDateString(),
                        'completed_at' => $wo->completed_at?->toDateString(),
                        'total_cost' => $wo->actual_total_cost,
                        'vendor_name' => $wo->vendor_name,
                        'mechanic_name' => $wo->mechanic_name,
                    ])
                : null,
            'fuelSummary' => [
                'average_km_per_liter' => $calculator->recentAverageKmPerLiter($vehicle),
                'expected_km_per_liter' => $vehicle->expected_km_per_liter !== null
                    ? (float) $vehicle->expected_km_per_liter
                    : null,
                'anomaly_count' => $vehicle->fuelLogs->filter(fn ($log) => $log->hasAnomalies())->count(),
                'suggested_odometer_km' => (int) $vehicle->odometer_km,
                'suggested_odometer_source' => $recorder->suggestOdometerSource($vehicle),
            ],
            'drivers' => Driver::query()->orderBy('name')->get(['id', 'name']),
            'aiPredictiveEnabled' => \App\Support\CentralAiSettings::isEnabled() && $maintenanceEnabled && class_exists(\Modules\Maintenance\Support\MaintenanceSettings::class) && \Modules\Maintenance\Support\MaintenanceSettings::aiPredictiveMaintenanceEnabled(),
            'aiDiagnoseUrl' => $maintenanceEnabled ? route('module.maintenance.ai_predictive_vehicle', $vehicle) : null,
            'aiCreateWoUrl' => $maintenanceEnabled ? route('module.maintenance.ai_predictive_create_wo') : null,
            'can' => [
                'update' => $user->hasPermissionFor('fleet', 'update'),
                'delete' => $user->hasPermissionFor('fleet', 'delete'),
                'create' => $user->hasPermissionFor('fleet', 'create'),
            ],
        ]);
    }

    /**
     * @return array{total: int, expired: int, expiring_soon: int, nearest_expiry: string|null}|null
     */
    private function vehicleDocumentSummary(Vehicle $vehicle): ?array
    {
        if (! Modules::available('document') || ! Schema::hasTable('documents')) {
            return null;
        }

        $documents = \Modules\Document\Models\Document::query()
            ->where('documentable_type', 'vehicle')
            ->where('documentable_id', $vehicle->id)
            ->get(['id', 'expires_at']);

        if ($documents->isEmpty()) {
            return [
                'total' => 0,
                'expired' => 0,
                'expiring_soon' => 0,
                'nearest_expiry' => null,
            ];
        }

        $expired = 0;
        $expiring = 0;
        $nearest = null;

        foreach ($documents as $document) {
            $status = $document->status;
            if ($status === \Modules\Document\Models\Document::STATUS_EXPIRED) {
                $expired++;
            } elseif ($status === \Modules\Document\Models\Document::STATUS_EXPIRING_SOON) {
                $expiring++;
            }

            if ($document->expires_at !== null) {
                $date = $document->expires_at->toDateString();
                if ($nearest === null || $date < $nearest) {
                    $nearest = $date;
                }
            }
        }

        return [
            'total' => $documents->count(),
            'expired' => $expired,
            'expiring_soon' => $expiring,
            'nearest_expiry' => $nearest,
        ];
    }

    /**
     * Show the form for editing the specified vehicle.
     */
    public function edit(Vehicle $vehicle): Response
    {
        return Inertia::render('Modules/Fleet/Vehicles/Edit', [
            'vehicle' => $vehicle,
            'bases' => $this->homeBaseOptions(),
        ]);
    }

    /**
     * @return list<array{id: int, code: string, name: string}>
     */
    private function homeBaseOptions(): array
    {
        return AccessibleFleetBases::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'code', 'name'])
            ->map(fn ($base): array => [
                'id' => (int) $base->id,
                'code' => $base->code,
                'name' => $base->name,
            ])
            ->all();
    }

    /**
     * Update the specified vehicle in storage.
     */
    public function update(UpdateVehicleRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $vehicle->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.fleet.vehicles.show', $vehicle)
            ->with('success', __('fleet.messages.vehicle_updated'));
    }

    /**
     * Remove the specified vehicle from storage.
     *
     * Fleet has no knowledge of Trip or any other module that might reference
     * this vehicle, so it cannot check "is this vehicle busy" itself — the
     * database's own foreign key constraint is what stops the delete, and this
     * just turns that into a readable message instead of a 500. The delete is
     * wrapped in its own transaction so a constraint violation only rolls back
     * this statement (via a savepoint) instead of poisoning an outer one.
     */
    public function destroy(Vehicle $vehicle): RedirectResponse
    {
        try {
            DB::transaction(fn () => $vehicle->delete());
        } catch (QueryException) {
            return back()->with('error', __('fleet.messages.vehicle_in_use'));
        }

        return redirect()->route($this->getRoutePrefix().'.fleet.vehicles.index')
            ->with('success', __('fleet.messages.vehicle_deleted'));
    }

    /**
     * Update status for multiple vehicles at once.
     */
    public function batchUpdateStatus(BatchUpdateVehicleStatusRequest $request): RedirectResponse
    {
        /** @var list<int> $ids */
        $ids = array_map('intval', $request->validated('ids'));
        $status = $request->validated('status');

        $updated = Vehicle::query()
            ->whereIn('id', $ids)
            ->update(['status' => $status]);

        return back()->with('success', __('fleet.messages.vehicles_status_updated', [
            'count' => $updated,
            'status' => __('fleet.status.'.$status),
        ]));
    }

    /**
     * Delete multiple vehicles, skipping any blocked by foreign-key constraints.
     */
    public function batchDestroy(BatchDeleteVehiclesRequest $request): RedirectResponse
    {
        /** @var list<int> $ids */
        $ids = array_map('intval', $request->validated('ids'));

        $deleted = 0;
        $blocked = 0;

        $vehicles = Vehicle::query()->whereIn('id', $ids)->get();

        foreach ($vehicles as $vehicle) {
            try {
                DB::transaction(fn () => $vehicle->delete());
                $deleted++;
            } catch (QueryException) {
                $blocked++;
            }
        }

        if ($deleted === 0 && $blocked > 0) {
            return back()->with('error', __('fleet.messages.vehicles_batch_delete_blocked', [
                'blocked' => $blocked,
            ]));
        }

        if ($blocked > 0) {
            return back()->with('success', __('fleet.messages.vehicles_batch_deleted_partial', [
                'deleted' => $deleted,
                'blocked' => $blocked,
            ]));
        }

        return back()->with('success', __('fleet.messages.vehicles_batch_deleted', [
            'count' => $deleted,
        ]));
    }
}
