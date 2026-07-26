<?php

namespace Modules\Purchasing\Support;

use Modules\Purchasing\Models\PurchaseReturn;
use Modules\Purchasing\Models\PurchaseReturnItem;

class PurchaseReturnQuantity
{
    public static function alreadyReturnedForGrnItem(int $grnItemId, ?int $exceptReturnId = null): float
    {
        return round((float) PurchaseReturnItem::query()
            ->where('grn_item_id', $grnItemId)
            ->whereHas('purchaseReturn', function ($query) use ($exceptReturnId): void {
                $query->whereIn('status', [PurchaseReturn::STATUS_DRAFT, PurchaseReturn::STATUS_CONFIRMED]);

                if ($exceptReturnId !== null) {
                    $query->whereKeyNot($exceptReturnId);
                }
            })
            ->sum('quantity_returned'), 2);
    }

    public static function remainingForGrnItem(float $quantityReceived, int $grnItemId, ?int $exceptReturnId = null): float
    {
        return max(0, round($quantityReceived - self::alreadyReturnedForGrnItem($grnItemId, $exceptReturnId), 2));
    }
}
