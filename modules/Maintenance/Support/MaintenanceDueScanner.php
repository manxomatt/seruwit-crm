<?php

namespace Modules\Maintenance\Support;

use App\Notifications\GenericNotification;
use App\Support\NotificationRecipients;
use Illuminate\Support\Facades\Notification;
use Modules\Maintenance\Models\MaintenanceSchedule;
use Modules\Maintenance\Models\MaintenanceScheduleReminder;
use Modules\Maintenance\Models\WorkOrder;

/**
 * Finds due/overdue preventive schedules, notifies staff, and optionally
 * opens a draft work order for overdue items.
 */
class MaintenanceDueScanner
{
    /**
     * @return array{reminders: int, work_orders: int}
     */
    public function scan(): array
    {
        $recipients = NotificationRecipients::forPermission('maintenance', 'view');
        $alertKm = MaintenanceSettings::alertKmBefore();
        $alertDays = MaintenanceSettings::alertDaysBefore();
        $autoCreate = MaintenanceSettings::autoCreateWo();

        $reminders = 0;
        $workOrders = 0;

        $schedules = MaintenanceSchedule::query()
            ->where('is_active', true)
            ->with(['vehicle:id,name,plate_number,odometer_km', 'category:id,name'])
            ->get();

        foreach ($schedules as $schedule) {
            if (! $this->isDueSoon($schedule, $alertKm, $alertDays)) {
                continue;
            }

            $overdue = $this->isOverdue($schedule);
            $kind = $overdue
                ? MaintenanceScheduleReminder::KIND_OVERDUE
                : MaintenanceScheduleReminder::KIND_DUE_SOON;
            $target = $this->targetKey($schedule);

            if ($target === null) {
                continue;
            }

            if (! $this->alreadySent($schedule, $kind, $target)) {
                $this->record($schedule, $kind, $target);
                $this->notify($recipients, $schedule, $overdue);
                $reminders++;
            }

            if ($autoCreate && $overdue && $this->createDraftWorkOrder($schedule)) {
                $workOrders++;
            }
        }

        return [
            'reminders' => $reminders,
            'work_orders' => $workOrders,
        ];
    }

    public function countDueSoon(): int
    {
        $alertKm = MaintenanceSettings::alertKmBefore();
        $alertDays = MaintenanceSettings::alertDaysBefore();

        return MaintenanceSchedule::query()
            ->where('is_active', true)
            ->with('vehicle:id,odometer_km')
            ->get()
            ->filter(fn (MaintenanceSchedule $schedule): bool => $this->isDueSoon($schedule, $alertKm, $alertDays))
            ->count();
    }

    public function isDueSoon(MaintenanceSchedule $schedule, ?int $alertKm = null, ?int $alertDays = null): bool
    {
        $alertKm ??= MaintenanceSettings::alertKmBefore();
        $alertDays ??= MaintenanceSettings::alertDaysBefore();

        if ($schedule->interval_type === MaintenanceSchedule::INTERVAL_MILEAGE) {
            if ($schedule->next_service_odometer === null || $schedule->vehicle === null) {
                return false;
            }

            return ((int) $schedule->vehicle->odometer_km) + $alertKm >= (int) $schedule->next_service_odometer;
        }

        if ($schedule->next_service_date === null) {
            return false;
        }

        return $schedule->next_service_date->lte(now()->startOfDay()->addDays($alertDays));
    }

    public function isOverdue(MaintenanceSchedule $schedule): bool
    {
        if ($schedule->interval_type === MaintenanceSchedule::INTERVAL_MILEAGE) {
            if ($schedule->next_service_odometer === null || $schedule->vehicle === null) {
                return false;
            }

            return ((int) $schedule->vehicle->odometer_km) >= (int) $schedule->next_service_odometer;
        }

        if ($schedule->next_service_date === null) {
            return false;
        }

        return $schedule->next_service_date->lte(now()->startOfDay());
    }

    private function targetKey(MaintenanceSchedule $schedule): ?string
    {
        if ($schedule->interval_type === MaintenanceSchedule::INTERVAL_MILEAGE) {
            if ($schedule->next_service_odometer === null) {
                return null;
            }

            return 'odo:'.$schedule->next_service_odometer;
        }

        if ($schedule->next_service_date === null) {
            return null;
        }

        return 'date:'.$schedule->next_service_date->toDateString();
    }

    private function alreadySent(MaintenanceSchedule $schedule, string $kind, string $target): bool
    {
        return MaintenanceScheduleReminder::query()
            ->where('maintenance_schedule_id', $schedule->id)
            ->where('kind', $kind)
            ->where('target', $target)
            ->exists();
    }

    private function record(MaintenanceSchedule $schedule, string $kind, string $target): void
    {
        MaintenanceScheduleReminder::query()->create([
            'maintenance_schedule_id' => $schedule->id,
            'kind' => $kind,
            'target' => $target,
            'sent_at' => now(),
        ]);
    }

    /**
     * @param  \Illuminate\Support\Collection<int, \App\Models\User>  $recipients
     */
    private function notify($recipients, MaintenanceSchedule $schedule, bool $overdue): void
    {
        if ($recipients->isEmpty()) {
            return;
        }

        $vehicle = $schedule->vehicle
            ? $schedule->vehicle->name.' ('.$schedule->vehicle->plate_number.')'
            : '—';

        Notification::send($recipients, new GenericNotification(
            title: $overdue
                ? __('maintenance.reminders.overdue_title')
                : __('maintenance.reminders.due_soon_title'),
            body: __('maintenance.reminders.body', [
                'schedule' => $schedule->name,
                'vehicle' => $vehicle,
                'category' => $schedule->category?->name ?? '—',
                'target' => $this->targetLabel($schedule),
            ]),
            url: route('module.maintenance.schedules.index', absolute: false),
            icon: 'maintenance',
            type: $overdue ? 'danger' : 'warning',
        ));
    }

    private function targetLabel(MaintenanceSchedule $schedule): string
    {
        if ($schedule->interval_type === MaintenanceSchedule::INTERVAL_MILEAGE) {
            return number_format((int) $schedule->next_service_odometer).' km';
        }

        return $schedule->next_service_date?->format('d/m/Y') ?? '—';
    }

    private function createDraftWorkOrder(MaintenanceSchedule $schedule): bool
    {
        $exists = WorkOrder::query()
            ->where('vehicle_id', $schedule->vehicle_id)
            ->where('category_id', $schedule->category_id)
            ->whereNotIn('status', [WorkOrder::STATUS_COMPLETED, WorkOrder::STATUS_CANCELLED])
            ->exists();

        if ($exists) {
            return false;
        }

        WorkOrder::query()->create([
            'vehicle_id' => $schedule->vehicle_id,
            'category_id' => $schedule->category_id,
            'reference_number' => WorkOrder::generateReferenceNumber(),
            'title' => $schedule->name,
            'description' => $schedule->notes,
            'status' => WorkOrder::STATUS_DRAFT,
            'priority' => WorkOrder::PRIORITY_NORMAL,
            'type' => WorkOrder::TYPE_PREVENTIVE,
            'service_location' => WorkOrder::LOCATION_IN_HOUSE,
            'scheduled_date' => $schedule->next_service_date?->toDateString() ?? now()->toDateString(),
            'odometer_at_service' => $schedule->interval_type === MaintenanceSchedule::INTERVAL_MILEAGE
                ? $schedule->next_service_odometer
                : $schedule->vehicle?->odometer_km,
            'notes' => __('maintenance.reminders.auto_wo_note'),
        ]);

        return true;
    }
}
