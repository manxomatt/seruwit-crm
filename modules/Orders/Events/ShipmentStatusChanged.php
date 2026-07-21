<?php

namespace Modules\Orders\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Modules\Orders\Models\DeliveryOrder;

/**
 * A delivery order moved to a new status. This is the seam for pushing an
 * update to the customer: today the public tracking page is pull-only and no
 * listener sends email/WhatsApp, but when a channel is configured a listener
 * can subscribe here without touching the code that changes the status.
 */
class ShipmentStatusChanged
{
    use Dispatchable;

    public function __construct(
        public readonly DeliveryOrder $order,
        public readonly string $from,
        public readonly string $to,
    ) {}
}
