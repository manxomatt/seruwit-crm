<?php

namespace Modules\Accounting\Support;

use Modules\Inventory\Models\StockOpname;
use Modules\Pos\Models\PosSale;
use Modules\Product\Models\Product;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\PurchaseReturn;
use Modules\Purchasing\Support\GrnConfirmationService;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\SalesReturn;
use Modules\Sales\Support\GinConfirmationService;

/**
 * Snapshot inventory / COGS amounts from operational documents for GL posting.
 */
class InventoryCostCalculator
{
    public function grnInventoryValue(GoodReceiptNote $grn): float
    {
        $grn->loadMissing(['items.purchaseOrderItem']);
        $freight = round((float) ($grn->freight_amount ?? 0), 2);
        $merchandise = 0.0;

        foreach ($grn->items as $item) {
            $merchandise += round(
                (float) $item->quantity_received * (float) ($item->purchaseOrderItem?->unit_price ?? 0),
                2
            );
        }

        return round($merchandise + $freight, 2);
    }

    public function ginCogsValue(GoodsIssueNote $gin): float
    {
        $gin->loadMissing(['items.salesOrderItem.product', 'items.salesOrderItem.packaging']);
        $ginService = app(GinConfirmationService::class);
        $total = 0.0;

        foreach ($gin->items as $item) {
            $soItem = $item->salesOrderItem;
            if ($soItem === null || $soItem->product_id === null) {
                continue;
            }

            $baseQty = $ginService->toBaseQuantity((float) $item->quantity_issued, $soItem);
            $unitCost = (float) ($soItem->product?->cost ?? 0);
            $total += round($baseQty * $unitCost, 2);
        }

        return round($total, 2);
    }

    public function posSaleCogsValue(PosSale $sale): float
    {
        $sale->loadMissing('items.product');
        $total = 0.0;

        foreach ($sale->items as $item) {
            if ($item->product?->isService()) {
                continue;
            }

            $total += round((float) $item->qty_base * (float) ($item->product?->cost ?? 0), 2);
        }

        return round($total, 2);
    }

    public function salesReturnCogsValue(SalesReturn $salesReturn): float
    {
        $salesReturn->loadMissing(['items.salesOrderItem.product', 'items.salesOrderItem.packaging']);
        $ginService = app(GinConfirmationService::class);
        $total = 0.0;

        foreach ($salesReturn->items as $item) {
            $soItem = $item->salesOrderItem;
            if ($soItem === null) {
                continue;
            }

            $baseQty = $ginService->toBaseQuantity((float) $item->quantity_returned, $soItem);
            $unitCost = (float) ($soItem->product?->cost ?? 0);
            $total += round($baseQty * $unitCost, 2);
        }

        return round($total, 2);
    }

    public function purchaseReturnInventoryValue(PurchaseReturn $purchaseReturn): float
    {
        $purchaseReturn->loadMissing([
            'items.purchaseOrderItem.packaging',
            'items.grnItem',
            'goodReceiptNote.items.purchaseOrderItem',
        ]);

        $grnService = app(GrnConfirmationService::class);
        $freightShareByItemId = $purchaseReturn->goodReceiptNote
            ? $grnService->allocateFreightByLineValue($purchaseReturn->goodReceiptNote)
            : [];

        $total = 0.0;

        foreach ($purchaseReturn->items as $item) {
            $poItem = $item->purchaseOrderItem;
            if ($poItem === null) {
                continue;
            }

            $returnQty = (float) $item->quantity_returned;
            $baseQty = $grnService->toBaseQuantity($returnQty, $poItem);
            $receivedQty = (float) ($item->grnItem?->quantity_received ?? 0);
            $freightShare = 0.0;

            if ($receivedQty > 0.009) {
                $fullFreight = $freightShareByItemId[$item->grn_item_id] ?? 0.0;
                $freightShare = round($fullFreight * ($returnQty / $receivedQty), 2);
            }

            $unitCost = $grnService->unitCostInBase($poItem, $freightShare, $returnQty);
            $total += round($baseQty * $unitCost, 2);
        }

        return round($total, 2);
    }

    /**
     * @return array{surplus: float, shortage: float}
     */
    public function opnameVarianceValues(StockOpname $opname): array
    {
        $opname->loadMissing(['items.product']);
        $surplus = 0.0;
        $shortage = 0.0;

        foreach ($opname->items as $item) {
            $variance = round((float) $item->actual_qty - (float) $item->system_qty, 2);
            if (abs($variance) < 0.005) {
                continue;
            }

            $unitCost = (float) ($item->product?->cost ?? Product::query()->whereKey($item->product_id)->value('cost') ?? 0);
            $value = round(abs($variance) * $unitCost, 2);

            if ($variance > 0) {
                $surplus += $value;
            } else {
                $shortage += $value;
            }
        }

        return [
            'surplus' => round($surplus, 2),
            'shortage' => round($shortage, 2),
        ];
    }
}
