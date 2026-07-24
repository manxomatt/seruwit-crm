<?php

namespace Modules\Inventory\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockReservation;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;
use RuntimeException;

/**
 * Links StockLevel.reserved to active delivery orders.
 *
 * confirm → reserve · cancel → release · outbound / POD / delivered → consume
 * (reserved↓ then stock out via StockMovementRecorder).
 */
class StockReservationService
{
    public static function reserveOrder(DeliveryOrder $order): void
    {
        $order->loadMissing(['items.product']);

        DB::transaction(function () use ($order): void {
            if (StockReservation::query()
                ->where('delivery_order_id', $order->id)
                ->exists()) {
                return;
            }

            foreach ($order->items as $item) {
                self::reserveItem($order, $item);
            }
        });
    }

    public static function releaseOrder(DeliveryOrder $order): void
    {
        DB::transaction(function () use ($order): void {
            $reservations = StockReservation::query()
                ->where('delivery_order_id', $order->id)
                ->where('status', StockReservation::STATUS_OPEN)
                ->lockForUpdate()
                ->orderBy('id')
                ->get();

            foreach ($reservations as $reservation) {
                self::releaseOpenQuantity($reservation, $reservation->remaining());
            }
        });
    }

    /**
     * Consume every open remaining reservation for the order (delivered without
     * prior POD/outbound consume). Idempotent.
     */
    public static function fulfillOrder(DeliveryOrder $order): void
    {
        DB::transaction(function () use ($order): void {
            $reservations = StockReservation::query()
                ->where('delivery_order_id', $order->id)
                ->where('status', StockReservation::STATUS_OPEN)
                ->lockForUpdate()
                ->orderBy('id')
                ->get();

            foreach ($reservations as $reservation) {
                $remaining = $reservation->remaining();

                if ($remaining <= 0) {
                    $reservation->update(['status' => StockReservation::STATUS_CLOSED]);

                    continue;
                }

                self::consumeOpenQuantity($reservation, $remaining, [
                    'source_type' => 'delivery_fulfillment',
                    'source_id' => $order->id,
                    'reference_code' => $order->code,
                    'notes' => 'Stock consumed on delivery for '.$order->code,
                ]);
            }
        });
    }

    /**
     * Consume up to $quantity from open reservations for a DO line.
     *
     * @param  array<string, mixed>  $movementMeta
     */
    public static function consumeForOrderItem(DeliveryOrderItem $item, float $quantity, array $movementMeta = []): float
    {
        $quantity = round($quantity, 2);

        if ($quantity <= 0) {
            return 0.0;
        }

        return (float) DB::transaction(function () use ($item, $quantity, $movementMeta): float {
            $item->loadMissing('deliveryOrder');

            $reservations = StockReservation::query()
                ->where('delivery_order_item_id', $item->id)
                ->where('status', StockReservation::STATUS_OPEN)
                ->lockForUpdate()
                ->orderBy('id')
                ->get();

            $left = $quantity;
            $consumed = 0.0;

            foreach ($reservations as $reservation) {
                if ($left <= 0) {
                    break;
                }

                $take = min($left, $reservation->remaining());

                if ($take <= 0) {
                    continue;
                }

                self::consumeOpenQuantity($reservation, $take, array_merge([
                    'source_type' => 'delivery_reservation',
                    'source_id' => $item->delivery_order_id,
                    'reference_code' => $item->deliveryOrder?->code,
                ], $movementMeta));

                $left = round($left - $take, 2);
                $consumed = round($consumed + $take, 2);
            }

            return $consumed;
        });
    }

    /**
     * Release leftover reserved qty for a DO line without reducing on_hand.
     */
    public static function releaseForOrderItem(DeliveryOrderItem $item, ?float $quantity = null): void
    {
        DB::transaction(function () use ($item, $quantity): void {
            $reservations = StockReservation::query()
                ->where('delivery_order_item_id', $item->id)
                ->where('status', StockReservation::STATUS_OPEN)
                ->lockForUpdate()
                ->orderBy('id')
                ->get();

            $left = $quantity;

            foreach ($reservations as $reservation) {
                $open = $reservation->remaining();

                if ($open <= 0) {
                    $reservation->update(['status' => StockReservation::STATUS_CLOSED]);

                    continue;
                }

                $take = $left === null ? $open : min($open, $left);

                if ($take <= 0) {
                    break;
                }

                self::releaseOpenQuantity($reservation, $take);

                if ($left !== null) {
                    $left = round($left - $take, 2);

                    if ($left <= 0) {
                        break;
                    }
                }
            }
        });
    }

    public static function hasOpenReservations(DeliveryOrder|int $order): bool
    {
        $orderId = $order instanceof DeliveryOrder ? $order->id : $order;

        return StockReservation::query()
            ->where('delivery_order_id', $orderId)
            ->where('status', StockReservation::STATUS_OPEN)
            ->whereColumn('consumed_quantity', '<', 'quantity')
            ->exists();
    }

