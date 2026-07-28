<?php

namespace Modules\Canvassing\Support;

use App\Modules\Facades\Modules;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Canvassing\Models\CanvassingVisit;
use Modules\Inventory\Support\AccessibleWarehouses;
use Modules\Product\Models\Product;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Support\PriceListResolver;
use Modules\Sales\Support\SalesOrderPromotionApplier;
use RuntimeException;

/**
 * Converts canvassing visit order lines into a draft Sales Order (soft-depends on sales).
 */
class VisitOrderToSalesOrderConverter
{
    public function salesAvailable(): bool
    {
        return Modules::available('sales')
            && class_exists(SalesOrder::class)
            && Schema::hasTable('sales_orders')
            && Schema::hasTable('sales_order_items');
    }

    /**
     * @param  list<array{product_id: int, quantity: float|int|string, unit_price?: float|int|string|null, unit?: string|null, notes?: string|null}>  $items
     */
    public function syncItems(CanvassingVisit $visit, array $items): void
    {
        $visit->orderItems()->delete();

        foreach ($items as $item) {
            $productId = (int) $item['product_id'];
            $qty = round((float) $item['quantity'], 2);

            if ($qty <= 0) {
                continue;
            }

            $product = Product::query()->findOrFail($productId);
            $unitPrice = array_key_exists('unit_price', $item) && $item['unit_price'] !== null
                ? round((float) $item['unit_price'], 2)
                : $this->resolveUnitPrice((int) $visit->partner_id, $product);

            $visit->orderItems()->create([
                'product_id' => $productId,
                'quantity' => $qty,
                'unit_price' => $unitPrice,
                'unit' => $item['unit'] ?? $product->unit,
                'notes' => $item['notes'] ?? null,
            ]);
        }
    }

    public function convert(CanvassingVisit $visit, ?int $warehouseId = null): SalesOrder
    {
        if (! $this->salesAvailable()) {
            throw new RuntimeException(__('canvassing.messages.sales_module_required'));
        }

        if ($visit->sales_order_id) {
            throw new RuntimeException(__('canvassing.messages.order_already_converted'));
        }

        $visit->loadMissing(['orderItems', 'partner']);

        if ($visit->orderItems->isEmpty()) {
            throw new RuntimeException(__('canvassing.messages.order_items_required'));
        }

        $resolvedWarehouseId = $warehouseId
            ?? ($visit->warehouse_id ? (int) $visit->warehouse_id : null)
            ?? $this->defaultWarehouseId();

        if ($resolvedWarehouseId === null) {
            throw new RuntimeException(__('canvassing.messages.warehouse_required'));
        }

        return DB::transaction(function () use ($visit, $resolvedWarehouseId): SalesOrder {
            $rawItems = $visit->orderItems->map(fn ($item): array => [
                'product_id' => (int) $item->product_id,
                'quantity_ordered' => (float) $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'unit' => $item->unit,
                'notes' => $item->notes,
            ])->all();

            $priced = $this->priceItems($rawItems, $resolvedWarehouseId, (int) $visit->partner_id);

            $so = SalesOrder::create([
                'partner_id' => $visit->partner_id,
                'warehouse_id' => $resolvedWarehouseId,
                'created_by' => auth()->id(),
                'so_number' => SalesOrder::nextNumber(),
                'status' => SalesOrder::STATUS_DRAFT,
                'ordered_at' => now()->toDateString(),
                'notes' => __('canvassing.messages.so_from_visit', ['id' => $visit->id]),
                'total_amount' => 0,
                'discount_total' => $priced['discount_total'],
            ]);

            foreach ($priced['items'] as $item) {
                $so->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity_ordered' => $item['quantity_ordered'],
                    'quantity_delivered' => 0,
                    'unit_price' => $item['unit_price'],
                    'line_discount' => $item['line_discount'] ?? 0,
                    'unit' => $item['unit'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            $so->recalculateTotal();

            if (class_exists(SalesOrderPromotionApplier::class)) {
                app(SalesOrderPromotionApplier::class)->record($so, $priced['items']);
            }

            $visit->update([
                'sales_order_id' => $so->id,
                'warehouse_id' => $resolvedWarehouseId,
            ]);

            return $so->fresh(['items']);
        });
    }

    /**
     * Prefer canvassing-channel checkout promos; fall back to sales-channel applier.
     *
     * @param  list<array<string, mixed>>  $rawItems
     * @return array{items: list<array<string, mixed>>, discount_total: float}
     */
    protected function priceItems(array $rawItems, int $warehouseId, int $partnerId): array
    {
        if (class_exists(\Modules\TradePromotions\Support\PromotionPricing::class)) {
            $quote = app(\Modules\TradePromotions\Support\PromotionPricing::class)->quote([
                'channel' => 'canvassing',
                'warehouse_id' => $warehouseId,
                'partner_id' => $partnerId,
                'lines' => array_map(fn (array $item): array => [
                    'product_id' => (int) $item['product_id'],
                    'quantity' => (float) $item['quantity_ordered'],
                    'unit_price' => (float) $item['unit_price'],
                ], $rawItems),
            ]);

            if ((float) $quote['discount_total'] > 0) {
                $byProduct = collect($quote['lines'])->keyBy('product_id');
                $merged = [];
                foreach ($rawItems as $item) {
                    $quoted = $byProduct->get((int) $item['product_id']);
                    $item['line_discount'] = $quoted ? (float) $quoted['line_discount'] : 0.0;
                    $item['_promo'] = $quoted && $quoted['program_id'] ? [
                        'program_id' => $quoted['program_id'],
                        'line_discount' => $quoted['line_discount'],
                        'product_id' => $quoted['product_id'],
                        'meta' => $quoted['meta'],
                    ] : null;
                    $merged[] = $item;
                }

                return [
                    'items' => $merged,
                    'discount_total' => (float) $quote['discount_total'],
                ];
            }
        }

        if (class_exists(SalesOrderPromotionApplier::class)) {
            return app(SalesOrderPromotionApplier::class)->apply($warehouseId, $partnerId, $rawItems);
        }

        return [
            'items' => array_map(function (array $item): array {
                $item['line_discount'] = 0;

                return $item;
            }, $rawItems),
            'discount_total' => 0.0,
        ];
    }

    protected function resolveUnitPrice(int $partnerId, Product $product): float
    {
        if (class_exists(PriceListResolver::class) && Schema::hasColumn('partners', 'price_list_id')) {
            $priceListId = \Modules\Partners\Models\Partner::query()
                ->whereKey($partnerId)
                ->value('price_list_id');

            if ($priceListId) {
                $resolved = PriceListResolver::resolveUnitPrice((int) $priceListId, (int) $product->id);
                if ($resolved !== null) {
                    return $resolved;
                }
            }

            return PriceListResolver::fallbackProductPrice($product);
        }

        return round((float) ($product->price ?? 0), 2);
    }

    protected function defaultWarehouseId(): ?int
    {
        if (! class_exists(AccessibleWarehouses::class)) {
            return null;
        }

        $id = AccessibleWarehouses::query()
            ->where('status', 'active')
            ->salesOutbound()
            ->orderBy('name')
            ->value('id');

        return $id ? (int) $id : null;
    }
}
