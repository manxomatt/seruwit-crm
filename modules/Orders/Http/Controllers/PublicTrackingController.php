<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Orders\Models\DeliveryOrder;
use Modules\TransportationManagement\Models\Trip;

/**
 * The customer-facing "where is my shipment" page. Public — no auth, the tenant
 * is already resolved from the domain — and deliberately minimal: it exposes
 * only what a recipient needs, never pricing or driver personal data.
 */
class PublicTrackingController extends Controller
{
    public function show(string $token): Response
    {
        abort_unless(Modules::available('orders'), 404);

        $order = DeliveryOrder::query()
            ->where('tracking_token', $token)
            ->with('trip.vehicle')
            ->first();

        // A missing token, or an order not yet trackable, both look the same to
        // the public — never reveal that a draft or cancelled order exists.
        if ($order === null || in_array($order->status, [DeliveryOrder::STATUS_DRAFT, DeliveryOrder::STATUS_CANCELLED], true)) {
            abort(404);
        }

        return Inertia::render('Track/Show', [
            'order' => [
                'code' => $order->code,
                'status' => $order->status,
                'order_date' => $order->order_date?->toDateString(),
                'confirmed_at' => $order->confirmed_at?->toDateTimeString(),
                'delivered_at' => $order->delivered_at?->toDateTimeString(),
                'pickup_address' => $order->pickup_address,
                'delivery_address' => $order->delivery_address,
            ],
            'livePosition' => $this->livePosition($order),
        ]);
    }

    /**
     * The vehicle's last fix, only while the shipment is actually moving and
     * GPS is available. No driver data — just the point.
     *
     * @return array<string, mixed>|null
     */
    private function livePosition(DeliveryOrder $order): ?array
    {
        if (! Modules::available('tracking')) {
            return null;
        }

        if ($order->trip?->status !== Trip::STATUS_IN_PROGRESS) {
            return null;
        }

        $device = $order->trip->vehicle?->gpsDevice;

        if (! $device?->hasPosition()) {
            return null;
        }

        return [
            'latitude' => $device->last_latitude,
            'longitude' => $device->last_longitude,
            'speed_kph' => $device->last_speed_kph,
            'recorded_at' => $device->last_recorded_at?->toDateTimeString(),
        ];
    }
}
