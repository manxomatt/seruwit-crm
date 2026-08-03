<?php

namespace Modules\Maintenance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Facades\Modules;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Http\Requests\StoreWorkOrderRequest;
use Modules\Maintenance\Http\Requests\UpdateWorkOrderRequest;
use Modules\Maintenance\Http\Requests\UpdateWorkOrderStatusRequest;
use Modules\Maintenance\Models\MaintenanceBay;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Maintenance\Models\WorkOrderItem;
use Modules\Maintenance\Support\MaintenanceStockRecorder;
use Modules\Maintenance\Support\WorkOrderVehicleStatusSyncer;
use Modules\Partners\Models\Partner;

class WorkOrderController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $user = Auth::user();

        $workOrders = WorkOrder::query()
            ->with(['vehicle', 'category', 'mechanic', 'vendorPartner'])
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('reference_number', 'like', "%{$search}%")
                        ->orWhereHas('vehicle', fn ($vq) => $vq->where('name', 'like', "%{$search}%")
                            ->orWhere('plate_number', 'like', "%{$search}%"));
                });
            })
            ->when(request('status'), fn ($q, $s) => $q->where('status', $s))
            ->when(request('priority'), fn ($q, $p) => $q->where('priority', $p))
            ->when(request('vehicle_id'), fn ($q, $v) => $q->where('vehicle_id', $v))
            ->orderByRaw("CASE status WHEN 'in_progress' THEN 0 WHEN 'approved' THEN 1 WHEN 'pending' THEN 2 WHEN 'draft' THEN 3 ELSE 4 END")
            ->orderBy('scheduled_date')
            ->paginate(20)
            ->withQueryString();

        $vehicles = Vehicle::query()->select('id', 'name', 'plate_number')->orderBy('name')->get();

        return Inertia::render('Modules/Maintenance/WorkOrders/Index', [
            'workOrders' => $workOrders,
            'vehicles' => $vehicles,
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
                'priority' => request('priority'),
                'vehicle_id' => request('vehicle_id'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('maintenance', 'create'),
                'update' => $user->hasPermissionFor('maintenance', 'update'),
                'delete' => $user->hasPermissionFor('maintenance', 'delete'),
                'approve' => $user->hasPermissionFor('maintenance', 'approve'),
            ],
        ]);
    }

    public function create(): Response
    {
        $vehicles = Vehicle::query()->select('id', 'name', 'plate_number', 'odometer_km')->orderBy('name')->get();
        $categories = MaintenanceCategory::query()->orderBy('sort_order')->get();

        return Inertia::render('Modules/Maintenance/WorkOrders/Create', [
            'vehicles' => $vehicles,
            'categories' => $categories,
            'spareParts' => $this->sparePartOptions(),
            'vendors' => $this->vendorOptions(),
            'mechanics' => $this->mechanicOptions(),
            'bays' => $this->bayOptions(),
        ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function sparePartOptions(): Collection
    {
        if (! Modules::available('inventory')) {
            return collect();
        }

        return \Modules\Product\Models\Product::query()
            ->where('category', 'fleet_sparepart')
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(fn ($product): array => [
                'id' => $product->id,
                'name' => $product->name,
                'unit' => $product->unit,
                'price' => $product->price,
                'warehouse_id' => $product->warehouse_id,
            ]);
    }

    /**
     * @return Collection<int, array{id: int, name: string, code: string|null}>
     */
    private function vendorOptions(): Collection
    {
        return Partner::query()
            ->where('status', 'active')
            ->where(function ($query): void {
                $query->where('supplier_rank', '>', 0)
                    ->orWhere('sub_type', 'supplier');
            })
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn (Partner $partner): array => [
                'id' => $partner->id,
                'name' => $partner->name,
                'code' => $partner->code,
            ]);
    }

    /**
     * @return Collection<int, array{id: int, name: string}>
     */
    private function mechanicOptions(): Collection
    {
        return User::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
            ]);
    }

    /**
     * @return Collection<int, array{id: int, code: string, name: string}>
     */
    private function bayOptions(): Collection
    {
        return MaintenanceBay::query()
            ->active()
            ->ordered()
            ->get(['id', 'code', 'name'])
            ->map(fn (MaintenanceBay $bay): array => [
                'id' => $bay->id,
                'code' => $bay->code,
                'name' => $bay->name,
            ]);
    }

    public function store(StoreWorkOrderRequest $request): RedirectResponse
    {
        $validated = $this->withRelationLabels($request->validated());
        $items = $validated['items'] ?? [];
        unset($validated['items']);

        $workOrder = DB::transaction(function () use ($validated, $items) {
            $wo = WorkOrder::create([
                ...$validated,
                'reference_number' => WorkOrder::generateReferenceNumber(),
                'created_by' => Auth::id(),
            ]);

            foreach ($items as $item) {
                $wo->items()->create($item);
            }

            $originalStatus = WorkOrder::STATUS_DRAFT;
            if ($wo->status !== $originalStatus) {
                WorkOrderVehicleStatusSyncer::sync($wo, $originalStatus);
                $this->syncStockForStatusChange($wo, $originalStatus);
            }

            return $wo;
        });

        return redirect()->route($this->getRoutePrefix().'.maintenance.work-orders.show', $workOrder)
            ->with('success', __('maintenance.messages.wo_created'));
    }

    public function show(WorkOrder $workOrder): Response
    {
        $user = Auth::user();

        $workOrder->load([
            'vehicle',
            'category',
            'items',
            'checklistItems',
            'creator',
            'approver',
            'mechanic',
            'vendorPartner',
            'bay',
        ]);

        return Inertia::render('Modules/Maintenance/WorkOrders/Show', [
            'workOrder' => array_merge($workOrder->toArray(), [
                'actual_total_cost' => $workOrder->actual_total_cost,
            ]),
            'can' => [
                'update' => $user->hasPermissionFor('maintenance', 'update'),
                'delete' => $user->hasPermissionFor('maintenance', 'delete'),
                'approve' => $user->hasPermissionFor('maintenance', 'approve'),
                'assign' => $user->hasPermissionFor('maintenance', 'assign')
                    || $user->hasPermissionFor('maintenance', 'update'),
            ],
        ]);
    }

    public function edit(WorkOrder $workOrder): Response
    {
        $workOrder->load(['items']);
        $vehicles = Vehicle::query()->select('id', 'name', 'plate_number', 'odometer_km')->orderBy('name')->get();
        $categories = MaintenanceCategory::query()->orderBy('sort_order')->get();

        return Inertia::render('Modules/Maintenance/WorkOrders/Edit', [
            'workOrder' => $workOrder,
            'vehicles' => $vehicles,
            'categories' => $categories,
            'spareParts' => $this->sparePartOptions(),
            'vendors' => $this->vendorOptions(),
            'mechanics' => $this->mechanicOptions(),
            'bays' => $this->bayOptions(),
        ]);
    }

    public function update(UpdateWorkOrderRequest $request, WorkOrder $workOrder): RedirectResponse
    {
        $validated = $this->withRelationLabels($request->validated());
        $items = $validated['items'] ?? null;
        unset($validated['items']);

        if (($validated['status'] ?? null) === WorkOrder::STATUS_IN_PROGRESS
            && $workOrder->status !== WorkOrder::STATUS_IN_PROGRESS
            && WorkOrderVehicleStatusSyncer::vehicleHasOtherInProgress($workOrder)) {
            return redirect()->route($this->getRoutePrefix().'.maintenance.work-orders.show', $workOrder)
                ->with('error', __('maintenance.messages.vehicle_already_in_workshop'));
        }

        $bayId = $validated['bay_id'] ?? $workOrder->bay_id;
        if (($validated['status'] ?? null) === WorkOrder::STATUS_IN_PROGRESS
            && $workOrder->status !== WorkOrder::STATUS_IN_PROGRESS
            && $bayId
            && WorkOrderVehicleStatusSyncer::bayHasOtherInProgress((int) $bayId, $workOrder)) {
            return redirect()->route($this->getRoutePrefix().'.maintenance.work-orders.show', $workOrder)
                ->with('error', __('maintenance.messages.bay_already_busy'));
        }

        DB::transaction(function () use ($workOrder, $validated, $items): void {
            $originalStatus = $workOrder->status;
            $validated = $this->withStatusSideEffects($workOrder, $validated);

            $workOrder->update($validated);

            if ($items !== null) {
                $existingIds = collect($items)->pluck('id')->filter()->all();
                $workOrder->items()->whereNotIn('id', $existingIds)->delete();

                foreach ($items as $itemData) {
                    if (! empty($itemData['id'])) {
                        WorkOrderItem::where('id', $itemData['id'])
                            ->where('work_order_id', $workOrder->id)
                            ->update($itemData);
                    } else {
                        $workOrder->items()->create($itemData);
                    }
                }
            }

            WorkOrderVehicleStatusSyncer::sync($workOrder->fresh(), $originalStatus);
            $this->syncStockForStatusChange($workOrder->fresh(), $originalStatus);
        });

        return redirect()->route($this->getRoutePrefix().'.maintenance.work-orders.show', $workOrder)
            ->with('success', __('maintenance.messages.wo_updated'));
    }

    public function updateStatus(UpdateWorkOrderStatusRequest $request, WorkOrder $workOrder): RedirectResponse
    {
        $newStatus = $request->validated('status');

        if (! $this->isAllowedStatusTransition($workOrder->status, $newStatus)) {
            return redirect()->route($this->getRoutePrefix().'.maintenance.work-orders.show', $workOrder)
                ->with('error', __('maintenance.messages.status_transition_invalid'));
        }

        if ($newStatus === WorkOrder::STATUS_IN_PROGRESS
            && WorkOrderVehicleStatusSyncer::vehicleHasOtherInProgress($workOrder)) {
            return redirect()->route($this->getRoutePrefix().'.maintenance.work-orders.show', $workOrder)
                ->with('error', __('maintenance.messages.vehicle_already_in_workshop'));
        }

        if ($newStatus === WorkOrder::STATUS_IN_PROGRESS
            && $workOrder->bay_id
            && WorkOrderVehicleStatusSyncer::bayHasOtherInProgress((int) $workOrder->bay_id, $workOrder)) {
            return redirect()->route($this->getRoutePrefix().'.maintenance.work-orders.show', $workOrder)
                ->with('error', __('maintenance.messages.bay_already_busy'));
        }

        DB::transaction(function () use ($workOrder, $newStatus): void {
            $originalStatus = $workOrder->status;
            $payload = $this->withStatusSideEffects($workOrder, ['status' => $newStatus]);
            $workOrder->update($payload);
            WorkOrderVehicleStatusSyncer::sync($workOrder->fresh(), $originalStatus);
            $this->syncStockForStatusChange($workOrder->fresh(), $originalStatus);
        });

        return redirect()->route($this->getRoutePrefix().'.maintenance.work-orders.show', $workOrder)
            ->with('success', __('maintenance.messages.wo_status_updated', [
                'status' => __('maintenance.status.'.$newStatus),
            ]));
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function withRelationLabels(array $validated): array
    {
        if (! empty($validated['vendor_partner_id'])) {
            $partner = Partner::query()->find($validated['vendor_partner_id']);
            if ($partner !== null) {
                $validated['vendor_name'] = $partner->name;
            }
        } else {
            $validated['vendor_partner_id'] = null;
        }

        if (! empty($validated['mechanic_user_id'])) {
            $mechanic = User::query()->find($validated['mechanic_user_id']);
            if ($mechanic !== null) {
                $validated['mechanic_name'] = $mechanic->name;
            }
        } else {
            $validated['mechanic_user_id'] = null;
        }

        $validated['service_location'] = $validated['service_location'] ?? WorkOrder::LOCATION_IN_HOUSE;

        if ($validated['service_location'] === WorkOrder::LOCATION_OUTSOURCE) {
            $validated['bay_id'] = null;
        } elseif (array_key_exists('bay_id', $validated) && blank($validated['bay_id'])) {
            $validated['bay_id'] = null;
        }

        if (array_key_exists('waiting_parts', $validated)) {
            $validated['waiting_parts'] = (bool) $validated['waiting_parts'];
        }

        return $validated;
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function withStatusSideEffects(WorkOrder $workOrder, array $validated): array
    {
        if (($validated['status'] ?? null) === WorkOrder::STATUS_APPROVED && $workOrder->status !== WorkOrder::STATUS_APPROVED) {
            $validated['approved_by'] = Auth::id();
            $validated['approved_at'] = now();
        }

        if (($validated['status'] ?? null) === WorkOrder::STATUS_IN_PROGRESS && ! $workOrder->started_at) {
            $validated['started_at'] = $validated['started_at'] ?? now();
        }

        if (($validated['status'] ?? null) === WorkOrder::STATUS_COMPLETED && ! $workOrder->completed_at) {
            $validated['completed_at'] = $validated['completed_at'] ?? now();
            $validated['waiting_parts'] = false;
        }

        if (($validated['status'] ?? null) === WorkOrder::STATUS_CANCELLED) {
            $validated['waiting_parts'] = false;
        }

        return $validated;
    }

    private function syncStockForStatusChange(WorkOrder $workOrder, string $originalStatus): void
    {
        $workOrder->load('items.product');
        $newStatus = $workOrder->status;

        if ($newStatus === WorkOrder::STATUS_COMPLETED && $originalStatus !== WorkOrder::STATUS_COMPLETED) {
            MaintenanceStockRecorder::deduct($workOrder);
        } elseif ($originalStatus === WorkOrder::STATUS_COMPLETED && $newStatus !== WorkOrder::STATUS_COMPLETED) {
            MaintenanceStockRecorder::reverse($workOrder);
        }
    }

    private function isAllowedStatusTransition(string $from, string $to): bool
    {
        if ($from === $to) {
            return false;
        }

        $allowed = [
            WorkOrder::STATUS_DRAFT => [WorkOrder::STATUS_PENDING, WorkOrder::STATUS_CANCELLED],
            WorkOrder::STATUS_PENDING => [WorkOrder::STATUS_APPROVED, WorkOrder::STATUS_CANCELLED],
            WorkOrder::STATUS_APPROVED => [WorkOrder::STATUS_IN_PROGRESS, WorkOrder::STATUS_CANCELLED],
            WorkOrder::STATUS_IN_PROGRESS => [WorkOrder::STATUS_COMPLETED, WorkOrder::STATUS_CANCELLED],
            WorkOrder::STATUS_COMPLETED => [],
            WorkOrder::STATUS_CANCELLED => [],
        ];

        return in_array($to, $allowed[$from] ?? [], true);
    }

    public function destroy(WorkOrder $workOrder): RedirectResponse
    {
        $workOrder->delete();

        return redirect()->route($this->getRoutePrefix().'.maintenance.work-orders.index')
            ->with('success', __('maintenance.messages.wo_deleted'));
    }
}
