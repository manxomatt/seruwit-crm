<?php

namespace Modules\Orders\Support;

use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\Schema;
use Modules\Inventory\Support\StockReservationService;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;

/**
 * Soft-gated bridge from Orders lifecycle to Inventory reservations.
 *
 * DOs created from a confirmed Sales GIN already had stock deducted at GIN
 * confirm — reserve/fulfill/consume must be skipped for those orders.
 */
class DeliveryOrderStock
{
    public static function managesInventory(DeliveryOrder $order): bool
    {
        return ! self::isStockHandledUpstream($order);
    }

    public static function isStockHandledUpstream(DeliveryOrder|int $order): bool
    {
        if ($order instanceof DeliveryOrder) {
            return $order->isFromGin();
        }

        if (! Schema::hasColumn('delivery_orders', 'goods_issue_note_id')) {
            return false;
        }

        return DeliveryOrder::query()
            ->whereKey($order)
            ->whereNotNull('goods_issue_note_id')
            ->exists();
    }

    public static function reserve(DeliveryOrder $order): void
    {
        if (! self::enabled() || ! self::managesInventory($order)) {
            return;
        }

        StockReservationService::reserveOrder($order);
    }

    public static function release(DeliveryOrder $order): void
    {
        if (! self::enabled() || ! self::managesInventory($order)) {
            return;
        }

        StockReservationService::releaseOrder($order);
    }

    public static function fulfill(DeliveryOrder $order): void
    {
        if (! self::enabled() || ! self::managesInventory($order)) {
            return;
        }

        StockReservationService::fulfillOrder($order);
    }

    /**
     * @param  array<string, mixed>  $movementMeta
     */
    public static function consumeItem(DeliveryOrderItem $item, float $quantity, array $movementMeta = []): float
    {
        $item->loadMissing('deliveryOrder');

        if (! self::enabled() || ($item->deliveryOrder && ! self::managesInventory($item->deliveryOrder))) {
            return 0.0;
        }

        return StockReservationService::consumeForOrderItem($item, $quantity, $movementMeta);
    }

    public static function releaseItem(DeliveryOrderItem $item, ?float $quantity = null): void
    {
        $item->loadMissing('deliveryOrder');

        if (! self::enabled() || ($item->deliveryOrder && ! self::managesInventory($item->deliveryOrder))) {
            return;
        }

        StockReservationService::releaseForOrderItem($item, $quantity);
    }

    public static function hasOpenReservations(DeliveryOrder $order): bool
    {
        return self::enabled()
            && self::managesInventory($order)
            && StockReservationService::hasOpenReservations($order);
    }

    private static function enabled(): bool
    {
        return Modules::available('inventory')
            && class_exists(StockReservationService::class)
            && Schema::hasTable('stock_reservations');
    }
}
