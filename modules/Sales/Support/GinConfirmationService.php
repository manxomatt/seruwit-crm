<?php

namespace Modules\Sales\Support;

use Illuminate\Support\Facades\DB;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Inventory\Support\LowStockNotifier;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderItem;
use RuntimeException;

class GinConfirmationService
{
    public function confirm(GoodsIssueNote $gin): GoodsIssueNote
    {
        return DB::transaction(function () use ($gin) {
            $gin->refresh();
            $gin->load(['items.salesOrderItem.packaging', 'salesOrder.items']);

            if ($gin->status !== GoodsIssueNote::STATUS_DRAFT) {
                throw new RuntimeException(__('sales.messages.gin_confirm_draft_only'));
            }

            if ($gin->items->isEmpty()) {
                throw new RuntimeException(__('sales.messages.gin_confirm_need_items'));
            }

            $stockLocationId = $this->resolveStockLocationId((int) $gin->warehouse_id);

            foreach ($gin->items as $ginItem) {
                /** @var SalesOrderItem $soItem */
                $soItem = $ginItem->salesOrderItem;
                $remaining = $soItem->remainingQuantity();

                if ((float) $ginItem->quantity_issued > $remaining + 0.009) {
                    throw new RuntimeException(__('sales.validation.quantity_exceeds_remaining', ['remaining' => $remaining]));
                }

                $locationId = $ginItem->location_id ?: $stockLocationId;
                $baseQty = $this->toBaseQuantity((float) $ginItem->quantity_issued, $soItem);

                if ($ginItem->location_id === null && $locationId !== null) {
                    $ginItem->update(['location_id' => $locationId]);
                }

                StockMovementRecorder::record([
                    'product_id' => $soItem->product_id,
                    'warehouse_id' => $gin->warehouse_id,
                    'location_id' => $locationId,
                    'type' => 'out',
                    'quantity' => $baseQty,
                    'source_type' => 'gin',
                    'source_id' => $ginItem->id,
                    'reference_code' => $gin->gin_number,
                    'batch_number' => $ginItem->batch_number,
                    'expiry_date' => $ginItem->expiry_date?->toDateString(),
                    'recorded_by' => auth()->id(),
                    'recorded_at' => now(),
                ]);

                $soItem->increment('quantity_delivered', (float) $ginItem->quantity_issued);
            }

            $gin->update(['status' => GoodsIssueNote::STATUS_CONFIRMED]);

            $so = $gin->salesOrder()->with('items')->firstOrFail();
            $this->recalculateSalesOrderStatus($so);

            LowStockNotifier::checkAndNotify();

            return $gin->fresh(['items.location', 'salesOrder', 'warehouse', 'issuedBy']);
        });
    }

    public function void(GoodsIssueNote $gin): GoodsIssueNote
    {
        return DB::transaction(function () use ($gin) {
            $gin->refresh();
            $gin->load(['items.salesOrderItem.packaging', 'salesOrder.items']);

            if ($gin->status !== GoodsIssueNote::STATUS_CONFIRMED) {
                throw new RuntimeException(__('sales.messages.gin_void_confirmed_only'));
            }

            $so = $gin->salesOrder;
            if ($so->status === SalesOrder::STATUS_CLOSED) {
                throw new RuntimeException(__('sales.messages.gin_void_closed_so'));
            }

            foreach ($gin->items as $ginItem) {
                $soItem = $ginItem->salesOrderItem;
                $outbound = StockMovement::query()
                    ->where('source_type', 'gin')
                    ->where('source_id', $ginItem->id)
                    ->where('type', 'out')
                    ->get();

                foreach ($outbound as $movement) {
                    StockMovementRecorder::record([
                        'product_id' => $movement->product_id,
                        'warehouse_id' => $movement->warehouse_id,
                        'location_id' => $movement->location_id,
                        'type' => 'in',
                        'quantity' => $movement->quantity,
                        'source_type' => 'gin_void',
                        'source_id' => $ginItem->id,
                        'reference_code' => $gin->gin_number,
                        'batch_number' => $movement->batch_number !== '' ? $movement->batch_number : null,
                        'expiry_date' => $movement->expiry_date?->toDateString(),
                        'notes' => __('sales.messages.gin_void_notes', ['gin' => $gin->gin_number]),
                        'recorded_by' => auth()->id(),
                        'recorded_at' => now(),
                        'allocate' => false,
                    ]);
                }

                $soItem->decrement('quantity_delivered', (float) $ginItem->quantity_issued);
                if ((float) $soItem->fresh()->quantity_delivered < 0) {
                    $soItem->update(['quantity_delivered' => 0]);
                }
            }

            $gin->update(['status' => GoodsIssueNote::STATUS_VOIDED]);

            $this->recalculateSalesOrderStatus($so->fresh(['items']));

            LowStockNotifier::checkAndNotify();

            return $gin->fresh(['items.location', 'salesOrder', 'warehouse', 'issuedBy']);
        });
    }

    public function recalculateSalesOrderStatus(SalesOrder $so): void
    {
        if (in_array($so->status, [SalesOrder::STATUS_CANCELLED, SalesOrder::STATUS_CLOSED], true)) {
            return;
        }

        $so->load('items');

        if ($so->items->isEmpty()) {
            return;
        }

        $fullyDelivered = $so->items->every(
            fn ($item): bool => (float) $item->quantity_delivered >= (float) $item->quantity_ordered
        );

        $anyDelivered = $so->items->contains(
            fn ($item): bool => (float) $item->quantity_delivered > 0
        );

        if ($fullyDelivered) {
            $so->update(['status' => SalesOrder::STATUS_FULLY_DELIVERED]);

            return;
        }

        if ($anyDelivered) {
            $so->update(['status' => SalesOrder::STATUS_PARTIAL_DELIVERED]);

            return;
        }

        if (in_array($so->status, [
            SalesOrder::STATUS_PARTIAL_DELIVERED,
            SalesOrder::STATUS_FULLY_DELIVERED,
        ], true)) {
            $so->update(['status' => SalesOrder::STATUS_CONFIRMED]);
        }
    }

    public function resolveStockLocationId(int $warehouseId): ?int
    {
        $locationId = WarehouseLocation::query()
            ->where('warehouse_id', $warehouseId)
            ->where('code', 'STOCK')
            ->value('id');

        if ($locationId) {
            return (int) $locationId;
        }

        $warehouse = \Modules\Inventory\Models\Warehouse::query()->find($warehouseId);
        $warehouse?->createDefaultLocations();

        $locationId = WarehouseLocation::query()
            ->where('warehouse_id', $warehouseId)
            ->where('code', 'STOCK')
            ->value('id');

        return $locationId ? (int) $locationId : null;
    }

    public function toBaseQuantity(float $orderQty, SalesOrderItem $soItem): float
    {
        $factor = (float) ($soItem->packaging?->qty ?: 1);

        if ($factor <= 0) {
            $factor = 1;
        }

        return round($orderQty * $factor, 2);
    }
}
