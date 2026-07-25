<?php

namespace Modules\Outbound\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Orders\Support\DeliveryOrderStock;
use Modules\Outbound\Models\Pack;
use Modules\Outbound\Models\PackItem;
use Modules\Outbound\Models\PickList;
use Modules\Outbound\Models\PickListItem;

class PickPackWorkflow
{
    /**
     * @param  array{quantity_picked: float|int|string, location_id?: int|null, batch_number?: string|null, expiry_date?: string|null, notes?: string|null}  $data
     */
    public static function confirmItem(PickListItem $item, array $data): PickListItem
    {
        return DB::transaction(function () use ($item, $data): PickListItem {
            $item = PickListItem::query()->lockForUpdate()->findOrFail($item->id);
            $pickList = PickList::query()->lockForUpdate()->findOrFail($item->pick_list_id);

            if (! in_array($pickList->status, [PickList::STATUS_OPEN, PickList::STATUS_PICKING], true)) {
                throw ValidationException::withMessages([
                    'pick_list' => __('outbound.messages.picking_closed'),
                ]);
            }

            $qty = round((float) $data['quantity_picked'], 2);

            if ($qty < 0) {
                throw ValidationException::withMessages([
                    'quantity_picked' => __('outbound.messages.qty_negative'),
                ]);
            }

            if ($qty - (float) $item->quantity_requested > 0.009) {
                throw ValidationException::withMessages([
                    'quantity_picked' => __('outbound.messages.qty_over_requested'),
                ]);
            }

            $status = PickListItem::STATUS_SHORT;
            if ($qty > 0 && $qty + 0.009 >= (float) $item->quantity_requested) {
                $status = PickListItem::STATUS_PICKED;
            } elseif ($qty > 0) {
                $status = PickListItem::STATUS_SHORT;
            }

            $item->update([
                'quantity_picked' => $qty,
                'location_id' => $data['location_id'] ?? $item->suggested_location_id,
                'batch_number' => $data['batch_number'] ?? $item->suggested_batch_number,
                'expiry_date' => $data['expiry_date'] ?? $item->suggested_expiry_date,
                'status' => $status,
                'picked_by' => Auth::id(),
                'picked_at' => $qty > 0 ? now() : null,
                'notes' => $data['notes'] ?? $item->notes,
            ]);

            if ($pickList->status === PickList::STATUS_OPEN) {
                $pickList->update(['status' => PickList::STATUS_PICKING]);
            }

            return $item->fresh();
        });
    }

    public static function completePicking(PickList $pickList): PickList
    {
        return DB::transaction(function () use ($pickList): PickList {
            $pickList = PickList::query()->lockForUpdate()->findOrFail($pickList->id);

            if (! in_array($pickList->status, [PickList::STATUS_OPEN, PickList::STATUS_PICKING], true)) {
                throw ValidationException::withMessages([
                    'pick_list' => __('outbound.messages.pick_list_not_picking'),
                ]);
            }

            $pending = $pickList->items()->where('status', PickListItem::STATUS_PENDING)->exists();

            if ($pending) {
                throw ValidationException::withMessages([
                    'pick_list' => __('outbound.messages.confirm_all_lines'),
                ]);
            }

            // Require at least one line with quantity > 0
            $anyPicked = $pickList->items()->where('quantity_picked', '>', 0)->exists();

            if (! $anyPicked) {
                throw ValidationException::withMessages([
                    'pick_list' => __('outbound.messages.need_picked_qty'),
                ]);
            }

            $pickList->update([
                'status' => PickList::STATUS_PICKED,
                'picked_at' => now(),
            ]);

            return $pickList->fresh();
        });
    }

