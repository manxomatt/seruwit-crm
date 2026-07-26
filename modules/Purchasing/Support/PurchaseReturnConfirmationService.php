<?php

namespace Modules\Purchasing\Support;

use Illuminate\Support\Facades\DB;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Purchasing\Models\PurchaseReturn;
use RuntimeException;

class PurchaseReturnConfirmationService
{
    public function confirm(PurchaseReturn $purchaseReturn): PurchaseReturn
    {
        return DB::transaction(function () use ($purchaseReturn) {
            $purchaseReturn->refresh();
            $purchaseReturn->load(['items.purchaseOrderItem.packaging', 'items.purchaseOrderItem.product', 'purchaseOrder']);

            if ($purchaseReturn->status !== PurchaseReturn::STATUS_DRAFT) {
                throw new RuntimeException(__('purchasing.messages.return_confirm_draft_only'));
            }

            if ($purchaseReturn->items->isEmpty()) {
                throw new RuntimeException(__('purchasing.messages.return_need_items'));
            }

            $stockLocationId = app(GrnConfirmationService::class)->resolveStockLocationId((int) $purchaseReturn->warehouse_id);

            foreach ($purchaseReturn->items as $item) {
                $poItem = $item->purchaseOrderItem;
                $returnQty = (float) $item->quantity_returned;
                $received = (float) $poItem->quantity_received;

                if ($returnQty > $received) {
                    throw new RuntimeException(__('purchasing.messages.return_qty_exceeds_received', [
                        'product' => $poItem->product?->name ?? 'Product',
                        'remaining' => $received,
                    ]));
                }

                $baseQty = app(GrnConfirmationService::class)->toBaseQuantity($returnQty, $poItem);
                $locationId = $item->location_id ?: $stockLocationId;
                $hasBatch = filled($item->batch_number);

                if ($item->location_id === null && $locationId !== null) {
                    $item->update(['location_id' => $locationId]);
                }

                StockMovementRecorder::record([
                    'product_id' => $poItem->product_id,
                    'warehouse_id' => $purchaseReturn->warehouse_id,
                    'location_id' => $locationId,
                    'type' => 'out',
                    'quantity' => $baseQty,
                    'source_type' => 'purchase_return',
                    'source_id' => $item->id,
                    'reference_code' => $purchaseReturn->return_number,
                    'batch_number' => $item->batch_number,
                    'expiry_date' => $item->expiry_date?->toDateString(),
                    'recorded_by' => auth()->id(),
                    'recorded_at' => now(),
                    'allocate' => ! $hasBatch,
                ]);

                $poItem->decrement('quantity_received', $returnQty);
                if ((float) $poItem->fresh()->quantity_received < 0) {
                    $poItem->update(['quantity_received' => 0]);
                }
            }

            $purchaseReturn->update(['status' => PurchaseReturn::STATUS_CONFIRMED]);
            app(GrnConfirmationService::class)->recalculatePurchaseOrderStatus(
                $purchaseReturn->purchaseOrder->fresh(['items'])
            );

            return $purchaseReturn->fresh(['items', 'purchaseOrder', 'warehouse']);
        });
    }
}
