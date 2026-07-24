<?php

namespace Modules\Orders\Support;

use App\Modules\Facades\Modules;
use Modules\Inventory\Support\StockReservationService;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;

/**
 * Soft-gated bridge from Orders lifecycle to Inventory reservations.
 */
class DeliveryOrderStock
{
    public static function reserve(DeliveryOrder $order): void
    {
        if (! self::enabled()) {
            return;
        }

        StockReservationService::reserveOrder($order);
    }

    public static function release(DeliveryOrder $order): void
    {
        if (! self::enabled()) {
            return;
        }

        StockReservationService::releaseOrder($order);
    }

    public static function fulfill(DeliveryOrder $order): void
    {
        if (! self::enabled()) {
            return;
        }

        StockReservationService::fulfillOrder($order);
    }

    /**
     * @param  array<string, mixed>  $movementMeta
     */
    public static function consumeItem(DeliveryOrderItem $item, float $quantity, array $movementMeta = []): float
    {
        if (! self::enabled()) {
            return 0.0;
        }

        return StockReservationService::consumeForOrderItem($item, $quantity, $movementMeta);
    }

    public static function releaseItem(DeliveryOrderItem $item, ?float $quantity = null): void
    {
        if (! self::enabled()) {
            return;
        }

        StockReservationService::releaseForOrderItem($item, $quantity);
    }

    public static function hasOpenReservations(DeliveryOrder $order): bool
    {
        return self::enabled() && StockReservationService::hasOpenReservations($order);
    }

    private static function enabled(): bool
    {
        return Modules::available('inventory')
            && class_exists(StockReservationService::class)
            && \Illuminate\Support\Facades\Schema::hasTable('stock_reservations');
    }
}
