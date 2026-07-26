<?php

namespace Modules\Sales\Support;

use Modules\Sales\Models\SalesReturn;
use Modules\Sales\Models\SalesReturnItem;

class SalesReturnQuantity
{
    public static function alreadyReturnedForGinItem(int $ginItemId, ?int $exceptReturnId = null): float
    {
        return round((float) SalesReturnItem::query()
            ->where('gin_item_id', $ginItemId)
            ->whereHas('salesReturn', function ($query) use ($exceptReturnId): void {
                $query->whereIn('status', [SalesReturn::STATUS_DRAFT, SalesReturn::STATUS_CONFIRMED]);

                if ($exceptReturnId !== null) {
                    $query->whereKeyNot($exceptReturnId);
                }
            })
            ->sum('quantity_returned'), 2);
    }

    public static function remainingForGinItem(float $quantityIssued, int $ginItemId, ?int $exceptReturnId = null): float
    {
        return max(0, round($quantityIssued - self::alreadyReturnedForGinItem($ginItemId, $exceptReturnId), 2));
    }
}
