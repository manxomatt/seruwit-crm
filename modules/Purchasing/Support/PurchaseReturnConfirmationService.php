<?php

namespace Modules\Purchasing\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Inventory\Support\ProductCostAverager;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Payables\Models\SupplierBill;
use Modules\Payables\Models\SupplierBillLine;
use Modules\Payables\Support\PurchaseBillService;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Models\PurchaseReturn;
use RuntimeException;

class PurchaseReturnConfirmationService
{
    public function confirm(PurchaseReturn $purchaseReturn): PurchaseReturn
    {
        return DB::transaction(function () use ($purchaseReturn) {
            $purchaseReturn->refresh();
            $purchaseReturn->load([
                'items.purchaseOrderItem.packaging',
                'items.purchaseOrderItem.product',
                'items.grnItem',
                'purchaseOrder',
                'goodReceiptNote.items.purchaseOrderItem',
            ]);

            if ($purchaseReturn->status !== PurchaseReturn::STATUS_DRAFT) {
                throw new RuntimeException(__('purchasing.messages.return_confirm_draft_only'));
            }

            if ($purchaseReturn->items->isEmpty()) {
                throw new RuntimeException(__('purchasing.messages.return_need_items'));
            }

            $grnService = app(GrnConfirmationService::class);
            $stockLocationId = $grnService->resolveStockLocationId((int) $purchaseReturn->warehouse_id);
            $freightShareByItemId = $purchaseReturn->goodReceiptNote
                ? $grnService->allocateFreightByLineValue($purchaseReturn->goodReceiptNote)
                : [];

            foreach ($purchaseReturn->items as $item) {
                $poItem = $item->purchaseOrderItem;
                $returnQty = (float) $item->quantity_returned;

                if ($item->grn_item_id) {
                    $remaining = PurchaseReturnQuantity::remainingForGrnItem(
                        (float) ($item->grnItem?->quantity_received ?? 0),
                        (int) $item->grn_item_id,
                        $purchaseReturn->id
                    );

                    if ($returnQty > $remaining + 0.009) {
                        throw new RuntimeException(__('purchasing.messages.return_qty_exceeds_received', [
                            'product' => $poItem->product?->name ?? 'Product',
                            'remaining' => $remaining,
                        ]));
                    }
                }

                $received = (float) $poItem->quantity_received;

                if ($returnQty > $received) {
                    throw new RuntimeException(__('purchasing.messages.return_qty_exceeds_received', [
                        'product' => $poItem->product?->name ?? 'Product',
                        'remaining' => $received,
                    ]));
                }

                $baseQty = $grnService->toBaseQuantity($returnQty, $poItem);
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

                $freightShare = $this->freightShareForReturnQty(
                    $freightShareByItemId[$item->grn_item_id] ?? 0.0,
                    (float) ($item->grnItem?->quantity_received ?? 0),
                    $returnQty
                );

                ProductCostAverager::reverseInbound(
                    (int) $poItem->product_id,
                    $baseQty,
                    $grnService->unitCostInBase($poItem, $freightShare, $returnQty)
                );

                $poItem->decrement('quantity_received', $returnQty);
                if ((float) $poItem->fresh()->quantity_received < 0) {
                    $poItem->update(['quantity_received' => 0]);
                }
            }

            $purchaseReturn->update(['status' => PurchaseReturn::STATUS_CONFIRMED]);
            $grnService->recalculatePurchaseOrderStatus(
                $purchaseReturn->purchaseOrder->fresh(['items'])
            );

            if (class_exists(PurchaseBillService::class)) {
                app(PurchaseBillService::class)->createCreditFromPurchaseReturn(
                    $purchaseReturn->fresh(['items.purchaseOrderItem.product', 'items.grnItem', 'purchaseOrder', 'goodReceiptNote'])
                );
            }

            return $purchaseReturn->fresh(['items', 'purchaseOrder', 'warehouse']);
        });
    }

