<?php

namespace Modules\Orders\Observers;

use App\Modules\Facades\Modules;
use App\Notifications\GenericNotification;
use App\Support\NotificationRecipients;
use Illuminate\Support\Facades\Notification;
use Modules\Orders\Events\ShipmentStatusChanged;
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
            Trip::STATUS_IN_PROGRESS => $this->advance(
                $trip,
                DeliveryOrder::STATUS_ASSIGNED,
                DeliveryOrder::STATUS_IN_TRANSIT,
            ),
            Trip::STATUS_COMPLETED => $this->advance(
                $trip,
                DeliveryOrder::STATUS_IN_TRANSIT,
                DeliveryOrder::STATUS_DELIVERED,
                ['delivered_at' => now()],
            ),
            Trip::STATUS_CANCELLED => $this->releaseOrders($trip),
            default => null,
        };
    }

    /**
     * Moves a trip's orders from one status to the next, then announces it.
     *
     * The status change itself is a bulk update — fast, and no Eloquent events
     * fire — so the notification and the customer-facing event are raised here
     * rather than from a model observer that would never see the transition.
     *
     * @param  array<string, mixed>  $extra
     */
    protected function advance(Trip $trip, string $from, string $to, array $extra = []): void
    {
        $orders = $trip->deliveryOrders()->where('status', $from)->get();

        if ($orders->isEmpty()) {
            return;
        }

        DeliveryOrder::query()
            ->whereIn('id', $orders->pluck('id'))
            ->update(['status' => $to, ...$extra]);

        $recipients = NotificationRecipients::forPermission('orders', 'view');
        $label = str_replace('_', ' ', $to);

        foreach ($orders as $order) {
            $order->status = $to;

            if ($recipients->isNotEmpty()) {
                Notification::send($recipients, new GenericNotification(
                    title: "{$order->code} — {$label}",
                    body: "Kiriman untuk {$order->customer?->name} kini {$label}.",
                    url: route('module.orders.show', $order->id),
                    icon: 'truck',
                    type: 'info',
                ));
            }

            ShipmentStatusChanged::dispatch($order, $from, $to);
        }
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
