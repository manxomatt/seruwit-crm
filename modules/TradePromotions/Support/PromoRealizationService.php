<?php

namespace Modules\TradePromotions\Support;

use App\Modules\Facades\Modules;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Partners\Models\Partner;
use Modules\TradePromotions\Models\TradePromoAward;
use Modules\TradePromotions\Models\TradePromoProgram;
use Modules\TradePromotions\Models\TradePromoRealization;
use Modules\TradePromotions\Models\TradePromoTier;

/**
 * Syncs realized qty/value from Delivery Orders, Sales Orders, and POS sales
 * (when those modules/tables are available) and accrues awards from tiers / rebate rules.
 */
class PromoRealizationService
{
    public function syncProgram(TradePromoProgram $program): Collection
    {
        if ($program->mode === TradePromoProgram::MODE_CHECKOUT
            || $program->type === TradePromoProgram::TYPE_CHECKOUT_DISCOUNT) {
            return collect();
        }

        $program->loadMissing(['partners', 'products', 'warehouses', 'tiers.freeProduct', 'rebateRule']);

        $partnerIds = $program->partners->isEmpty()
            ? Partner::query()->where('customer_rank', '>', 0)->pluck('id')
            : $program->partners->pluck('id');

        $productIds = $program->products->isEmpty()
            ? null
            : $program->products->pluck('id')->all();

        $warehouseIds = $this->scopedWarehouseIds($program);

        if ($warehouseIds !== null && $warehouseIds === []) {
            return collect();
        }

        // DO has no warehouse column — only include for global (unscoped) programs.
        $totals = $this->mergePartnerTotals([
            $warehouseIds === null
                ? $this->aggregateFromDeliveryOrders($program, $partnerIds->all(), $productIds)
                : [],
            $this->aggregateFromSalesOrders($program, $partnerIds->all(), $productIds, $warehouseIds),
            $this->aggregateFromPosSales($program, $partnerIds->all(), $productIds, $warehouseIds),
        ]);

        return DB::transaction(function () use ($program, $partnerIds, $totals): Collection {
            $rows = collect();

            foreach ($partnerIds as $partnerId) {
                $qty = (float) ($totals[$partnerId]['qty'] ?? 0);
                $value = (float) ($totals[$partnerId]['value'] ?? 0);

                $target = (float) ($program->target_amount ?? 0);
                $realized = $program->target_metric === TradePromoProgram::METRIC_VALUE ? $value : $qty;
                $achievement = $target > 0 ? round(min(999, ($realized / $target) * 100), 2) : 0.0;

                $realization = TradePromoRealization::query()->updateOrCreate(
                    [
                        'trade_promo_program_id' => $program->id,
                        'partner_id' => $partnerId,
                    ],
                    [
                        'realized_qty' => $qty,
                        'realized_value' => $value,
                        'target_qty' => $program->target_metric === TradePromoProgram::METRIC_VOLUME ? $program->target_amount : null,
                        'target_value' => $program->target_metric === TradePromoProgram::METRIC_VALUE ? $program->target_amount : null,
                        'achievement_percent' => $achievement,
                        'status' => $achievement >= 100
                            ? TradePromoRealization::STATUS_ACHIEVED
                            : TradePromoRealization::STATUS_OPEN,
                        'last_synced_at' => now(),
                    ],
                );

                $this->accrueAwards($program, $realization);
                $rows->push($realization->fresh(['partner', 'awards']));
            }

            return $rows;
        });
    }

    /**
     * @return list<int>|null null = no warehouse filter; empty list = sites program with no warehouses
     */
    private function scopedWarehouseIds(TradePromoProgram $program): ?array
    {
        if ($program->scope !== TradePromoProgram::SCOPE_SITES) {
            return null;
        }

        return $program->warehouses->pluck('id')->map(fn ($id): int => (int) $id)->values()->all();
    }

    /**
     * @param  list<array<int, array{qty: float, value: float}>>  $chunks
     * @return array<int, array{qty: float, value: float}>
     */
    private function mergePartnerTotals(array $chunks): array
    {
        $merged = [];

        foreach ($chunks as $chunk) {
            foreach ($chunk as $partnerId => $row) {
                if (! isset($merged[$partnerId])) {
                    $merged[$partnerId] = ['qty' => 0.0, 'value' => 0.0];
                }
                $merged[$partnerId]['qty'] += (float) $row['qty'];
                $merged[$partnerId]['value'] += (float) $row['value'];
            }
        }

        return $merged;
    }

