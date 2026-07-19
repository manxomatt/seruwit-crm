<?php

namespace Modules\Maintenance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Http\Requests\StoreWorkOrderRequest;
use Modules\Maintenance\Http\Requests\UpdateWorkOrderRequest;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Maintenance\Models\WorkOrderItem;

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
            ->with(['vehicle', 'category'])
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
        ]);
    }

    public function store(StoreWorkOrderRequest $request): RedirectResponse
    {
        $validated = $request->validated();
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

            return $wo;
        });

        return redirect()->route($this->getRoutePrefix().'.maintenance.work-orders.show', $workOrder)
            ->with('success', 'Work order berhasil dibuat.');
    }

    public function show(WorkOrder $workOrder): Response
    {
        $user = Auth::user();

        $workOrder->load(['vehicle', 'category', 'items', 'creator', 'approver']);

        return Inertia::render('Modules/Maintenance/WorkOrders/Show', [
            'workOrder' => array_merge($workOrder->toArray(), [
                'actual_total_cost' => $workOrder->actual_total_cost_attribute,
            ]),
            'can' => [
                'update' => $user->hasPermissionFor('maintenance', 'update'),
                'delete' => $user->hasPermissionFor('maintenance', 'delete'),
                'approve' => $user->hasPermissionFor('maintenance', 'approve'),
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
        ]);
    }

    public function update(UpdateWorkOrderRequest $request, WorkOrder $workOrder): RedirectResponse
    {
        $validated = $request->validated();
        $items = $validated['items'] ?? null;
        unset($validated['items']);

        DB::transaction(function () use ($workOrder, $validated, $items) {
            // Auto-set approved_by when status transitions to approved
            if ($validated['status'] === WorkOrder::STATUS_APPROVED && $workOrder->status !== WorkOrder::STATUS_APPROVED) {
                $validated['approved_by'] = Auth::id();
                $validated['approved_at'] = now();
            }

            // Auto-set started_at / completed_at timestamps
            if ($validated['status'] === WorkOrder::STATUS_IN_PROGRESS && ! $workOrder->started_at) {
                $validated['started_at'] = $validated['started_at'] ?? now();
            }

            if ($validated['status'] === WorkOrder::STATUS_COMPLETED && ! $workOrder->completed_at) {
                $validated['completed_at'] = $validated['completed_at'] ?? now();
            }

            $workOrder->update($validated);

            // Sync items when provided
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
        });

        return redirect()->route($this->getRoutePrefix().'.maintenance.work-orders.show', $workOrder)
            ->with('success', 'Work order berhasil diperbarui.');
    }

    public function destroy(WorkOrder $workOrder): RedirectResponse
    {
        $workOrder->delete();

        return redirect()->route($this->getRoutePrefix().'.maintenance.work-orders.index')
            ->with('success', 'Work order berhasil dihapus.');
    }
}
