<?php

namespace Modules\Rental\Support;

use Carbon\Carbon;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\RentalRate;

/**
 * Picks the best active tariff for a vehicle + booking window.
 *
 * Specificity: exact vehicle → rental_class → legacy vehicle_type → general.
 * Then higher priority wins; ties break on newer id.
 */
class RentalRateResolver
{
    public function suggest(
        ?Vehicle $vehicle,
        string $startDate,
        string $endDate,
        string $periodType,
    ): ?RentalRate {
        $start = Carbon::parse($startDate)->toDateString();
        $candidates = RentalRate::query()
            ->where('is_active', true)
            ->where('period_type', $periodType)
            ->where(function ($query) use ($start): void {
                $query->whereNull('valid_from')->orWhereDate('valid_from', '<=', $start);
            })
            ->where(function ($query) use ($start): void {
                $query->whereNull('valid_to')->orWhereDate('valid_to', '>=', $start);
            })
            ->orderByDesc('priority')
            ->orderByDesc('id')
            ->get();

        if ($candidates->isEmpty()) {
            return null;
        }

        $ranked = $candidates
            ->map(function (RentalRate $rate) use ($vehicle): array {
                return ['rate' => $rate, 'score' => $this->specificityScore($rate, $vehicle)];
            })
            ->filter(fn (array $row): bool => $row['score'] >= 0)
            ->sort(function (array $a, array $b): int {
                return [$b['score'], $b['rate']->priority, $b['rate']->id]
                    <=> [$a['score'], $a['rate']->priority, $a['rate']->id];
            })
            ->values();

        return $ranked->first()['rate'] ?? null;
    }

    private function specificityScore(RentalRate $rate, ?Vehicle $vehicle): int
    {
        if ($rate->vehicle_id) {
            if (! $vehicle || (int) $rate->vehicle_id !== (int) $vehicle->id) {
                return -1;
            }

            return 300;
        }

        if (filled($rate->rental_class)) {
            if (! $vehicle || $vehicle->rental_class !== $rate->rental_class) {
                return -1;
            }

            return 200;
        }

        if (filled($rate->vehicle_type)) {
            if (! $vehicle) {
                return -1;
            }

            $haystack = strtolower(trim((string) $rate->vehicle_type));
            $type = strtolower(trim((string) $vehicle->type));
            $class = strtolower(trim((string) ($vehicle->rental_class ?? '')));

            if ($haystack !== $type && $haystack !== $class) {
                return -1;
            }

            return 100;
        }

        return 10;
    }
}
