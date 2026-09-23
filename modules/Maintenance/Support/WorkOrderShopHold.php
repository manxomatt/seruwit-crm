<?php

namespace Modules\Maintenance\Support;

use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\Schema;
use Modules\Maintenance\Models\WorkOrder;

/**
 * Vehicles committed to the shop floor (approved or already in progress).
 *
 * Draft/pending work orders stay plannable and do not block dispatch.
 */
class WorkOrderShopHold
{
    /**
     * @return list<int>
     */
    public static function vehicleIds(): array
    {
        if (! self::enabled()) {
            return [];
        }

        return WorkOrder::query()
            ->whereIn('status', [WorkOrder::STATUS_APPROVED, WorkOrder::STATUS_IN_PROGRESS])
            ->pluck('vehicle_id')
            ->unique()
            ->map(fn (mixed $id): int => (int) $id)
            ->values()
            ->all();
    }

    public static function isHeld(int $vehicleId): bool
    {
        if (! self::enabled()) {
            return false;
        }

        return WorkOrder::query()
            ->where('vehicle_id', $vehicleId)
            ->whereIn('status', [WorkOrder::STATUS_APPROVED, WorkOrder::STATUS_IN_PROGRESS])
            ->exists();
    }

    public static function hasInProgress(int $vehicleId): bool
    {
        if (! self::enabled()) {
            return false;
        }

        return WorkOrder::query()
            ->where('vehicle_id', $vehicleId)
            ->where('status', WorkOrder::STATUS_IN_PROGRESS)
            ->exists();
    }

    /**
     * @param  list<int>  $vehicleIds
     * @return list<int>
     */
    public static function inProgressVehicleIdsAmong(array $vehicleIds): array
    {
        if (! self::enabled() || $vehicleIds === []) {
            return [];
        }

        return WorkOrder::query()
            ->whereIn('vehicle_id', $vehicleIds)
            ->where('status', WorkOrder::STATUS_IN_PROGRESS)
            ->pluck('vehicle_id')
            ->unique()
            ->map(fn (mixed $id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\Modules\Fleet\Models\Vehicle>  $query
     * @return \Illuminate\Database\Eloquent\Builder<\Modules\Fleet\Models\Vehicle>
     */
    public static function excludeHeldVehicles(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        $held = self::vehicleIds();

        if ($held !== []) {
            $query->whereNotIn('id', $held);
        }

        return $query;
    }

    private static function enabled(): bool
    {
        return Modules::available('maintenance') && Schema::hasTable('work_orders');
    }
}
