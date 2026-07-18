<?php

namespace Modules\Billing\Observers;

use App\Modules\Facades\Modules;
use Modules\Billing\Models\OrderCharge;
use Modules\Billing\Models\Tariff;
use Modules\Orders\Models\DeliveryOrder;

/**
 * Prices delivery orders as they move through their lifecycle. Lives in
 * Billing so that Orders stays free of any knowledge of this module — the
 * observer is registered from BillingModule::boot().
 *
 * Note: the confirmed → delivered transition happens through bulk query
 * updates in Orders' TripObserver, which fire no Eloquent events — Billing
 * must never hook the delivered transition. Invoicing queries
 * status = delivered directly instead.
 */
class DeliveryOrderObserver
{
    public function updated(DeliveryOrder $order): void
    {
        // available() is also false during an entitlement downgrade while the
        // data still exists — the module is unreachable by design, so pricing
        // simply stops until the tenant upgrades again.
        if (! Modules::available('billing') || ! $order->wasChanged('status')) {
            return;
        }

        if ($order->status === DeliveryOrder::STATUS_CONFIRMED) {
            $tariff = Tariff::findFor($order->customer_id, $order->pickup_address, $order->delivery_address);

            OrderCharge::firstOrCreate(
                ['delivery_order_id' => $order->id],
                ['tariff_id' => $tariff?->id, 'amount' => $tariff?->price ?? 0],
            );

            return;
        }

        if ($order->status === DeliveryOrder::STATUS_CANCELLED) {
            OrderCharge::query()
                ->where('delivery_order_id', $order->id)
                ->whereNull('invoice_id')
                ->delete();
        }
    }
}