    private static function reserveItem(DeliveryOrder $order, DeliveryOrderItem $item): void
    {
        $product = $item->product;

        if (! $product || $product->category === 'service') {
            return;
        }

        $warehouseId = $product->warehouse_id;

        if (! $warehouseId) {
            return;
        }

        $needed = round((float) $item->quantity, 2);

        if ($needed <= 0) {
            return;
        }

        $levels = StockLevel::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $warehouseId)
            ->whereRaw('(on_hand - reserved) > 0')
            ->orderByRaw('expiry_date ASC NULLS LAST')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        $remaining = $needed;

        foreach ($levels as $level) {
            if ($remaining <= 0) {
                break;
            }

            $available = round((float) $level->on_hand - (float) $level->reserved, 2);

            if ($available <= 0) {
                continue;
            }

            $take = min($remaining, $available);
            $level->increment('reserved', $take);

            StockReservation::query()->create([
                'delivery_order_id' => $order->id,
                'delivery_order_item_id' => $item->id,
                'product_id' => $product->id,
                'warehouse_id' => $warehouseId,
                'location_id' => $level->location_id,
                'batch_number' => $level->batch_number ?? '',
                'expiry_date' => $level->expiry_date,
                'quantity' => $take,
                'consumed_quantity' => 0,
                'status' => StockReservation::STATUS_OPEN,
            ]);

            $remaining = round($remaining - $take, 2);
        }

        if ($remaining > 0) {
            throw ValidationException::withMessages([
                'items' => "Insufficient available stock for {$product->name}. Short by {$remaining}.",
            ]);
        }
    }

    private static function releaseOpenQuantity(StockReservation $reservation, float $quantity): void
    {
        $quantity = round(min($quantity, $reservation->remaining()), 2);

        if ($quantity <= 0) {
            if ($reservation->remaining() <= 0) {
                $reservation->update(['status' => StockReservation::STATUS_CLOSED]);
            }

            return;
        }

        $level = self::lockLevel($reservation);
        $level->update([
            'reserved' => max(0, round((float) $level->reserved - $quantity, 2)),
        ]);

        $newQuantity = round((float) $reservation->quantity - $quantity, 2);
        $consumed = (float) $reservation->consumed_quantity;

        $reservation->update([
            'quantity' => max($newQuantity, $consumed),
            'status' => round(max($newQuantity, $consumed) - $consumed, 2) <= 0
                ? StockReservation::STATUS_CLOSED
                : StockReservation::STATUS_OPEN,
        ]);
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private static function consumeOpenQuantity(StockReservation $reservation, float $quantity, array $meta = []): void
    {
        $quantity = round(min($quantity, $reservation->remaining()), 2);

        if ($quantity <= 0) {
            return;
        }

        $level = self::lockLevel($reservation);

        if ((float) $level->reserved + 0.009 < $quantity) {
            throw new RuntimeException('Reserved quantity mismatch while consuming stock.');
        }

        // Free the soft lock first; StockMovementRecorder then reduces on_hand.
        $level->update([
            'reserved' => round((float) $level->reserved - $quantity, 2),
        ]);

        $batch = $reservation->batch_number !== '' ? $reservation->batch_number : null;

        StockMovementRecorder::record([
            'product_id' => $reservation->product_id,
            'warehouse_id' => $reservation->warehouse_id,
            'location_id' => $reservation->location_id,
            'type' => 'out',
            'quantity' => $quantity,
            'batch_number' => $batch,
            'expiry_date' => $reservation->expiry_date?->toDateString(),
            'source_type' => $meta['source_type'] ?? 'delivery_reservation',
            'source_id' => $meta['source_id'] ?? $reservation->delivery_order_id,
            'reference_code' => $meta['reference_code'] ?? null,
            'notes' => $meta['notes'] ?? null,
            'recorded_by' => $meta['recorded_by'] ?? Auth::id(),
            'recorded_at' => $meta['recorded_at'] ?? now(),
            'allocate' => false,
        ]);

        $newConsumed = round((float) $reservation->consumed_quantity + $quantity, 2);

        $reservation->update([
            'consumed_quantity' => $newConsumed,
            'status' => round((float) $reservation->quantity - $newConsumed, 2) <= 0
                ? StockReservation::STATUS_CLOSED
                : StockReservation::STATUS_OPEN,
        ]);
    }

    private static function lockLevel(StockReservation $reservation): StockLevel
    {
        $query = StockLevel::query()
            ->where('product_id', $reservation->product_id)
            ->where('warehouse_id', $reservation->warehouse_id)
            ->where('batch_number', $reservation->batch_number ?? '');

        if ($reservation->location_id === null) {
            $query->whereNull('location_id');
        } else {
            $query->where('location_id', $reservation->location_id);
        }

        $level = $query->lockForUpdate()->first();

        if (! $level) {
            throw new RuntimeException('Stock level for reservation not found.');
        }

        return $level;
    }
}
