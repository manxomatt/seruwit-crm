<?php

namespace Modules\Outbound\Support;

use Modules\Orders\Models\DeliveryOrder;
use Modules\Outbound\Models\PickList;

/**
 * Lets POD stock posting know when outbound already deducted inventory at dispatch.
 */
class OutboundDispatchGate
{
    public static function hasDispatchedStock(DeliveryOrder|int $order): bool
    {
        $orderId = $order instanceof DeliveryOrder ? $order->id : $order;

        return PickList::query()
            ->where('delivery_order_id', $orderId)
            ->where('status', PickList::STATUS_DISPATCHED)
            ->exists();
    }
}
