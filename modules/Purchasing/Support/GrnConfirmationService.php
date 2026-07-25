<?php

namespace Modules\Purchasing\Support;

use Illuminate\Support\Facades\DB;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Inventory\Support\LowStockNotifier;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Product\Models\Product;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Models\PurchaseOrderItem;
use RuntimeException;

class GrnConfirmationService
{
    public function confirm(GoodReceiptNote $grn): GoodReceiptNote
    {
        return DB::transaction(function () use ($grn) {
            $grn->refresh();
            $grn->load(['items.purchaseOrderItem.packaging', 'purchaseOrder.items']);

            if ($grn->status !== GoodReceiptNote::STATUS_DRAFT) {
                throw new RuntimeException(__('purchasing.messages.grn_confirm_draft_only'));
            }

            if ($grn->items->isEmpty()) {
                throw new RuntimeException(__('purchasing.messages.grn_confirm_need_items'));
            }

            $stockLocationId = $this->resolveStockLocationId((int) $grn->warehouse_id);

            foreach ($grn->items as $grnItem) {
                /** @var PurchaseOrderItem $poItem */
                $poItem = $grnItem->purchaseOrderItem;
                $locationId = $grnItem->location_id ?: $stockLocationId;
                $baseQty = $this->toBaseQuantity((float) $grnItem->quantity_received, $poItem);

                if ($grnItem->location_id === null && $locationId !== null) {
                    $grnItem->update(['location_id' => $locationId]);
                }

                StockMovementRecorder::record([
                    'product_id' => $poItem->product_id,
                    'warehouse_id' => $grn->warehouse_id,
                    'location_id' => $locationId,
                    'type' => 'in',
                    'quantity' => $baseQty,
                    'source_type' => 'grn',
                    'source_id' => $grnItem->id,
                    'reference_code' => $grn->grn_number,
                    'batch_number' => $grnItem->batch_number,
                    'expiry_date' => $grnItem->expiry_date?->toDateString(),
                    'recorded_by' => auth()->id(),
                    'recorded_at' => now(),
                ]);

                $poItem->increment('quantity_received', (float) $grnItem->quantity_received);
                $this->updateProductCostFromReceipt($poItem, $baseQty, (float) $grnItem->quantity_received);
            }

            $grn->update(['status' => GoodReceiptNote::STATUS_CONFIRMED]);

            $po = $grn->purchaseOrder()->with('items')->firstOrFail();
            $this->recalculatePurchaseOrderStatus($po);

            LowStockNotifier::checkAndNotify();

            return $grn->fresh(['items.location', 'purchaseOrder', 'warehouse', 'receivedBy']);
        });
    }

    public function void(GoodReceiptNote $grn): GoodReceiptNote
    {
        return DB::transaction(function () use ($grn) {
            $grn->refresh();
            $grn->load(['items.purchaseOrderItem.packaging', 'purchaseOrder.items']);

            if ($grn->status !== GoodReceiptNote::STATUS_CONFIRMED) {
                throw new RuntimeException(__('purchasing.messages.grn_void_confirmed_only'));
            }

            $po = $grn->purchaseOrder;
            if ($po->status === PurchaseOrder::STATUS_CLOSED) {
                throw new RuntimeException(__('purchasing.messages.grn_void_closed_po'));
            }

            foreach ($grn->items as $grnItem) {
                $poItem = $grnItem->purchaseOrderItem;
                $inbound = StockMovement::query()
                    ->where('source_type', 'grn')
                    ->where('source_id', $grnItem->id)
                    ->where('type', 'in')
                    ->get();

                foreach ($inbound as $movement) {
                    StockMovementRecorder::record([
                        'product_id' => $movement->product_id,
                        'warehouse_id' => $movement->warehouse_id,
                        'location_id' => $movement->location_id,
                        'type' => 'out',
                        'quantity' => $movement->quantity,
                        'source_type' => 'grn_void',
                        'source_id' => $grnItem->id,
                        'reference_code' => $grn->grn_number,
                        'batch_number' => $movement->batch_number !== '' ? $movement->batch_number : null,
                        'expiry_date' => $movement->expiry_date?->toDateString(),
                        'notes' => __('purchasing.messages.grn_void_notes', ['grn' => $grn->grn_number]),
                        'recorded_by' => auth()->id(),
                        'recorded_at' => now(),
                        'allocate' => false,
                    ]);
                }

                $poItem->decrement('quantity_received', (float) $grnItem->quantity_received);
                if ((float) $poItem->fresh()->quantity_received < 0) {
                    $poItem->update(['quantity_received' => 0]);
                }
            }

            $grn->update(['status' => GoodReceiptNote::STATUS_VOIDED]);

            $this->recalculatePurchaseOrderStatus($po->fresh(['items']));

            LowStockNotifier::checkAndNotify();

            return $grn->fresh(['items.location', 'purchaseOrder', 'warehouse', 'receivedBy']);
        });
    }

    public function recalculatePurchaseOrderStatus(PurchaseOrder $po): void
    {
        if (in_array($po->status, [PurchaseOrder::STATUS_CANCELLED, PurchaseOrder::STATUS_CLOSED], true)) {
            return;
        }

        $po->load('items');

        if ($po->items->isEmpty()) {
            return;
        }

        $fullyReceived = $po->items->every(
            fn ($item): bool => (float) $item->quantity_received >= (float) $item->quantity_ordered
        );

        $anyReceived = $po->items->contains(
            fn ($item): bool => (float) $item->quantity_received > 0
        );

        if ($fullyReceived) {
            $po->update(['status' => PurchaseOrder::STATUS_FULLY_RECEIVED]);

            return;
        }

        if ($anyReceived) {
            $po->update(['status' => PurchaseOrder::STATUS_PARTIAL_RECEIVED]);

            return;
        }

        if (in_array($po->status, [
            PurchaseOrder::STATUS_PARTIAL_RECEIVED,
            PurchaseOrder::STATUS_FULLY_RECEIVED,
        ], true)) {
            $po->update(['status' => PurchaseOrder::STATUS_APPROVED]);
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

    public function toBaseQuantity(float $orderQty, PurchaseOrderItem $poItem): float
    {
        $factor = (float) ($poItem->packaging?->qty ?: 1);

        if ($factor <= 0) {
            $factor = 1;
        }

        return round($orderQty * $factor, 2);
    }

    private function updateProductCostFromReceipt(PurchaseOrderItem $poItem, float $baseQty, float $orderQty): void
    {
        if ($baseQty <= 0 || $orderQty <= 0) {
            return;
        }

        $costPerBase = round(((float) $poItem->unit_price * $orderQty) / $baseQty, 4);

        Product::query()->whereKey($poItem->product_id)->update(['cost' => $costPerBase]);
    }
}
