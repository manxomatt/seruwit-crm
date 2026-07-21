<?php

namespace Modules\Orders\Support;

use App\Notifications\GenericNotification;
use App\Support\NotificationRecipients;
use Illuminate\Support\Facades\Notification;
use Modules\Orders\Events\ShipmentStatusChanged;
use Modules\Orders\Models\DeliveryOrder;

/**
 * Announces a delivery-order status change to staff (in-app) and to the wider
 * app (the ShipmentStatusChanged event, the seam for a future customer push).
 *
 * Lives here because two callers need the exact same announcement: TripObserver
 * (whole-trip transitions) and the driver POD submission (per-stop delivery).
 * Keeping it in one place stops the two from drifting.
 */
class ShipmentStatusNotifier
{
    public function announce(DeliveryOrder $order, string $from, string $to): void
    {
        $recipients = NotificationRecipients::forPermission('orders', 'view');
        $label = str_replace('_', ' ', $to);

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
