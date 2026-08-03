<?php

namespace Modules\Maintenance\Support;

use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Models\MaintenanceSchedule;
use Modules\Maintenance\Models\WorkOrder;

/**
 * Keeps fleet vehicle status aligned with work-order shop-floor transitions,
 * and advances matching preventive schedules when a WO completes.
 */
class WorkOrderVehicleStatusSyncer
{
    public static function sync(WorkOrder $workOrder, string $originalStatus): void
    {
        if ($workOrder->status === $originalStatus) {
            return;
        }

        $workOrder->loadMissing('vehicle');

        $vehicle = $workOrder->vehicle;

        if ($vehicle === null) {
            return;
        }

        if ($workOrder->status === WorkOrder::STATUS_IN_PROGRESS && $originalStatus !== WorkOrder::STATUS_IN_PROGRESS) {
            self::markVehicleInWorkshop($workOrder, $vehicle);

            return;
        }

        $leavingWorkshop = $originalStatus === WorkOrder::STATUS_IN_PROGRESS
            && in_array($workOrder->status, [WorkOrder::STATUS_COMPLETED, WorkOrder::STATUS_CANCELLED], true);

        if ($leavingWorkshop) {
            self::restoreVehicleIfIdle($workOrder, $vehicle);
        }

        if ($workOrder->status === WorkOrder::STATUS_COMPLETED && $originalStatus !== WorkOrder::STATUS_COMPLETED) {
            self::touchSchedules($workOrder);
        }
    }

    /**
     * Reject starting a second in-progress WO for the same vehicle.
     */
    public static function vehicleHasOtherInProgress(WorkOrder $workOrder): bool
    {
        return WorkOrder::query()
            ->where('vehicle_id', $workOrder->vehicle_id)
            ->whereKeyNot($workOrder->id)
            ->where('status', WorkOrder::STATUS_IN_PROGRESS)
            ->exists();
    }

    /**
     * Reject starting a second in-progress WO on the same bay.
     */
    public static function bayHasOtherInProgress(int $bayId, WorkOrder $workOrder): bool
    {
        return WorkOrder::query()
            ->where('bay_id', $bayId)
            ->whereKeyNot($workOrder->id)
            ->where('status', WorkOrder::STATUS_IN_PROGRESS)
            ->exists();
    }

    private static function markVehicleInWorkshop(WorkOrder $workOrder, Vehicle $vehicle): void
    {
        if ($workOrder->vehicle_status_before === null) {
            $workOrder->forceFill([
                'vehicle_status_before' => $vehicle->status,
            ])->saveQuietly();
        }

        if ($vehicle->status !== Vehicle::STATUS_MAINTENANCE) {
            $vehicle->update(['status' => Vehicle::STATUS_MAINTENANCE]);
        }
    }

    private static function restoreVehicleIfIdle(WorkOrder $workOrder, Vehicle $vehicle): void
    {
        if (self::vehicleHasOtherInProgress($workOrder)) {
            return;
        }

        $restore = $workOrder->vehicle_status_before ?: Vehicle::STATUS_ACTIVE;

        if ($restore === Vehicle::STATUS_MAINTENANCE) {
            $restore = Vehicle::STATUS_ACTIVE;
        }

        if ($vehicle->status !== $restore) {
            $vehicle->update(['status' => $restore]);
        }
    }

    private static function touchSchedules(WorkOrder $workOrder): void
    {
        $completedDate = $workOrder->completed_at?->toDateString() ?? now()->toDateString();

        MaintenanceSchedule::query()
            ->where('vehicle_id', $workOrder->vehicle_id)
            ->where('category_id', $workOrder->category_id)
            ->where('is_active', true)
            ->each(function (MaintenanceSchedule $schedule) use ($workOrder, $completedDate): void {
                $schedule->last_service_date = $completedDate;

                if ($workOrder->odometer_at_service !== null) {
                    $schedule->last_service_odometer = $workOrder->odometer_at_service;
                }

                $schedule->recalculateNextService();
            });
    }
}
