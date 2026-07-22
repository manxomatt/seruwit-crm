<?php

namespace Modules\Orders\Observers;

use App\Modules\Facades\Modules;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Orders\Models\PodItem;

/**
 * Records inventory stock movements for each delivered line.
 *
 * This lives on PodItem rather than ProofOfDelivery because the POD's `created`
 * event fires before its items exist — an observer on the parent would see an
 * empty item set. Firing per item guarantees the line's quantities are present.
 */
class PodItemObserver
{
    public function created(PodItem $podItem): void
    {
        if (! Modules::available('inventory')) {
            return;
        }

        $podItem->loadMissing(['deliveryOrderItem.product.warehouse', 'proofOfDelivery.deliveryOrder']);

        $product = $podItem->deliveryOrderItem?->product;
        if (! $product || $product->category !== 'merchandise') {
            return;
        }

        $warehouse = $product->warehouse;
        if (! $warehouse) {
            return;
        }

        $pod = $podItem->proofOfDelivery;

        // OUT movement: accepted_quantity (delivered to customer)
        if ($podItem->accepted_quantity > 0) {
            StockMovementRecorder::record([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'type' => 'out',
                'quantity' => $podItem->accepted_quantity,
                'source_type' => 'pod',
                'source_id' => $pod?->id,
                'reference_code' => $pod?->deliveryOrder?->reference_code,
                'notes' => 'terkirim ke konsumen',
                'recorded_by' => $pod?->submitted_by,
                'recorded_at' => $pod?->delivered_at,
            ]);
        }

        // IN movement: returned_quantity (returned by customer)
        if ($podItem->returned_quantity > 0) {
            StockMovementRecorder::record([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'type' => 'in',
                'quantity' => $podItem->returned_quantity,
                'source_type' => 'pod',
                'source_id' => $pod?->id,
                'reference_code' => $pod?->deliveryOrder?->reference_code,
                'notes' => "retur dari konsumen: {$podItem->reason}",
                'recorded_by' => $pod?->submitted_by,
                'recorded_at' => $pod?->delivered_at,
            ]);
        }
    }
}
