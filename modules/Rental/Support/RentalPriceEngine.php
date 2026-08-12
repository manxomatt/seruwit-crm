<?php

namespace Modules\Rental\Support;

use Carbon\Carbon;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Models\RentalRateTier;

/**
 * Single source of truth for rental pricing with tier support.
 *
 * Pipeline:
 *   1) Resolve base RentalRate via existing RentalRateResolver
 *   2) Apply best Period Volume tier (e.g. 4+ days = 175k/day)
 *   3) Apply best Loyalty tier (e.g. 3rd completed rental = -10%)
 *   4) Build transparent per-period breakdown snapshot
 *
 * All price entry points (mobile quote, staff create wizard, extensions, etc.)
 * MUST go through this class so pricing stays consistent.
 */
final class RentalPriceEngine
{
    public function __construct(
        private readonly RentalRateResolver $rateResolver,
    ) {}

    /**
     * Primary calculation entrypoint.
     *
     * @return array{
     *   base_rate: RentalRate,
     *   base_rate_per_period: float,
     *   period_tier_applied: ?RentalRateTier,
     *   loyalty_tier_applied: ?RentalRateTier,
     *   effective_rate_per_period: float,
     *   total_periods: int,
     *   period_breakdown: list<array{period:int,from_date:string,to_date:string,rate_applied:float,tier_label:?string}>,
     *   base_amount: float,
     *   plain_base_amount: float,
     *   discount_amount: float,
     *   loyalty_completed_rental_count: int,
     * }
     */
    public function calculate(
        Vehicle $vehicle,
        string $startDate,
        string $endDate,
        string $periodType,
        ?Partner $partner = null,
    ): array {
        $baseRate = $this->rateResolver->suggest($vehicle, $startDate, $endDate, $periodType);

        if ($baseRate === null) {
            throw new \RuntimeException('No matching rate found for the vehicle and dates.');
        }

        $totalPeriods = Rental::computePeriods($startDate, $endDate, $periodType);
        $baseRateValue = (float) $baseRate->rate_per_period;

        // ── Stage 1: Period Volume tier ──────────────────────────────────
        $periodTier = $this->findBestMatchingTier(
            $baseRate,
            RentalRateTier::TIER_PERIOD_VOLUME,
            $totalPeriods,
        );
        $afterPeriodRate = $periodTier
            ? $periodTier->apply($baseRateValue)
            : $baseRateValue;

        // ── Stage 2: Loyalty tier (history-based) ────────────────────────
        $loyaltyCount = $partner
            ? $this->countPartnerCompletedRentals($partner, $vehicle)
            : 0;
        $rentalNumber = $loyaltyCount + 1;
        $loyaltyTier = $this->findBestMatchingTier(
            $baseRate,
            RentalRateTier::TIER_LOYALTY_COUNT,
            $rentalNumber,
        );
        $finalRate = $loyaltyTier
            ? $loyaltyTier->apply($afterPeriodRate)
            : $afterPeriodRate;

        // ── Stage 3: Breakdown per period for transparency ───────────────
        $breakdown = $this->buildPeriodBreakdown(
            $startDate,
            $endDate,
            $periodType,
            $totalPeriods,
            $baseRateValue,
            $periodTier,
            $loyaltyTier,
        );

        $plainAmount = round($baseRateValue * $totalPeriods, 2);
        $tieredAmount = round(array_reduce(
            $breakdown,
            static fn (float $sum, array $row): float => $sum + (float) $row['rate_applied'],
            0.0,
        ), 2);
        $savedAmount = round($plainAmount - $tieredAmount, 2);

        return [
            'base_rate' => $baseRate,
            'base_rate_per_period' => $baseRateValue,
            'period_tier_applied' => $periodTier,
            'loyalty_tier_applied' => $loyaltyTier,
            'effective_rate_per_period' => round($finalRate, 2),
            'total_periods' => $totalPeriods,
            'period_breakdown' => $breakdown,
            'base_amount' => $tieredAmount,
            'plain_base_amount' => $plainAmount,
            'discount_amount' => max(0.0, $savedAmount),
            'loyalty_completed_rental_count' => $loyaltyCount,
        ];
    }

