<?php

namespace Modules\Maintenance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Maintenance\Models\MaintenanceBay;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Maintenance\Support\MaintenanceStockRecorder;
use Modules\Maintenance\Support\WorkOrderVehicleStatusSyncer;

class WipBoardController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $user = Auth::user();

        $workOrders = WorkOrder::query()
            ->with(['vehicle:id,name,plate_number', 'category:id,name,color', 'bay:id,code,name', 'mechanic:id,name'])
            ->whereIn('status', [
                WorkOrder::STATUS_PENDING,
                WorkOrder::STATUS_APPROVED,
                WorkOrder::STATUS_IN_PROGRESS,
            ])
            ->when(request('bay_id'), fn ($q, $bayId) => $q->where('bay_id', $bayId))
            ->when(request('mechanic_user_id'), fn ($q, $mechanicId) => $q->where('mechanic_user_id', $mechanicId))
            ->orderByRaw("CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END")
            ->orderBy('scheduled_date')
            ->get();

        $columns = [
            'pending' => $workOrders->where('status', WorkOrder::STATUS_PENDING)->values(),
            'approved' => $workOrders->where('status', WorkOrder::STATUS_APPROVED)->values(),
            'in_progress' => $workOrders
                ->where('status', WorkOrder::STATUS_IN_PROGRESS)
                ->where('waiting_parts', false)
                ->values(),
            'waiting_parts' => $workOrders
                ->where('status', WorkOrder::STATUS_IN_PROGRESS)
                ->where('waiting_parts', true)
                ->values(),
        ];

        $doneToday = WorkOrder::query()
            ->with(['vehicle:id,name,plate_number', 'bay:id,code,name'])
            ->where('status', WorkOrder::STATUS_COMPLETED)
            ->whereDate('completed_at', now()->toDateString())
            ->latest('completed_at')
            ->limit(20)
            ->get();

        return Inertia::render('Modules/Maintenance/Wip/Index', [
            'columns' => $columns,
            'doneToday' => $doneToday,
            'bays' => MaintenanceBay::query()->active()->ordered()->get(['id', 'code', 'name']),
            'filters' => [
                'bay_id' => request('bay_id'),
                'mechanic_user_id' => request('mechanic_user_id'),
            ],
            'can' => [
                'update' => $user->hasPermissionFor('maintenance', 'update'),
                'approve' => $user->hasPermissionFor('maintenance', 'approve'),
                'assign' => $user->hasPermissionFor('maintenance', 'assign')
                    || $user->hasPermissionFor('maintenance', 'update'),
            ],
        ]);
    }

    public function updateCard(Request $request, WorkOrder $workOrder): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user !== null, 403);

        $validated = $request->validate([
            'action' => ['required', 'string', 'in:approve,start,waiting_parts,resume,complete,cancel'],
            'bay_id' => ['nullable', 'integer', 'exists:maintenance_bays,id'],
            'mechanic_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $action = $validated['action'];

        return match ($action) {
            'approve' => $this->transition($workOrder, WorkOrder::STATUS_APPROVED, needsApprove: true),
            'start' => $this->start($workOrder, $validated),
            'waiting_parts' => $this->setWaitingParts($workOrder, true),
            'resume' => $this->setWaitingParts($workOrder, false),
            'complete' => $this->transition($workOrder, WorkOrder::STATUS_COMPLETED),
            'cancel' => $this->transition($workOrder, WorkOrder::STATUS_CANCELLED),
        };
    }

    /**
     * @param  array{bay_id?: int|null, mechanic_user_id?: int|null}  $validated
     */
    private function start(WorkOrder $workOrder, array $validated): RedirectResponse
    {
        $user = Auth::user();
        abort_unless(
            $user !== null && (
                $user->hasPermissionFor('maintenance', 'update')
                || $user->hasPermissionFor('maintenance', 'assign')
            ),
            403,
        );

        if ($workOrder->status !== WorkOrder::STATUS_APPROVED) {
            return back()->with('error', __('maintenance.messages.status_transition_invalid'));
        }

        if (WorkOrderVehicleStatusSyncer::vehicleHasOtherInProgress($workOrder)) {
            return back()->with('error', __('maintenance.messages.vehicle_already_in_workshop'));
        }

        $bayId = $validated['bay_id'] ?? $workOrder->bay_id;

        if ($bayId && WorkOrderVehicleStatusSyncer::bayHasOtherInProgress((int) $bayId, $workOrder)) {
            return back()->with('error', __('maintenance.messages.bay_already_busy'));
        }

        DB::transaction(function () use ($workOrder, $bayId, $validated): void {
            $originalStatus = $workOrder->status;
            $payload = [
                'status' => WorkOrder::STATUS_IN_PROGRESS,
                'started_at' => $workOrder->started_at ?? now(),
                'waiting_parts' => false,
            ];

            if ($bayId) {
                $payload['bay_id'] = $bayId;
            }

            if (! empty($validated['mechanic_user_id'])) {
                $payload['mechanic_user_id'] = $validated['mechanic_user_id'];
                $mechanic = \App\Models\User::query()->find($validated['mechanic_user_id']);
                if ($mechanic) {
                    $payload['mechanic_name'] = $mechanic->name;
                }
            }

            $workOrder->update($payload);
            WorkOrderVehicleStatusSyncer::sync($workOrder->fresh(), $originalStatus);
        });

        return back()->with('success', __('maintenance.messages.wo_status_updated', [
            'status' => __('maintenance.status.in_progress'),
        ]));
    }

    private function setWaitingParts(WorkOrder $workOrder, bool $waiting): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user !== null && $user->hasPermissionFor('maintenance', 'update'), 403);

        if ($workOrder->status !== WorkOrder::STATUS_IN_PROGRESS) {
            return back()->with('error', __('maintenance.messages.status_transition_invalid'));
        }

        $workOrder->update(['waiting_parts' => $waiting]);

        return back()->with('success', __('maintenance.messages.waiting_parts_updated'));
    }

    private function transition(WorkOrder $workOrder, string $newStatus, bool $needsApprove = false): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user !== null, 403);

        if ($needsApprove) {
            abort_unless(
                $user->hasPermissionFor('maintenance', 'approve')
                || $user->hasPermissionFor('maintenance', 'update'),
                403,
            );
        } else {
            abort_unless($user->hasPermissionFor('maintenance', 'update'), 403);
        }

        $allowed = [
            WorkOrder::STATUS_PENDING => [WorkOrder::STATUS_APPROVED, WorkOrder::STATUS_CANCELLED],
            WorkOrder::STATUS_APPROVED => [WorkOrder::STATUS_IN_PROGRESS, WorkOrder::STATUS_CANCELLED],
            WorkOrder::STATUS_IN_PROGRESS => [WorkOrder::STATUS_COMPLETED, WorkOrder::STATUS_CANCELLED],
        ];

        if (! in_array($newStatus, $allowed[$workOrder->status] ?? [], true)) {
            return back()->with('error', __('maintenance.messages.status_transition_invalid'));
        }

        if ($newStatus === WorkOrder::STATUS_IN_PROGRESS
            && WorkOrderVehicleStatusSyncer::vehicleHasOtherInProgress($workOrder)) {
            return back()->with('error', __('maintenance.messages.vehicle_already_in_workshop'));
        }

        if ($newStatus === WorkOrder::STATUS_IN_PROGRESS
            && $workOrder->bay_id
            && WorkOrderVehicleStatusSyncer::bayHasOtherInProgress((int) $workOrder->bay_id, $workOrder)) {
            return back()->with('error', __('maintenance.messages.bay_already_busy'));
        }

        DB::transaction(function () use ($workOrder, $newStatus, $user): void {
            $originalStatus = $workOrder->status;
            $payload = ['status' => $newStatus];

            if ($newStatus === WorkOrder::STATUS_APPROVED) {
                $payload['approved_by'] = $user->id;
                $payload['approved_at'] = now();
            }

            if ($newStatus === WorkOrder::STATUS_IN_PROGRESS && ! $workOrder->started_at) {
                $payload['started_at'] = now();
                $payload['waiting_parts'] = false;
            }

            if ($newStatus === WorkOrder::STATUS_COMPLETED && ! $workOrder->completed_at) {
                $payload['completed_at'] = now();
                $payload['waiting_parts'] = false;
            }

            if ($newStatus === WorkOrder::STATUS_CANCELLED) {
                $payload['waiting_parts'] = false;
            }

            $workOrder->update($payload);
            $fresh = $workOrder->fresh();
            WorkOrderVehicleStatusSyncer::sync($fresh, $originalStatus);

            if ($newStatus === WorkOrder::STATUS_COMPLETED && $originalStatus !== WorkOrder::STATUS_COMPLETED) {
                MaintenanceStockRecorder::deduct($fresh->load('items.product'));
            } elseif ($originalStatus === WorkOrder::STATUS_COMPLETED && $newStatus !== WorkOrder::STATUS_COMPLETED) {
                MaintenanceStockRecorder::reverse($fresh->load('items.product'));
            }
        });

        return back()->with('success', __('maintenance.messages.wo_status_updated', [
            'status' => __('maintenance.status.'.$newStatus),
        ]));
    }
}
