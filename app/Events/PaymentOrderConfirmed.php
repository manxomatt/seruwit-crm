<?php

namespace App\Events;

use App\Models\PaymentOrder;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * A subscription payment has been verified and the money is ours.
 *
 * Dispatched after the confirmation transaction commits, so every listener sees
 * the confirmed order and the activated subscription. Downstream bookkeeping
 * (revenue journal, reseller commission) hangs off this event rather than off
 * PaymentOrderService, so a fault in either one can never fail a confirmation
 * that has already been accepted.
 */
class PaymentOrderConfirmed
{
    use Dispatchable;

    public function __construct(public readonly PaymentOrder $order) {}
}