    /**
     * @param  array{weight_kg?: float|null, notes?: string|null, items: list<array{pick_list_item_id: int, quantity: float|int|string}>}  $data
     */
    public static function createPack(PickList $pickList, array $data): Pack
    {
        return DB::transaction(function () use ($pickList, $data): Pack {
            $pickList = PickList::query()->lockForUpdate()->findOrFail($pickList->id);

            if (! in_array($pickList->status, [PickList::STATUS_PICKED, PickList::STATUS_PACKING, PickList::STATUS_PACKED], true)) {
                throw ValidationException::withMessages([
                    'pick_list' => __('outbound.messages.packing_requires_picked'),
                ]);
            }

            $items = collect($data['items'] ?? []);

            if ($items->isEmpty()) {
                throw ValidationException::withMessages([
                    'items' => __('outbound.messages.pack_items_required'),
                ]);
            }

            $pack = Pack::query()->create([
                'code' => Pack::nextCode(),
                'label_code' => Pack::nextLabelCode(),
                'pick_list_id' => $pickList->id,
                'status' => Pack::STATUS_OPEN,
                'packed_by' => Auth::id(),
                'packed_at' => now(),
                'weight_kg' => $data['weight_kg'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($items as $row) {
                $pickItem = PickListItem::query()->findOrFail($row['pick_list_item_id']);

                if ((int) $pickItem->pick_list_id !== (int) $pickList->id) {
                    throw ValidationException::withMessages([
                        'items' => __('outbound.messages.pack_items_wrong_list'),
                    ]);
                }

                $qty = round((float) $row['quantity'], 2);

                if ($qty <= 0 || $qty - (float) $pickItem->quantity_picked > 0.009) {
                    throw ValidationException::withMessages([
                        'items' => __('outbound.messages.pack_qty_invalid', ['id' => $pickItem->id]),
                    ]);
                }

                $alreadyPacked = (float) PackItem::query()
                    ->where('pick_list_item_id', $pickItem->id)
                    ->sum('quantity');

                if ($alreadyPacked + $qty - (float) $pickItem->quantity_picked > 0.009) {
                    throw ValidationException::withMessages([
                        'items' => __('outbound.messages.pack_qty_exceeds', ['id' => $pickItem->id]),
                    ]);
                }

                PackItem::query()->create([
                    'pack_id' => $pack->id,
                    'pick_list_item_id' => $pickItem->id,
                    'quantity' => $qty,
                ]);
            }

            $pickList->update([
                'status' => PickList::STATUS_PACKING,
            ]);

            return $pack->fresh(['items.pickListItem.product']);
        });
    }

    public static function sealPack(Pack $pack): Pack
    {
        return DB::transaction(function () use ($pack): Pack {
            $pack = Pack::query()->lockForUpdate()->findOrFail($pack->id);

            if ($pack->status !== Pack::STATUS_OPEN) {
                throw ValidationException::withMessages([
                    'pack' => __('outbound.messages.pack_seal_open_only'),
                ]);
            }

            $pack->update([
                'status' => Pack::STATUS_SEALED,
                'sealed_at' => now(),
            ]);

            $pickList = PickList::query()->lockForUpdate()->findOrFail($pack->pick_list_id);
            self::refreshPackStatus($pickList);

            return $pack->fresh();
        });
    }

    public static function refreshPackStatus(PickList $pickList): void
    {
        $pickedQty = (float) $pickList->items()->sum('quantity_picked');
        $packedQty = (float) PackItem::query()
            ->whereHas('pack', fn ($q) => $q->where('pick_list_id', $pickList->id)->where('status', Pack::STATUS_SEALED))
            ->sum('quantity');

        $allSealed = $pickList->packs()->exists()
            && ! $pickList->packs()->where('status', '!=', Pack::STATUS_SEALED)->exists();

        if ($allSealed && $packedQty + 0.009 >= $pickedQty && $pickedQty > 0) {
            $pickList->update([
                'status' => PickList::STATUS_PACKED,
                'packed_at' => now(),
            ]);
        }
    }

    public static function dispatch(PickList $pickList): PickList
    {
        return DB::transaction(function () use ($pickList): PickList {
            $pickList = PickList::query()->lockForUpdate()->with(['items.product', 'deliveryOrder'])->findOrFail($pickList->id);

            if ($pickList->status !== PickList::STATUS_PACKED) {
                throw ValidationException::withMessages([
                    'pick_list' => __('outbound.messages.dispatch_requires_packed'),
                ]);
            }

            foreach ($pickList->items as $item) {
                $qty = (float) $item->quantity_picked;

                if ($qty <= 0) {
                    continue;
                }

                if ($item->product?->category === 'service') {
                    continue;
                }

                $meta = [
                    'source_type' => 'outbound_dispatch',
                    'source_id' => $pickList->id,
                    'reference_code' => $pickList->code,
                    'notes' => __('outbound.messages.dispatch_notes', ['code' => $pickList->deliveryOrder?->code]),
                    'recorded_by' => Auth::id(),
                    'recorded_at' => now(),
                ];

                $orderItem = $item->deliveryOrderItem;
                $consumed = 0.0;

                if (
                    $orderItem
                    && $pickList->deliveryOrder
                    && DeliveryOrderStock::hasOpenReservations($pickList->deliveryOrder)
                ) {
                    $consumed = DeliveryOrderStock::consumeItem($orderItem, $qty, $meta);
                }

                $remainder = round($qty - $consumed, 2);

                if ($remainder > 0.009) {
                    StockMovementRecorder::record([
                        'product_id' => $item->product_id,
                        'warehouse_id' => $pickList->warehouse_id,
                        'location_id' => $item->location_id,
                        'type' => 'out',
                        'quantity' => $remainder,
                        'batch_number' => $item->batch_number,
                        'expiry_date' => $item->expiry_date?->toDateString(),
                        ...$meta,
                        'allocate' => $item->batch_number ? true : false,
                    ]);
                }
            }

            $pickList->update([
                'status' => PickList::STATUS_DISPATCHED,
                'dispatched_at' => now(),
            ]);

            return $pickList->fresh();
        });
    }

    public static function cancel(PickList $pickList): PickList
    {
        if (! $pickList->isCancellable()) {
            throw ValidationException::withMessages([
                'pick_list' => __('outbound.messages.pick_list_not_cancellable'),
            ]);
        }

        $pickList->update(['status' => PickList::STATUS_CANCELLED]);

        return $pickList->fresh();
    }
}