    /**
     * Pick the best active tier that matches a threshold value.
     *
     * Matching rules:
     *   - min_threshold <= value <= max_threshold (or unlimited if max null)
     *   - Highest priority wins on ties
     *   - Most specific (smallest range) wins on remaining ties
     *   - Newest id as final tie-breaker
     */
    public function findBestMatchingTier(
        RentalRate $baseRate,
        string $tierType,
        int $thresholdValue,
    ): ?RentalRateTier {
        $tiers = $baseRate->tiers
            ->whereStrict('tier_type', $tierType)
            ->filter(static fn (RentalRateTier $tier): bool => $tier->matches($thresholdValue));

        if ($tiers->isEmpty()) {
            return null;
        }

        $sorted = $tiers->sort(static function (RentalRateTier $a, RentalRateTier $b): int {
            $rangeSpan = static function (RentalRateTier $tier): int {
                if ($tier->max_threshold === null) {
                    return PHP_INT_MAX;
                }

                return (int) $tier->max_threshold - (int) $tier->min_threshold;
            };

            return [$b->priority, $rangeSpan($a), $b->id]
                <=> [$a->priority, $rangeSpan($b), $a->id];
        });

        /** @var RentalRateTier|null $best */
        $best = $sorted->first();

        return $best;
    }

    /**
     * Count completed rentals of a partner for loyalty eligibility.
     *
     * Only COMPLETED / INVOICED rentals count (no pending/cancelled ones)
     * so customers cannot "game" the system by creating empty bookings.
     * Scoped to same vehicle class so a luxury customer doesn't get
     * economy-loyalty discounts (and vice-versa).
     */
    public function countPartnerCompletedRentals(Partner $partner, ?Vehicle $vehicle = null): int
    {
        return Rental::query()
            ->where('partner_id', $partner->id)
            ->whereIn('status', [
                Rental::STATUS_COMPLETED,
            ])
            ->when(
                $vehicle !== null && filled($vehicle->rental_class ?? null),
                static function ($query) use ($vehicle): void {
                    $query->whereHas(
                        'vehicle',
                        static fn ($vq): mixed => $vq->where(
                            'rental_class',
                            (string) $vehicle->rental_class,
                        ),
                    );
                },
            )
            ->count();
    }

    /**
     * Build period-level breakdown for invoice transparency (so customer
     * can see exactly which tier applied to which day/week/month).
     *
     * @return list<array{period:int,from_date:string,to_date:string,rate_applied:float,tier_label:?string}>
     */
    private function buildPeriodBreakdown(
        string $startDate,
        string $endDate,
        string $periodType,
        int $totalPeriods,
        float $baseRateValue,
        ?RentalRateTier $periodTier,
        ?RentalRateTier $loyaltyTier,
    ): array {
        $rows = [];
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->startOfDay();

        // Determine cumulative rate after stacking modifiers
        $afterPeriodRate = $periodTier
            ? $periodTier->apply($baseRateValue)
            : $baseRateValue;
        $finalRate = $loyaltyTier
            ? $loyaltyTier->apply($afterPeriodRate)
            : $afterPeriodRate;

        $tierLabel = null;
        $labels = [];
        if ($periodTier) {
            $labels[] = $periodTier->summaryLabel();
        }
        if ($loyaltyTier) {
            $labels[] = $loyaltyTier->summaryLabel();
        }
        if ($labels !== []) {
            $tierLabel = implode(' + ', $labels);
        }

        for ($p = 1; $p <= $totalPeriods; $p++) {
            [$pFrom, $pTo] = $this->periodRange($start, $end, $periodType, $p);
            $rows[] = [
                'period' => $p,
                'from_date' => $pFrom,
                'to_date' => $pTo,
                'rate_applied' => round($finalRate, 2),
                'tier_label' => $tierLabel,
            ];
        }

        return $rows;
    }

    /**
     * Compute inclusive [from, to] date strings for a specific period index.
     *
     * @return array{0:string,1:string}
     */
    private function periodRange(
        Carbon $bookingStart,
        Carbon $bookingEnd,
        string $periodType,
        int $periodNumber,
    ): array {
        $p0 = $periodNumber - 1;
        $from = match ($periodType) {
            'daily' => $bookingStart->copy()->addDays($p0),
            'weekly' => $bookingStart->copy()->addWeeks($p0),
            'monthly' => $bookingStart->copy()->addMonths($p0),
            default => $bookingStart->copy(),
        };

        $to = match ($periodType) {
            'daily' => $from->copy(),
            'weekly' => $from->copy()->addDays(6),
            'monthly' => $from->copy()->addMonth()->subDay(),
            default => $from->copy(),
        };

        if ($to->gt($bookingEnd)) {
            $to = $bookingEnd->copy();
        }

        return [$from->toDateString(), $to->toDateString()];
    }
}
