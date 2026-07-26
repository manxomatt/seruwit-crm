<?php

namespace Modules\Inventory\Support;

use Modules\Inventory\Models\StockLevel;
use Modules\Product\Models\Product;

class ProductCostAverager
{
    /**
     * Weighted moving average after an inbound receipt of $baseQty at $unitCost.
     * Call after stock has already been increased by $baseQty.
     */
    public static function applyInbound(int $productId, float $baseQty, float $unitCost): void
    {
        if ($baseQty <= 0) {
            return;
        }

        $product = Product::query()->whereKey($productId)->lockForUpdate()->first();

        if (! $product) {
            return;
        }

        $onHandAfter = self::onHandTotal($productId);
        $previousQty = max(0, round($onHandAfter - $baseQty, 2));
        $previousCost = (float) $product->cost;
        $incomingCost = round($unitCost, 4);

        if ($previousQty <= 0) {
            $product->update(['cost' => $incomingCost]);

            return;
        }

        $average = round(
            (($previousQty * $previousCost) + ($baseQty * $incomingCost)) / ($previousQty + $baseQty),
            4
        );

        $product->update(['cost' => $average]);
    }

    /**
     * Reverse a previously applied inbound (void GRN / purchase return).
     * Call after stock has already been decreased by $baseQty.
     * Uses $unitCost as the cost layer being removed (typically PO unit cost in base UOM).
     */
    public static function reverseInbound(int $productId, float $baseQty, float $unitCost): void
    {
        if ($baseQty <= 0) {
            return;
        }

        $product = Product::query()->whereKey($productId)->lockForUpdate()->first();

        if (! $product) {
            return;
        }

        $onHandAfter = self::onHandTotal($productId);
        $onHandBefore = round($onHandAfter + $baseQty, 2);
        $currentCost = (float) $product->cost;
        $removedCost = round($unitCost, 4);

        if ($onHandAfter <= 0.009) {
            $product->update(['cost' => $removedCost]);

            return;
        }

        $remainingValue = ($onHandBefore * $currentCost) - ($baseQty * $removedCost);

        if ($remainingValue < 0) {
            $remainingValue = 0;
        }

        $product->update(['cost' => round($remainingValue / $onHandAfter, 4)]);
    }

    private static function onHandTotal(int $productId): float
    {
        return round((float) StockLevel::query()
            ->where('product_id', $productId)
            ->sum('on_hand'), 2);
    }
}
