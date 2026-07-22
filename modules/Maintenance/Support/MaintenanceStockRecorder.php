<?php

namespace Modules\Maintenance\Support;

use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\DB;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Maintenance\Models\WorkOrderItem;

/**
 * Draws inventory stock down for the fleet-sparepart parts consumed by a work
 * order, and reverses it if the order is later reopened or cancelled.
 *
 * Only "part" lines linked to a fleet_sparepart product with a resolvable
 * warehouse move stock; free-text parts and labor are ignored. Guarded on the
 * inventory module being installed so a maintenance-only tenant is unaffected.
 */
class MaintenanceStockRecorder
{
    public static function deduct(WorkOrder $workOrder): void
    {
        if (! Modules::available('inventory') || $workOrder->stock_deducted_at !== null) {
            return;
        }

        DB::transaction(function () use ($workOrder): void {
            foreach (self::consumableItems($workOrder) as [$item, $warehouseId]) {
                StockMovementRecorder::record([
                    'product_id' => $item->product_id,
                    'warehouse_id' => $warehouseId,
                    'type' => 'out',
                    'quantity' => $item->quantity,
                    'source_type' => 'maintenance',
                    'source_id' => $workOrder->id,
                    'reference_code' => $workOrder->reference_number,
                    'notes' => "dipakai work order {$workOrder->reference_number}",
                    'recorded_by' => $workOrder->created_by,
                    'recorded_at' => now(),
                ]);
            }

            $workOrder->forceFill(['stock_deducted_at' => now()])->saveQuietly();
        });
    }

    public static function reverse(WorkOrder $workOrder): void
    {
        if (! Modules::available('inventory') || $workOrder->stock_deducted_at === null) {
            return;
        }

        DB::transaction(function () use ($workOrder): void {
            foreach (self::consumableItems($workOrder) as [$item, $warehouseId]) {
                StockMovementRecorder::record([
                    'product_id' => $item->product_id,
                    'warehouse_id' => $warehouseId,
                    'type' => 'in',
                    'quantity' => $item->quantity,
                    'source_type' => 'maintenance',
                    'source_id' => $workOrder->id,
                    'reference_code' => $workOrder->reference_number,
                    'notes' => "pembatalan pemakaian work order {$workOrder->reference_number}",
                    'recorded_by' => $workOrder->created_by,
                    'recorded_at' => now(),
                ]);
            }

            $workOrder->forceFill(['stock_deducted_at' => null])->saveQuietly();
        });
    }

    /**
     * The part lines that move stock, paired with their resolved warehouse.
     *
     * @return list<array{0: WorkOrderItem, 1: int}>
     */
    private static function consumableItems(WorkOrder $workOrder): array
    {
        $workOrder->loadMissing('items.product');

        $rows = [];

        foreach ($workOrder->items as $item) {
            if ($item->item_type !== WorkOrderItem::TYPE_PART || $item->product_id === null) {
                continue;
            }

            if ((float) $item->quantity <= 0) {
                continue;
            }

            $product = $item->product;
            if (! $product || $product->category !== 'fleet_sparepart') {
                continue;
            }

            $warehouseId = $item->warehouse_id ?? $product->warehouse_id;
            if ($warehouseId === null) {
                continue;
            }

            $rows[] = [$item, (int) $warehouseId];
        }

        return $rows;
    }
}
