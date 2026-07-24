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
 * Syncs realized qty/value from Delivery Orders (when Orders is available)
 * and accrues awards from tiers / rebate rules.
 */
class PromoRealizationService
{
    public function syncProgram(TradePromoProgram $program): Collection
    {
        $program->loadMissing(['partners', 'products', 'tiers.freeProduct', 'rebateRule']);

        $partnerIds = $program->partners->isEmpty()
            ? Partner::query()->where('customer_rank', '>', 0)->pluck('id')
            : $program->partners->pluck('id');

        $productIds = $program->products->isEmpty()
            ? null
            : $program->products->pluck('id')->all();

        $totals = $this->aggregateFromDeliveryOrders($program, $partnerIds->all(), $productIds);

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

        $result = [];
        foreach ($query->get() as $row) {
            $result[(int) $row->partner_id] = [
                'qty' => (float) $row->qty,
                'value' => (float) $row->value,
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
