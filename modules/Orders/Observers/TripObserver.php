<?php

namespace Modules\Orders\Observers;

use App\Modules\Facades\Modules;
use Modules\Orders\Models\DeliveryOrder;
use Modules\TransportationManagement\Models\Trip;

/**
 * Keeps delivery order statuses in step with their trip's lifecycle. Lives in
 * Orders so that Transportation stays free of any knowledge of this module —
 * the observer is registered from OrdersModule::boot().
 */
class TripObserver
{
    public function updated(Trip $trip): void
    {
        // available() is also false during an entitlement downgrade while the
        // data still exists — the module is unreachable by design, so order
        // statuses simply stop syncing until the tenant upgrades again.
        if (! Modules::available('orders') || ! $trip->wasChanged('status')) {
            return;
        }

        match ($trip->status) {
            Trip::STATUS_IN_PROGRESS => $trip->deliveryOrders()
                ->where('status', DeliveryOrder::STATUS_ASSIGNED)
                ->update(['status' => DeliveryOrder::STATUS_IN_TRANSIT]),
            Trip::STATUS_COMPLETED => $trip->deliveryOrders()
                ->where('status', DeliveryOrder::STATUS_IN_TRANSIT)
                ->update([
                    'status' => DeliveryOrder::STATUS_DELIVERED,
                    'delivered_at' => now(),
                ]),
            Trip::STATUS_CANCELLED => $this->releaseOrders($trip),
            default => null,
        };
    }

    public function deleting(Trip $trip): void
    {
        if (! Modules::available('orders')) {
            return;
        }

        $this->releaseOrders($trip);
    }

    /**
     * A cancelled or deleted trip releases its orders for re-planning — the
     * orders themselves are not cancelled.
     */
    protected function releaseOrders(Trip $trip): void
    {
        DeliveryOrder::query()
            ->where('trip_id', $trip->id)
            ->whereIn('status', [DeliveryOrder::STATUS_ASSIGNED, DeliveryOrder::STATUS_IN_TRANSIT])
            ->update([
                'status' => DeliveryOrder::STATUS_CONFIRMED,
                'trip_id' => null,
            ]);
    }
}