    /**
     * @param  list<int>  $partnerIds
     * @param  list<int>|null  $productIds
     * @return array<int, array{qty: float, value: float}>
     */
    private function aggregateFromDeliveryOrders(TradePromoProgram $program, array $partnerIds, ?array $productIds): array
    {
        if ($partnerIds === []) {
            return [];
        }

        if (! Modules::available('orders')
            || ! class_exists(\Modules\Orders\Models\DeliveryOrder::class)
            || ! Schema::hasTable('delivery_orders')
            || ! Schema::hasTable('delivery_order_items')) {
            return [];
        }

        $statuses = [
            \Modules\Orders\Models\DeliveryOrder::STATUS_CONFIRMED,
            \Modules\Orders\Models\DeliveryOrder::STATUS_ASSIGNED,
            \Modules\Orders\Models\DeliveryOrder::STATUS_IN_TRANSIT,
            \Modules\Orders\Models\DeliveryOrder::STATUS_DELIVERED,
        ];

        $query = DB::table('delivery_order_items')
            ->join('delivery_orders', 'delivery_orders.id', '=', 'delivery_order_items.delivery_order_id')
            ->join('products', 'products.id', '=', 'delivery_order_items.product_id')
            ->whereIn('delivery_orders.partner_id', $partnerIds)
            ->whereIn('delivery_orders.status', $statuses)
            ->whereBetween('delivery_orders.order_date', [
                $program->starts_at->toDateString(),
                $program->ends_at->toDateString(),
            ])
            ->when($productIds !== null, fn ($q) => $q->whereIn('delivery_order_items.product_id', $productIds))
            ->groupBy('delivery_orders.partner_id')
            ->selectRaw('delivery_orders.partner_id, sum(delivery_order_items.quantity) as qty, sum(delivery_order_items.quantity * coalesce(products.price, 0)) as value');

        return $this->mapAggregateRows($query->get());
    }

    /**
     * Delivered SO lines (quantity_delivered > 0), valued at transaction net unit price.
     *
     * @param  list<int>  $partnerIds
     * @param  list<int>|null  $productIds
     * @param  list<int>|null  $warehouseIds
     * @return array<int, array{qty: float, value: float}>
     */
    private function aggregateFromSalesOrders(
        TradePromoProgram $program,
        array $partnerIds,
        ?array $productIds,
        ?array $warehouseIds,
    ): array {
        if ($partnerIds === []
            || ! Modules::available('sales')
            || ! class_exists(\Modules\Sales\Models\SalesOrder::class)
            || ! Schema::hasTable('sales_orders')
            || ! Schema::hasTable('sales_order_items')) {
            return [];
        }

        $excluded = [
            \Modules\Sales\Models\SalesOrder::STATUS_DRAFT,
            \Modules\Sales\Models\SalesOrder::STATUS_CANCELLED,
        ];

        $hasLineDiscount = Schema::hasColumn('sales_order_items', 'line_discount');

        $valueExpr = $hasLineDiscount
            ? 'sum(
                sales_order_items.quantity_delivered * sales_order_items.unit_price
                - case
                    when sales_order_items.quantity_ordered > 0
                    then coalesce(sales_order_items.line_discount, 0) * sales_order_items.quantity_delivered / sales_order_items.quantity_ordered
                    else 0
                  end
            ) as value'
            : 'sum(sales_order_items.quantity_delivered * sales_order_items.unit_price) as value';

        $query = DB::table('sales_order_items')
            ->join('sales_orders', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->whereIn('sales_orders.partner_id', $partnerIds)
            ->whereNotIn('sales_orders.status', $excluded)
            ->where('sales_order_items.quantity_delivered', '>', 0)
            ->whereBetween('sales_orders.ordered_at', [
                $program->starts_at->toDateString(),
                $program->ends_at->toDateString(),
            ])
            ->when($productIds !== null, fn ($q) => $q->whereIn('sales_order_items.product_id', $productIds))
            ->when($warehouseIds !== null, fn ($q) => $q->whereIn('sales_orders.warehouse_id', $warehouseIds))
            ->groupBy('sales_orders.partner_id')
            ->selectRaw('sales_orders.partner_id, sum(sales_order_items.quantity_delivered) as qty, '.$valueExpr);

        return $this->mapAggregateRows($query->get());
    }

    /**
     * Completed POS sales with a partner (walk-in without partner is excluded from trade).
     *
     * @param  list<int>  $partnerIds
     * @param  list<int>|null  $productIds
     * @param  list<int>|null  $warehouseIds
     * @return array<int, array{qty: float, value: float}>
     */
    private function aggregateFromPosSales(
        TradePromoProgram $program,
        array $partnerIds,
        ?array $productIds,
        ?array $warehouseIds,
    ): array {
        if ($partnerIds === []
            || ! Modules::available('pos')
            || ! class_exists(\Modules\Pos\Models\PosSale::class)
            || ! Schema::hasTable('pos_sales')
            || ! Schema::hasTable('pos_sale_items')) {
            return [];
        }

        $query = DB::table('pos_sale_items')
            ->join('pos_sales', 'pos_sales.id', '=', 'pos_sale_items.pos_sale_id')
            ->where('pos_sales.status', \Modules\Pos\Models\PosSale::STATUS_COMPLETED)
            ->whereNotNull('pos_sales.partner_id')
            ->whereIn('pos_sales.partner_id', $partnerIds)
            ->whereBetween('pos_sales.sold_at', [
                $program->starts_at->copy()->startOfDay(),
                $program->ends_at->copy()->endOfDay(),
            ])
            ->when($productIds !== null, fn ($q) => $q->whereIn('pos_sale_items.product_id', $productIds))
            ->when($warehouseIds !== null, fn ($q) => $q->whereIn('pos_sales.warehouse_id', $warehouseIds))
            ->groupBy('pos_sales.partner_id')
            ->selectRaw('pos_sales.partner_id, sum(pos_sale_items.quantity) as qty, sum(coalesce(pos_sale_items.line_total, pos_sale_items.quantity * pos_sale_items.unit_price - coalesce(pos_sale_items.line_discount, 0))) as value');

        return $this->mapAggregateRows($query->get());
    }

