<?php

namespace Modules\Outbound\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Outbound\Models\PickList;
use Modules\Outbound\Models\PickListItem;
use Modules\Product\Models\Product;

class PickListGenerator
{
    public static function generate(DeliveryOrder $order, Warehouse $warehouse, ?string $notes = null): PickList
    {
        $order->loadMissing(['items.product']);

        if (! in_array($order->status, [
            DeliveryOrder::STATUS_CONFIRMED,
            DeliveryOrder::STATUS_ASSIGNED,
            DeliveryOrder::STATUS_IN_TRANSIT,
        ], true)) {
            throw ValidationException::withMessages([
                'delivery_order_id' => 'Pick list can only be generated for confirmed, assigned, or in-transit orders.',
            ]);
        }

        if ($order->items->isEmpty()) {
            throw ValidationException::withMessages([
                'delivery_order_id' => 'Delivery order has no items to pick.',
            ]);
        }

        $activeExists = PickList::query()
            ->where('delivery_order_id', $order->id)
            ->whereNotIn('status', [PickList::STATUS_CANCELLED])
            ->exists();

        if ($activeExists) {
            throw ValidationException::withMessages([
                'delivery_order_id' => 'An active pick list already exists for this delivery order.',
            ]);
        }

        return DB::transaction(function () use ($order, $warehouse, $notes): PickList {
            $pickList = PickList::query()->create([
                'code' => PickList::nextCode(),
                'delivery_order_id' => $order->id,
                'warehouse_id' => $warehouse->id,
                'status' => PickList::STATUS_OPEN,
                'generated_by' => Auth::id(),
                'generated_at' => now(),
                'notes' => $notes,
            ]);

            foreach ($order->items as $orderItem) {
                /** @var Product|null $product */
                $product = $orderItem->product;

                if (! $product || $product->category === 'service') {
                    continue;
                }

                $suggestion = self::suggestStock((int) $product->id, (int) $warehouse->id);

                PickListItem::query()->create([
                    'pick_list_id' => $pickList->id,
                    'delivery_order_item_id' => $orderItem->id,
                    'product_id' => $product->id,
                    'quantity_requested' => $orderItem->quantity,
                    'quantity_picked' => 0,
                    'suggested_location_id' => $suggestion['location_id'] ?? null,
                    'suggested_batch_number' => $suggestion['batch_number'] ?? null,
                    'suggested_expiry_date' => $suggestion['expiry_date'] ?? null,
                    'status' => PickListItem::STATUS_PENDING,
                ]);
            }

            if ($pickList->items()->count() === 0) {
                throw ValidationException::withMessages([
                    'delivery_order_id' => 'No pickable (non-service) products on this delivery order.',
                ]);
            }

            return $pickList->fresh(['items', 'deliveryOrder', 'warehouse']);
        });
    }

    /**
     * @return array{location_id: int|null, batch_number: string|null, expiry_date: string|null}|array{}
     */
    public static function suggestStock(int $productId, int $warehouseId): array
    {
        $level = StockLevel::query()
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->whereRaw('(on_hand - reserved) > 0')
            ->orderByRaw('expiry_date ASC NULLS LAST')
            ->orderBy('id')
            ->first();

        if (! $level) {
            return [];
        }

        return [
            'location_id' => $level->location_id,
            'batch_number' => $level->batch_number !== '' ? $level->batch_number : null,
            'expiry_date' => $level->expiry_date?->toDateString(),
        ];
    }
}
