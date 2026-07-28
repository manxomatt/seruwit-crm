<?php

namespace Modules\TradePromotions\Support;

use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Modules\TradePromotions\Models\PromoApplication;
use Modules\TradePromotions\Models\TradePromoProgram;
use Modules\TradePromotions\Models\TradePromoTier;

class PromotionPricing
{
    /**
     * @param  array{
     *     channel: string,
     *     warehouse_id: int,
     *     partner_id?: int|null,
     *     lines: list<array{product_id: int, quantity: float, unit_price: float}>,
     *     at?: CarbonInterface|null
     * }  $context
     * @return array{
     *     lines: list<array{product_id: int, quantity: float, unit_price: float, line_discount: float, line_total: float, program_id: int|null, meta: array<string, mixed>|null}>,
     *     discount_total: float
     * }
     */
    public function quote(array $context): array
    {
        if (! PromoProgramAuthorizer::promotionsAvailable()) {
            return $this->passthrough($context['lines']);
        }

        $at = $context['at'] ?? now();
        $warehouseId = (int) $context['warehouse_id'];
        $channel = $context['channel'];

        $programs = TradePromoProgram::query()
            ->with(['products:id', 'warehouses:id', 'tiers'])
            ->where('mode', TradePromoProgram::MODE_CHECKOUT)
            ->whereIn('type', [
                TradePromoProgram::TYPE_CHECKOUT_DISCOUNT,
                TradePromoProgram::TYPE_CHECKOUT_BOGO,
                TradePromoProgram::TYPE_CHECKOUT_BUNDLE,
            ])
            ->where('status', TradePromoProgram::STATUS_ACTIVE)
            ->where('starts_at', '<=', $at)
            ->where('ends_at', '>=', $at)
            ->orderByDesc('id')
            ->get()
            ->filter(function (TradePromoProgram $program) use ($channel, $warehouseId): bool {
                $channels = $program->channels ?? [
                    TradePromoProgram::CHANNEL_POS,
                    TradePromoProgram::CHANNEL_SALES,
                ];

                if (! in_array($channel, $channels, true)) {
                    return false;
                }

                if ($program->scope === TradePromoProgram::SCOPE_GLOBAL) {
                    return true;
                }

                return $program->warehouses->contains('id', $warehouseId);
            })
            ->values();

        $cartQtyByProduct = collect($context['lines'])
            ->groupBy(fn (array $line): int => (int) $line['product_id'])
            ->map(fn (Collection $rows): float => (float) $rows->sum('quantity'));

        $quoted = [];
        $discountTotal = 0.0;

        foreach ($context['lines'] as $line) {
            $productId = (int) $line['product_id'];
            $qty = (float) $line['quantity'];
            $unitPrice = (float) $line['unit_price'];
            $gross = round($qty * $unitPrice, 2);

            $global = $this->bestProgramForProduct($programs, $productId, true, $qty, $cartQtyByProduct);
            $chosen = $global ?? $this->bestProgramForProduct($programs, $productId, false, $qty, $cartQtyByProduct);

            $lineDiscount = 0.0;
            $meta = null;
            $programId = null;

            if ($chosen !== null) {
                [$lineDiscount, $meta] = $this->discountForProgram(
                    $chosen['program'],
                    $chosen['tier'],
                    $qty,
                    $gross,
                    $unitPrice,
                );
                $programId = $chosen['program']->id;
                $discountTotal += $lineDiscount;
            }

            $quoted[] = [
                'product_id' => $productId,
                'quantity' => $qty,
                'unit_price' => $unitPrice,
                'line_discount' => $lineDiscount,
                'line_total' => round(max(0, $gross - $lineDiscount), 2),
                'program_id' => $programId,
                'meta' => $meta,
            ];
        }

        return [
            'lines' => $quoted,
            'discount_total' => round($discountTotal, 2),
        ];
    }

    /**
     * @param  list<array{product_id: int, line_discount: float, program_id: int|null, meta: array<string, mixed>|null}>  $lines
     */
    public function recordApplications(string $sourceType, int $sourceId, array $lines): void
    {
        if (! PromoProgramAuthorizer::promotionsAvailable()) {
            return;
        }

        foreach ($lines as $line) {
            if (($line['program_id'] ?? null) === null || (float) ($line['line_discount'] ?? 0) <= 0) {
                continue;
            }

            PromoApplication::query()->create([
                'trade_promo_program_id' => $line['program_id'],
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'product_id' => $line['product_id'],
                'discount_amount' => $line['line_discount'],
                'meta' => $line['meta'] ?? null,
            ]);
        }
    }

