<?php

namespace Modules\Orders\Observers;

use Illuminate\Support\Facades\DB;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Orders\Models\ProofOfDelivery;

class PodObserver
{
    public function created(ProofOfDelivery $pod): void
    {
        DB::transaction(function () use ($pod) {
            $pod->load(['items.deliveryOrderItem.product', 'deliveryOrder']);

            foreach ($pod->items as $podItem) {
                $product = $podItem->deliveryOrderItem?->product;
                if (! $product || $product->category !== 'merchandise') {
                    continue;
                }

                $warehouse = $product->warehouse;
                if (! $warehouse) {
                    continue;
                }

                // OUT movement: accepted_quantity
                if ($podItem->accepted_quantity > 0) {
                    StockMovementRecorder::record([
                        'product_id' => $product->id,
                        'warehouse_id' => $warehouse->id,
                        'type' => 'out',
                        'quantity' => $podItem->accepted_quantity,
                        'source_type' => 'pod',
                        'source_id' => $pod->id,
                        'reference_code' => $pod->deliveryOrder?->reference_code,
                        'notes' => 'terkirim ke konsumen',
                        'recorded_by' => $pod->submitted_by,
                        'recorded_at' => $pod->delivered_at,
                    ]);
                }

                // IN movement: returned_quantity (untuk retur dari konsumen)
                if ($podItem->returned_quantity > 0) {
                    StockMovementRecorder::record([
                        'product_id' => $product->id,
                        'warehouse_id' => $warehouse->id,
                        'type' => 'in',
                        'quantity' => $podItem->returned_quantity,
                        'source_type' => 'pod',
                        'source_id' => $pod->id,
                        'reference_code' => $pod->deliveryOrder?->reference_code,
                        'notes' => "retur dari konsumen: {$podItem->reason}",
                        'recorded_by' => $pod->submitted_by,
                        'recorded_at' => $pod->delivered_at,
                    ]);
                }
            }
        });
    }
}
