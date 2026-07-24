<?php

namespace Modules\Orders\Observers;

use App\Modules\Facades\Modules;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Orders\Models\PodItem;
use Modules\Orders\Support\DeliveryOrderStock;
use Modules\Outbound\Support\OutboundDispatchGate;

/**
 * Records inventory stock movements for each delivered line.
 *
 * Prefers consuming/releasing StockLevel.reserved linked to the delivery order.
 * Falls back to a plain stock-out when no reservation covers the accepted qty.
 */
class PodItemObserver
{
    public function created(PodItem $podItem): void
    {
        if (! Modules::available('inventory')) {
            return;
        }

        $podItem->loadMissing(['deliveryOrderItem.product.warehouse', 'proofOfDelivery.deliveryOrder']);

        $orderItem = $podItem->deliveryOrderItem;
        $product = $orderItem?->product;

        if (! $product || $product->category !== 'merchandise') {
            return;
        }

        $warehouse = $product->warehouse;
        if (! $warehouse) {
            return;
        }

        $pod = $podItem->proofOfDelivery;
        $order = $pod?->deliveryOrder;
        $alreadyDispatched = Modules::available('outbound')
            && class_exists(OutboundDispatchGate::class)
            && $order
            && OutboundDispatchGate::hasDispatchedStock($order);

        $accepted = (float) $podItem->accepted_quantity;

        if ($alreadyDispatched) {
            // Stock already left the warehouse at pick/pack dispatch — only clear leftover reserved.
            if ($orderItem) {
                DeliveryOrderStock::releaseItem($orderItem);
            }
        } elseif ($accepted > 0 && $orderItem && DeliveryOrderStock::hasOpenReservations($order)) {
            $consumed = DeliveryOrderStock::consumeItem($orderItem, $accepted, [
                'source_type' => 'pod',
                'source_id' => $pod?->id,
                'reference_code' => $order?->code,
                'notes' => 'terkirim ke konsumen',
                'recorded_by' => $pod?->submitted_by,
                'recorded_at' => $pod?->delivered_at,
            ]);

            $shortfall = round($accepted - $consumed, 2);

            if ($shortfall > 0.009) {
                StockMovementRecorder::record([
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouse->id,
                    'type' => 'out',
                    'quantity' => $shortfall,
                    'source_type' => 'pod',
                    'source_id' => $pod?->id,
                    'reference_code' => $order?->code,
                    'notes' => 'terkirim ke konsumen (unreserved)',
                    'recorded_by' => $pod?->submitted_by,
                    'recorded_at' => $pod?->delivered_at,
                ]);
            }

            DeliveryOrderStock::releaseItem($orderItem);
        } elseif ($accepted > 0) {
            StockMovementRecorder::record([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'type' => 'out',
                'quantity' => $accepted,
                'source_type' => 'pod',
                'source_id' => $pod?->id,
                'reference_code' => $order?->code,
                'notes' => 'terkirim ke konsumen',
                'recorded_by' => $pod?->submitted_by,
                'recorded_at' => $pod?->delivered_at,
            ]);
        }

        if ($podItem->returned_quantity > 0) {
            StockMovementRecorder::record([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'type' => 'in',
                'quantity' => $podItem->returned_quantity,
                'source_type' => 'pod',
                'source_id' => $pod?->id,
                'reference_code' => $order?->code,
                'notes' => "retur dari konsumen: {$podItem->reason}",
                'recorded_by' => $pod?->submitted_by,
                'recorded_at' => $pod?->delivered_at,
            ]);
        }
    }
}
