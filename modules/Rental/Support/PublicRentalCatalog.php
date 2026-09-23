<?php

namespace Modules\Rental\Support;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Lang;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;

/**
 * Public storefront grouping and labels so customers see a model, not an internal unit code.
 */
class PublicRentalCatalog
{
    public static function displayName(string $name): string
    {
        $trimmed = trim($name);
        $stripped = preg_replace('/\s+#\d+\s*$/u', '', $trimmed);

        return is_string($stripped) && $stripped !== '' ? $stripped : $trimmed;
    }

    public static function fuelLabel(?string $fuelType): ?string
    {
        if ($fuelType === null || $fuelType === '') {
            return null;
        }

        $key = 'fleet.vehicles.fuel_types.'.$fuelType;

        return Lang::has($key) ? (string) __($key) : ucfirst($fuelType);
    }

    public static function pickAvailable(Vehicle $requested, string $start, string $end): Vehicle
    {
        if (Rental::vehicleAvailabilityReasons($requested, $start, $end) === []) {
            return $requested;
        }

        $display = self::displayName((string) $requested->name);

        $alternate = Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->where('id', '!=', $requested->id)
            ->orderBy('id')
            ->get()
            ->first(function (Vehicle $vehicle) use ($display, $start, $end): bool {
                return self::displayName((string) $vehicle->name) === $display
                    && Rental::vehicleAvailabilityReasons($vehicle, $start, $end) === [];
            });

        return $alternate ?? $requested;
    }

    public static function similarAvailableCount(Vehicle $vehicle, string $start, string $end, string $periodType, RentalRateResolver $rates): int
    {
        $display = self::displayName((string) $vehicle->name);

        return Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->orderBy('id')
            ->get()
            ->filter(function (Vehicle $candidate) use ($display, $start, $end, $periodType, $rates): bool {
                if (self::displayName((string) $candidate->name) !== $display) {
                    return false;
                }

                if (Rental::vehicleAvailabilityReasons($candidate, $start, $end) !== []) {
                    return false;
                }

                return $rates->suggest($candidate, $start, $end, $periodType) !== null;
            })
            ->count();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $cards
     * @return list<array<string, mixed>>
     */
    public static function groupCards(Collection $cards): array
    {
        return $cards
            ->groupBy(fn (array $card): string => mb_strtolower(self::displayName((string) $card['name'])))
            ->map(function (Collection $group): array {
                /** @var Collection<int, array<string, mixed>> $sorted */
                $sorted = $group->sortBy([
                    ['from_price', 'asc'],
                    ['model_year', 'desc'],
                ])->values();

                $withPhoto = $sorted->first(fn (array $card): bool => filled($card['photo_url'] ?? null));
                /** @var array<string, mixed> $lead */
                $lead = $withPhoto ?? $sorted->first();
                $from = $sorted->pluck('from_price')->filter(fn (mixed $price): bool => $price !== null)->min();
                $periods = max(1, (int) ($lead['total_periods'] ?? 1));

                return [
                    'id' => $lead['id'],
                    'name' => self::displayName((string) $lead['name']),
                    'available_count' => $group->count(),
                    'rental_class' => $lead['rental_class'],
                    'rental_class_label' => $lead['rental_class_label'],
                    'capacity_seats' => $lead['capacity_seats'],
                    'fuel_label' => $lead['fuel_label'] ?? null,
                    'model_year' => $sorted->pluck('model_year')->filter()->max(),
                    'photo_url' => $lead['photo_url'] ?? null,
                    'from_price' => $from !== null ? (float) $from : null,
                    'total_periods' => $periods,
                    'total_amount' => $from !== null ? round((float) $from * $periods, 2) : null,
                    'deposit_amount' => $sorted->pluck('deposit_amount')->filter(fn (mixed $amount): bool => $amount !== null)->min(),
                ];
            })
            ->sortBy('name')
            ->values()
            ->all();
    }
}
