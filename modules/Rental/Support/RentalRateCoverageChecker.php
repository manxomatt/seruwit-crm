<?php

namespace Modules\Rental\Support;

use Modules\Rental\Models\RentalRate;

class RentalRateCoverageChecker
{
    /**
     * Get active coverage status for rental classes and vehicle types.
     *
     * @return array{
     *     has_global_rate: bool,
     *     covered_rental_classes: list<string>,
     *     covered_vehicle_types: list<string>,
     *     sample_rates: array<string, array{name: string, rate_per_period: float, period_type: string}>
     * }
     */
    public static function getCoverageSummary(): array
    {
        $activeRates = RentalRate::query()
            ->where('is_active', true)
            ->where(function ($q): void {
                $today = now()->toDateString();
                $q->whereNull('valid_from')->orWhereDate('valid_from', '<=', $today);
            })
            ->where(function ($q): void {
                $today = now()->toDateString();
                $q->whereNull('valid_to')->orWhereDate('valid_to', '>=', $today);
            })
            ->orderByDesc('priority')
            ->orderByDesc('id')
            ->get();

        $hasGlobalRate = $activeRates->contains(function (RentalRate $rate): bool {
            return empty($rate->vehicle_id) && empty($rate->rental_class) && empty($rate->vehicle_type);
        });

        $coveredClasses = [];
        $coveredTypes = [];
        $sampleRates = [];

        foreach ($activeRates as $rate) {
            if (filled($rate->rental_class)) {
                $cls = strtolower(trim((string) $rate->rental_class));
                if (! in_array($cls, $coveredClasses, true)) {
                    $coveredClasses[] = $cls;
                    $sampleRates['class:'.$cls] = [
                        'name' => $rate->name,
                        'rate_per_period' => (float) $rate->rate_per_period,
                        'period_type' => $rate->period_type,
                    ];
                }
            }

            if (filled($rate->vehicle_type)) {
                $type = strtolower(trim((string) $rate->vehicle_type));
                if (! in_array($type, $coveredTypes, true)) {
                    $coveredTypes[] = $type;
                    if (! isset($sampleRates['type:'.$type])) {
                        $sampleRates['type:'.$type] = [
                            'name' => $rate->name,
                            'rate_per_period' => (float) $rate->rate_per_period,
                            'period_type' => $rate->period_type,
                        ];
                    }
                }
            }
        }

        if ($hasGlobalRate) {
            $globalRate = $activeRates->first(function (RentalRate $rate): bool {
                return empty($rate->vehicle_id) && empty($rate->rental_class) && empty($rate->vehicle_type);
            });

            if ($globalRate) {
                $sampleRates['global'] = [
                    'name' => $globalRate->name,
                    'rate_per_period' => (float) $globalRate->rate_per_period,
                    'period_type' => $globalRate->period_type,
                ];
            }
        }

        return [
            'has_global_rate' => $hasGlobalRate,
            'covered_rental_classes' => $coveredClasses,
            'covered_vehicle_types' => $coveredTypes,
            'sample_rates' => $sampleRates,
        ];
    }

    /**
     * Determine if a vehicle combination has an active rate covering it.
     */
    public static function isCovered(?string $rentalClass, ?string $vehicleType): bool
    {
        $summary = self::getCoverageSummary();

        if ($summary['has_global_rate']) {
            return true;
        }

        if (filled($rentalClass) && in_array(strtolower(trim((string) $rentalClass)), $summary['covered_rental_classes'], true)) {
            return true;
        }

        if (filled($vehicleType) && in_array(strtolower(trim((string) $vehicleType)), $summary['covered_vehicle_types'], true)) {
            return true;
        }

        return false;
    }
}