    /**
     * @param  Collection<int, TradePromoProgram>  $programs
     * @param  Collection<int, float>  $cartQtyByProduct
     * @return array{program: TradePromoProgram, tier: TradePromoTier}|null
     */
    protected function bestProgramForProduct(
        Collection $programs,
        int $productId,
        bool $globalOnly,
        float $qty,
        Collection $cartQtyByProduct,
    ): ?array {
        foreach ($programs as $program) {
            $isGlobal = $program->scope === TradePromoProgram::SCOPE_GLOBAL;

            if ($globalOnly !== $isGlobal) {
                continue;
            }

            if ($program->products->isNotEmpty() && ! $program->products->contains('id', $productId)) {
                continue;
            }

            $tier = $program->tiers->first();

            if ($tier === null) {
                continue;
            }

            if ($program->type === TradePromoProgram::TYPE_CHECKOUT_BUNDLE) {
                if (! $this->bundleIsSatisfied($program, $tier, $cartQtyByProduct)) {
                    continue;
                }

                if ($tier->discount_percent === null && $tier->discount_amount === null) {
                    continue;
                }

                return ['program' => $program, 'tier' => $tier];
            }

            if ($program->type === TradePromoProgram::TYPE_CHECKOUT_BOGO) {
                $buyQty = max(1.0, (float) ($tier->min_qty ?? 1));
                $freeQty = max(0.0, (float) ($tier->free_qty ?? 1));

                if ($freeQty <= 0 || $qty + 0.0001 < $buyQty) {
                    continue;
                }

                return ['program' => $program, 'tier' => $tier];
            }

            // checkout_discount
            if ($tier->min_qty !== null && $qty + 0.0001 < (float) $tier->min_qty) {
                continue;
            }

            if ($tier->discount_percent === null && $tier->discount_amount === null) {
                continue;
            }

            return ['program' => $program, 'tier' => $tier];
        }

        return null;
    }

    /**
     * @param  Collection<int, float>  $cartQtyByProduct
     */
    protected function bundleIsSatisfied(
        TradePromoProgram $program,
        TradePromoTier $tier,
        Collection $cartQtyByProduct,
    ): bool {
        $requiredIds = $program->products->pluck('id')->map(fn ($id): int => (int) $id)->all();

        if ($requiredIds === []) {
            return false;
        }

        $minEach = max(1.0, (float) ($tier->min_qty ?? 1));

        foreach ($requiredIds as $requiredId) {
            if ((float) ($cartQtyByProduct->get($requiredId) ?? 0) + 0.0001 < $minEach) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return array{0: float, 1: array<string, mixed>}
     */
    protected function discountForProgram(
        TradePromoProgram $program,
        TradePromoTier $tier,
        float $qty,
        float $gross,
        float $unitPrice,
    ): array {
        if ($program->type === TradePromoProgram::TYPE_CHECKOUT_BOGO) {
            $buyQty = max(1.0, (float) ($tier->min_qty ?? 1));
            $freePerSet = max(0.0, (float) ($tier->free_qty ?? 1));
            $sets = (int) floor($qty / $buyQty);
            $freeUnits = min($qty, $sets * $freePerSet);
            $amount = round($freeUnits * $unitPrice, 2);

            return [$amount, [
                'kind' => 'bogo',
                'buy_qty' => $buyQty,
                'free_qty' => $freePerSet,
                'free_units' => $freeUnits,
            ]];
        }

        return $this->discountForTier($tier, $qty, $gross);
    }

    /**
     * @return array{0: float, 1: array<string, mixed>}
     */
    protected function discountForTier(TradePromoTier $tier, float $qty, float $gross): array
    {
        if ($tier->discount_percent !== null) {
            $amount = round($gross * ((float) $tier->discount_percent) / 100, 2);

            return [$amount, [
                'kind' => 'percent',
                'percent' => (float) $tier->discount_percent,
            ]];
        }

        $perUnit = (float) $tier->discount_amount;
        $amount = round($perUnit * $qty, 2);

        return [$amount, [
            'kind' => 'amount',
            'amount_per_unit' => $perUnit,
        ]];
    }

    /**
     * @param  list<array{product_id: int, quantity: float, unit_price: float}>  $lines
     * @return array{lines: list<array<string, mixed>>, discount_total: float}
     */
    protected function passthrough(array $lines): array
    {
        $quoted = [];

        foreach ($lines as $line) {
            $gross = round((float) $line['quantity'] * (float) $line['unit_price'], 2);
            $quoted[] = [
                'product_id' => (int) $line['product_id'],
                'quantity' => (float) $line['quantity'],
                'unit_price' => (float) $line['unit_price'],
                'line_discount' => 0.0,
                'line_total' => $gross,
                'program_id' => null,
                'meta' => null,
            ];
        }

        return ['lines' => $quoted, 'discount_total' => 0.0];
    }
}
