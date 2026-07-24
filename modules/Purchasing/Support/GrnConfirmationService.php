<?php

namespace Modules\Purchasing\Support;

use Illuminate\Support\Facades\DB;
use Modules\Inventory\Support\LowStockNotifier;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\PurchaseOrder;
use RuntimeException;

class GrnConfirmationService
{
    public function confirm(GoodReceiptNote $grn): GoodReceiptNote
    {
        return DB::transaction(function () use ($grn) {
            $grn->refresh();
            $grn->load(['items.purchaseOrderItem', 'purchaseOrder.items']);

            if ($grn->status !== GoodReceiptNote::STATUS_DRAFT) {
                throw new RuntimeException('Only a draft GRN can be confirmed.');
            }

            if ($grn->items->isEmpty()) {
                throw new RuntimeException('Add at least one item before confirming the GRN.');
            }

            foreach ($grn->items as $grnItem) {
                $poItem = $grnItem->purchaseOrderItem;

                StockMovementRecorder::record([
                    'product_id' => $poItem->product_id,
                    'warehouse_id' => $grn->warehouse_id,
                    'location_id' => $grnItem->location_id,
                    'type' => 'in',
                    'quantity' => $grnItem->quantity_received,
                    'source_type' => 'grn',
                    'source_id' => $grnItem->id,
                    'reference_code' => $grn->grn_number,
                    'batch_number' => $grnItem->batch_number,
                    'expiry_date' => $grnItem->expiry_date?->toDateString(),
                    'recorded_by' => auth()->id(),
                    'recorded_at' => now(),
                ]);

                $poItem->increment('quantity_received', (float) $grnItem->quantity_received);
            }

            $grn->update(['status' => GoodReceiptNote::STATUS_CONFIRMED]);

            $po = $grn->purchaseOrder()->with('items')->firstOrFail();
            $this->recalculatePurchaseOrderStatus($po);

            LowStockNotifier::checkAndNotify();

            return $grn->fresh(['items', 'purchaseOrder', 'warehouse', 'receivedBy']);
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
        }
    }
}
