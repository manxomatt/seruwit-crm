<?php

namespace Modules\Orders\Observers;

use App\Modules\Facades\Modules;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Support\DeliveryOrderStock;
use Modules\TransportationManagement\Models\TripStop;

/**
 * Marks a delivery order as delivered the moment its dropoff stop is
 * completed. Lives in Orders so that Transportation stays free of any
 * knowledge of this module — registered from OrdersModule::boot().
 */
class TripStopObserver
{
    public function updated(TripStop $stop): void
    {
        // available() is also false during an entitlement downgrade while the
        // data still exists — syncing pauses until the tenant upgrades again.
        if (! Modules::available('orders') || ! $stop->wasChanged('status')) {
            return;
        }

        if ($stop->status !== TripStop::STATUS_COMPLETED
            || $stop->type !== TripStop::TYPE_DROPOFF
            || $stop->delivery_order_id === null) {
            return;
        }

        $updated = DeliveryOrder::query()
            ->where('id', $stop->delivery_order_id)
            ->where('status', DeliveryOrder::STATUS_IN_TRANSIT)
            ->update([
                'status' => DeliveryOrder::STATUS_DELIVERED,
                'delivered_at' => now(),
            ]);

        if ($updated > 0) {
            $order = DeliveryOrder::query()->find($stop->delivery_order_id);

            if ($order) {
                DeliveryOrderStock::fulfill($order);
            }
        }
    }
}
