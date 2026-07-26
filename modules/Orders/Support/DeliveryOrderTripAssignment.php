<?php

namespace Modules\Orders\Support;

use Modules\Orders\Models\DeliveryOrder;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripItem;
use Modules\TransportationManagement\Models\TripStop;

/**
 * Assigns / unassigns a Delivery Order onto a Trip: dropoff stop, optional
 * warehouse pickup stop, and cargo manifest (TripItem) sync.
 *
 * Inventory is never touched here — stock is handled by GIN / Outbound / POD.
 */
class DeliveryOrderTripAssignment
{
    /**
     * @param  array{address?: string, lat?: float|null, lng?: float|null}|null  $dropoff
     */
    public function assign(DeliveryOrder $order, Trip $trip, ?array $dropoff = null): void
    {
        $order->loadMissing('items');

        $this->ensurePickupStop($trip, $order);

        $trip->stops()->create([
            'sequence' => ((int) $trip->stops()->max('sequence')) + 1,
            'type' => TripStop::TYPE_DROPOFF,
            'address' => $dropoff['address'] ?? $order->delivery_address,
            'lat' => array_key_exists('lat', $dropoff ?? [])
                ? $dropoff['lat']
                : $order->delivery_lat,
            'lng' => array_key_exists('lng', $dropoff ?? [])
                ? $dropoff['lng']
                : $order->delivery_lng,
            'delivery_order_id' => $order->id,
            'status' => TripStop::STATUS_PENDING,
        ]);

        $order->update([
            'trip_id' => $trip->id,
            'status' => DeliveryOrder::STATUS_ASSIGNED,
        ]);

        $this->addManifestFromOrder($trip, $order);
    }

    public function unassign(DeliveryOrder $order): void
    {
        $order->loadMissing('items');

        $tripId = $order->trip_id;

        TripStop::query()
            ->where('delivery_order_id', $order->id)
            ->where('status', TripStop::STATUS_PENDING)
            ->delete();

        if ($tripId) {
            $trip = Trip::query()->find($tripId);

            if ($trip) {
                $this->removeManifestForOrder($trip, $order);
                $this->pruneOrphanPickup($trip);
            }
        }

        $order->update([
            'trip_id' => null,
            'status' => DeliveryOrder::STATUS_CONFIRMED,
        ]);
    }

    private function ensurePickupStop(Trip $trip, DeliveryOrder $order): void
    {
        if (! filled($order->pickup_address)) {
            return;
        }

        $hasPickup = $trip->stops()
            ->where('type', TripStop::TYPE_PICKUP)
            ->whereIn('status', [TripStop::STATUS_PENDING, TripStop::STATUS_ARRIVED])
            ->exists();

        if ($hasPickup) {
            return;
        }

        $trip->stops()->increment('sequence');

        $geo = $this->resolvePickupCoordinates($order);

        $trip->stops()->create([
            'sequence' => 1,
            'type' => TripStop::TYPE_PICKUP,
            'address' => $order->pickup_address,
            'lat' => $geo['lat'],
            'lng' => $geo['lng'],
            'delivery_order_id' => null,
            'status' => TripStop::STATUS_PENDING,
        ]);
    }

    /**
     * @return array{lat: float|null, lng: float|null}
     */
    private function resolvePickupCoordinates(DeliveryOrder $order): array
    {
        if (! $order->isFromGin()) {
            return ['lat' => null, 'lng' => null];
        }

        $order->loadMissing('goodsIssueNote.warehouse');

        $warehouse = $order->goodsIssueNote?->warehouse;

        if (! $warehouse) {
            return ['lat' => null, 'lng' => null];
        }

        return [
            'lat' => $warehouse->latitude !== null ? (float) $warehouse->latitude : null,
            'lng' => $warehouse->longitude !== null ? (float) $warehouse->longitude : null,
        ];
    }

    private function pruneOrphanPickup(Trip $trip): void
    {
        if ($trip->stops()->where('type', TripStop::TYPE_DROPOFF)->exists()) {
            return;
        }

        $trip->stops()
            ->where('type', TripStop::TYPE_PICKUP)
            ->where('status', TripStop::STATUS_PENDING)
            ->delete();
    }

    private function addManifestFromOrder(Trip $trip, DeliveryOrder $order): void
    {
        foreach ($order->items as $item) {
            /** @var TripItem|null $existing */
            $existing = $trip->items()->where('product_id', $item->product_id)->first();

            if ($existing) {
                $existing->update([
                    'quantity' => (float) $existing->quantity + (float) $item->quantity,
                ]);

                continue;
            }

            $trip->items()->create([
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'notes' => null,
            ]);
        }
    }

    private function removeManifestForOrder(Trip $trip, DeliveryOrder $order): void
    {
        foreach ($order->items as $item) {
            /** @var TripItem|null $existing */
            $existing = $trip->items()->where('product_id', $item->product_id)->first();

            if (! $existing) {
                continue;
            }

            $newQty = round((float) $existing->quantity - (float) $item->quantity, 2);

            if ($newQty <= 0) {
                $existing->delete();

                continue;
            }

            $existing->update(['quantity' => $newQty]);
        }
    }
}
