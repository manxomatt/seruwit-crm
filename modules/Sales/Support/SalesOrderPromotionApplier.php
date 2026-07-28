<?php

namespace Modules\Sales\Support;

use Modules\Sales\Models\SalesOrder;
use Modules\TradePromotions\Models\PromoApplication;
use Modules\TradePromotions\Support\PromotionPricing;

/**
 * Applies sell-time checkout promotions onto SO lines (soft-depends on promotions).
 */
class SalesOrderPromotionApplier
{
    /**
     * @param  list<array<string, mixed>>  $items  Validated SO item payloads
     * @return array{
     *     items: list<array<string, mixed>>,
     *     discount_total: float
     * }
     */
    public function apply(int $warehouseId, ?int $partnerId, array $items): array
    {
        if (! class_exists(PromotionPricing::class)) {
            return [
                'items' => array_map(function (array $item): array {
                    $item['line_discount'] = 0;

                    return $item;
                }, $items),
                'discount_total' => 0.0,
            ];
        }

        $quote = app(PromotionPricing::class)->quote([
            'channel' => 'sales',
            'warehouse_id' => $warehouseId,
            'partner_id' => $partnerId,
            'lines' => array_map(fn (array $item): array => [
                'product_id' => (int) $item['product_id'],
                'quantity' => (float) $item['quantity_ordered'],
                'unit_price' => (float) $item['unit_price'],
            ], $items),
        ]);

        $byProduct = collect($quote['lines'])->keyBy('product_id');
        $merged = [];

        foreach ($items as $item) {
            $quoted = $byProduct->get((int) $item['product_id']);
            $item['line_discount'] = $quoted ? (float) $quoted['line_discount'] : 0.0;
            $item['_promo'] = $quoted ? [
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

    /**
     * @param  list<array<string, mixed>>  $items  Items after apply() (may include _promo)
     */
    public function record(SalesOrder $order, array $items): void
    {
        if (! class_exists(PromotionPricing::class) || ! class_exists(PromoApplication::class)) {
            return;
        }

        PromoApplication::query()
            ->where('source_type', 'sales_order')
            ->where('source_id', $order->id)
            ->delete();

        $lines = [];
        foreach ($items as $item) {
            if (($item['_promo']['program_id'] ?? null) === null) {
                continue;
            }
            $lines[] = $item['_promo'];
        }

        app(PromotionPricing::class)->recordApplications('sales_order', (int) $order->id, $lines);
    }
}