    /**
     * @param  \Illuminate\Support\Collection<int, object>  $rows
     * @return array<int, array{qty: float, value: float}>
     */
    private function mapAggregateRows(Collection $rows): array
    {
        $result = [];

        foreach ($rows as $row) {
            $result[(int) $row->partner_id] = [
                'qty' => (float) $row->qty,
                'value' => round((float) $row->value, 2),
            ];
        }

        return $result;
    }

    private function accrueAwards(TradePromoProgram $program, TradePromoRealization $realization): void
    {
        TradePromoAward::query()
            ->where('trade_promo_realization_id', $realization->id)
            ->where('status', TradePromoAward::STATUS_ACCRUED)
            ->delete();

        $qty = (float) $realization->realized_qty;
        $value = (float) $realization->realized_value;

        if ($program->type === TradePromoProgram::TYPE_REBATE && $program->rebateRule) {
            $rule = $program->rebateRule;
            $amount = 0.0;
            if ($rule->rebate_percent !== null && $rule->calc_basis === 'net_value') {
                $amount = round($value * ((float) $rule->rebate_percent / 100), 2);
            } elseif ($rule->rebate_per_unit !== null) {
                $amount = round($qty * (float) $rule->rebate_per_unit, 2);
            } elseif ($rule->rebate_percent !== null) {
                $amount = round($value * ((float) $rule->rebate_percent / 100), 2);
            }

            if ($amount > 0) {
                TradePromoAward::query()->create([
                    'trade_promo_program_id' => $program->id,
                    'trade_promo_realization_id' => $realization->id,
                    'partner_id' => $realization->partner_id,
                    'award_type' => TradePromoAward::TYPE_REBATE,
                    'amount' => $amount,
                    'status' => TradePromoAward::STATUS_ACCRUED,
                ]);
            }

            return;
        }

        $tier = $this->bestTier($program, $qty, $value);
        if ($tier === null) {
            return;
        }

        if ($program->type === TradePromoProgram::TYPE_VOLUME_DISCOUNT) {
            $amount = 0.0;
            if ($tier->discount_percent !== null) {
                $amount = round($value * ((float) $tier->discount_percent / 100), 2);
            } elseif ($tier->discount_amount !== null) {
                $amount = (float) $tier->discount_amount;
            }

            if ($amount > 0) {
                TradePromoAward::query()->create([
                    'trade_promo_program_id' => $program->id,
                    'trade_promo_realization_id' => $realization->id,
                    'partner_id' => $realization->partner_id,
                    'award_type' => TradePromoAward::TYPE_DISCOUNT,
                    'amount' => $amount,
                    'status' => TradePromoAward::STATUS_ACCRUED,
                    'notes' => 'Tier #'.$tier->sort_order,
                ]);
            }
        }

        if ($program->type === TradePromoProgram::TYPE_FREE_GOODS && $tier->free_product_id && $tier->free_qty) {
            TradePromoAward::query()->create([
                'trade_promo_program_id' => $program->id,
                'trade_promo_realization_id' => $realization->id,
                'partner_id' => $realization->partner_id,
                'award_type' => TradePromoAward::TYPE_FREE_GOODS,
                'free_product_id' => $tier->free_product_id,
                'free_qty' => $tier->free_qty,
                'status' => TradePromoAward::STATUS_ACCRUED,
                'notes' => 'Tier #'.$tier->sort_order,
            ]);
        }
    }

    private function bestTier(TradePromoProgram $program, float $qty, float $value): ?TradePromoTier
    {
        $tiers = $program->tiers
            ->sortByDesc(fn (TradePromoTier $tier): float => (float) ($tier->min_qty ?? $tier->min_value ?? 0))
            ->values();

        foreach ($tiers as $tier) {
            $qtyOk = $tier->min_qty === null || $qty >= (float) $tier->min_qty;
            $valueOk = $tier->min_value === null || $value >= (float) $tier->min_value;
            if ($qtyOk && $valueOk) {
                return $tier;
            }
        }

        return null;
    }
}
