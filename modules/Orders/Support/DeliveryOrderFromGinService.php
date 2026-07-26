<?php

namespace Modules\Orders\Support;

use App\Models\Setting;
use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Inventory\Models\Warehouse;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerAddress;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Support\GinConfirmationService;
use RuntimeException;

/**
 * Creates a logistics Delivery Order from a confirmed Sales GIN.
 *
 * Stock already left the warehouse at GIN confirm — this DO is for trip/POD only.
 */
class DeliveryOrderFromGinService
{
    public function isAvailable(): bool
    {
        return Modules::available('orders')
            && Schema::hasTable('delivery_orders')
            && Schema::hasColumn('delivery_orders', 'goods_issue_note_id');
    }

    public function existingForGin(GoodsIssueNote $gin): ?DeliveryOrder
    {
        if (! $this->isAvailable()) {
            return null;
        }

        return DeliveryOrder::query()
            ->where('goods_issue_note_id', $gin->id)
            ->where('status', '!=', DeliveryOrder::STATUS_CANCELLED)
            ->first();
    }

    public function createFromConfirmedGin(GoodsIssueNote $gin): DeliveryOrder
    {
        if (! $this->isAvailable()) {
            throw new RuntimeException(__('sales.messages.do_module_unavailable'));
        }

        if ($gin->status !== GoodsIssueNote::STATUS_CONFIRMED) {
            throw new RuntimeException(__('sales.messages.do_gin_confirmed_only'));
        }

        if ($existing = $this->existingForGin($gin)) {
            throw new RuntimeException(__('sales.messages.do_already_exists', [
                'code' => $existing->code,
            ]));
        }

        $gin->loadMissing([
            'salesOrder.partner.addresses',
            'warehouse',
            'items.salesOrderItem.product',
            'items.salesOrderItem.packaging',
        ]);

        if ($gin->items->isEmpty()) {
            throw new RuntimeException(__('sales.messages.do_gin_need_items'));
        }

        $partner = $gin->salesOrder?->partner;
        if (! $partner) {
            throw new RuntimeException(__('sales.messages.do_gin_need_customer'));
        }

        $destination = $this->resolveDeliveryDestination($partner);
        $pickup = $this->resolvePickupAddress($gin->warehouse);

        return DB::transaction(function () use ($gin, $partner, $destination, $pickup) {
            $order = DeliveryOrder::query()->create([
                'code' => DeliveryOrder::nextCode(),
                'partner_id' => $partner->id,
                'goods_issue_note_id' => $gin->id,
                'status' => DeliveryOrder::STATUS_DRAFT,
                'order_date' => $gin->issued_at?->toDateString() ?? now()->toDateString(),
                'pickup_address' => $pickup,
                'delivery_address' => $destination['address'],
                'delivery_lat' => $destination['lat'],
                'delivery_lng' => $destination['lng'],
                'notes' => __('sales.messages.do_from_gin_notes', [
                    'gin' => $gin->gin_number,
                    'so' => $gin->salesOrder?->so_number ?? '',
                ]),
            ]);

            $ginService = app(GinConfirmationService::class);

            foreach ($gin->items as $ginItem) {
                $soItem = $ginItem->salesOrderItem;
                $productId = $soItem?->product_id;

                if (! $productId) {
                    continue;
                }

                $baseQty = $ginService->toBaseQuantity((float) $ginItem->quantity_issued, $soItem);

                DeliveryOrderItem::query()->create([
                    'delivery_order_id' => $order->id,
                    'product_id' => $productId,
                    'goods_issue_note_item_id' => $ginItem->id,
                    'quantity' => $baseQty,
                    'notes' => $ginItem->batch_number
                        ? __('sales.messages.do_line_batch_notes', ['batch' => $ginItem->batch_number])
                        : null,
                ]);
            }

            if (! $order->items()->exists()) {
                throw new RuntimeException(__('sales.messages.do_gin_need_items'));
            }

            if ($this->shouldAutoConfirm($order)) {
                DeliveryOrderStock::reserve($order);
                $order->update([
                    'status' => DeliveryOrder::STATUS_CONFIRMED,
                    'confirmed_at' => now(),
                ]);
            }

            return $order->fresh(['items', 'partner']);
        });
    }

    private function shouldAutoConfirm(DeliveryOrder $order): bool
    {
        if (Setting::getValue('orders.auto_confirm_do_from_gin', '0') !== '1') {
            return false;
        }

        return filled($order->pickup_address) && filled($order->delivery_address);
    }

    /**
     * @return array{address: string, lat: ?float, lng: ?float}
     */
    private function resolveDeliveryDestination(Partner $partner): array
    {
        $addresses = $partner->relationLoaded('addresses')
            ? $partner->addresses
            : $partner->addresses()->get();

        /** @var PartnerAddress|null $shipping */
        $shipping = $addresses
            ->first(fn (PartnerAddress $a): bool => $a->type === 'shipping' && $a->is_default)
            ?? $addresses->first(fn (PartnerAddress $a): bool => $a->type === 'shipping')
            ?? $addresses->first(fn (PartnerAddress $a): bool => (bool) $a->is_default)
            ?? $addresses->first();

        if ($shipping) {
            $parts = array_filter([
                $shipping->street,
                $shipping->street2,
                $shipping->city,
                $shipping->province,
                $shipping->zip,
                $shipping->country,
            ], fn ($part) => filled($part));

            return [
                'address' => implode(', ', $parts) ?: ($partner->address ?: $partner->name),
                'lat' => $shipping->latitude !== null ? (float) $shipping->latitude : null,
                'lng' => $shipping->longitude !== null ? (float) $shipping->longitude : null,
            ];
        }

        return [
            'address' => filled($partner->address) ? (string) $partner->address : $partner->name,
            'lat' => null,
            'lng' => null,
        ];
    }

    private function resolvePickupAddress(?Warehouse $warehouse): string
    {
        if (! $warehouse) {
            return __('sales.messages.do_default_pickup');
        }

        if (filled($warehouse->location)) {
            return (string) $warehouse->location;
        }

        return $warehouse->name;
    }
}