    public function void(PurchaseReturn $purchaseReturn): PurchaseReturn
    {
        return DB::transaction(function () use ($purchaseReturn) {
            $purchaseReturn->refresh();
            $purchaseReturn->load([
                'items.purchaseOrderItem.packaging',
                'items.purchaseOrderItem.product',
                'items.grnItem',
                'purchaseOrder',
                'goodReceiptNote.items.purchaseOrderItem',
            ]);

            if ($purchaseReturn->status !== PurchaseReturn::STATUS_CONFIRMED) {
                throw new RuntimeException(__('purchasing.messages.return_void_confirmed_only'));
            }

            $po = $purchaseReturn->purchaseOrder;
            if ($po->status === PurchaseOrder::STATUS_CLOSED) {
                throw new RuntimeException(__('purchasing.messages.return_void_closed_po'));
            }

            $this->voidLinkedCreditBills($purchaseReturn);

            $grnService = app(GrnConfirmationService::class);
            $freightShareByItemId = $purchaseReturn->goodReceiptNote
                ? $grnService->allocateFreightByLineValue($purchaseReturn->goodReceiptNote)
                : [];

            foreach ($purchaseReturn->items as $item) {
                $poItem = $item->purchaseOrderItem;
                $returnQty = (float) $item->quantity_returned;
                $baseQty = $grnService->toBaseQuantity($returnQty, $poItem);

                StockMovementRecorder::record([
                    'product_id' => $poItem->product_id,
                    'warehouse_id' => $purchaseReturn->warehouse_id,
                    'location_id' => $item->location_id,
                    'type' => 'in',
                    'quantity' => $baseQty,
                    'source_type' => 'purchase_return_void',
                    'source_id' => $item->id,
                    'reference_code' => $purchaseReturn->return_number,
                    'batch_number' => $item->batch_number,
                    'expiry_date' => $item->expiry_date?->toDateString(),
                    'notes' => __('purchasing.messages.return_void_notes', ['return' => $purchaseReturn->return_number]),
                    'recorded_by' => auth()->id(),
                    'recorded_at' => now(),
                    'allocate' => false,
                ]);

                $freightShare = $this->freightShareForReturnQty(
                    $freightShareByItemId[$item->grn_item_id] ?? 0.0,
                    (float) ($item->grnItem?->quantity_received ?? 0),
                    $returnQty
                );

                ProductCostAverager::applyInbound(
                    (int) $poItem->product_id,
                    $baseQty,
                    $grnService->unitCostInBase($poItem, $freightShare, $returnQty)
                );

                $poItem->increment('quantity_received', $returnQty);
            }

            $purchaseReturn->update(['status' => PurchaseReturn::STATUS_VOIDED]);
            $grnService->recalculatePurchaseOrderStatus($po->fresh(['items']));

            return $purchaseReturn->fresh(['items', 'purchaseOrder', 'warehouse']);
        });
    }

    private function freightShareForReturnQty(float $lineFreight, float $grnQty, float $returnQty): float
    {
        if ($lineFreight <= 0 || $grnQty <= 0 || $returnQty <= 0) {
            return 0.0;
        }

        return round($lineFreight * ($returnQty / $grnQty), 2);
    }

    private function voidLinkedCreditBills(PurchaseReturn $purchaseReturn): void
    {
        if (! Schema::hasTable('supplier_bill_lines')) {
            return;
        }

        foreach ($purchaseReturn->items as $item) {
            $lines = SupplierBillLine::query()
                ->where('source_type', $item->getMorphClass())
                ->where('source_id', $item->id)
                ->with('bill')
                ->get();

            foreach ($lines as $line) {
                $bill = $line->bill;
                if (! $bill || $bill->status === SupplierBill::STATUS_VOID) {
                    continue;
                }

                if ((float) $bill->amount_paid > 0.009) {
                    throw new RuntimeException(__('purchasing.messages.return_void_credit_paid'));
                }

                $bill->update(['status' => SupplierBill::STATUS_VOID]);
            }
        }
    }
}
