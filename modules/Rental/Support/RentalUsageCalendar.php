<?php

namespace Modules\Rental\Support;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;

class RentalUsageCalendar
{
    public const VIEW_TODAY = 'today';

    public const VIEW_WEEK = 'week';

    public const VIEW_MONTH = 'month';

    public const VIEW_QUARTER = 'quarter';

    public const VIEW_YEAR = 'year';

    /**
     * @return list<string>
     */
    public static function views(): array
    {
        return [
            self::VIEW_TODAY,
            self::VIEW_WEEK,
            self::VIEW_MONTH,
            self::VIEW_QUARTER,
            self::VIEW_YEAR,
        ];
    }

    /**
     * @return array{
     *     view: string,
     *     date: string,
     *     from: string,
     *     to: string,
     *     dates: list<string>,
     *     counts: array{total: int, free: int, booked: int, in_use: int, unavailable: int},
     *     utilisation_percent: float,
     *     utilisation_by_date: array<string, array{free: int, booked: int, in_use: int, unavailable: int, utilisation_percent: float}>,
     *     vehicles: list<array{
     *         id: int,
     *         name: string,
     *         plate_number: string,
     *         type: string|null,
     *         status: string,
     *         photo_url: string|null,
     *         availability: string,
     *         cells: array<string, array{status: string, bookings: list<array{id: int, code: string, status: string, start_date: string, end_date: string, partner: string|null}>}>
     *     }>
     * }
     */
    public function build(string $view, Carbon|string $anchor): array
    {
        $view = in_array($view, self::views(), true) ? $view : self::VIEW_WEEK;
        $date = Carbon::parse($anchor)->startOfDay();
        [$from, $to] = $this->rangeFor($view, $date);

        $dates = collect(CarbonPeriod::create($from, $to))
            ->map(fn (Carbon $day): string => $day->toDateString())
            ->values()
            ->all();

        $vehicles = Vehicle::query()
            ->orderBy('name')
            ->get(['id', 'name', 'plate_number', 'type', 'status', 'photo_url']);

        $rentals = Rental::query()
            ->with('partner:id,name')
            ->whereIn('status', [
                Rental::STATUS_DRAFT,
                Rental::STATUS_PENDING,
                Rental::STATUS_PENDING_RESERVED,
                Rental::STATUS_CONFIRMED,
                Rental::STATUS_ACTIVE,
            ])
            ->where('start_date', '<=', $to->toDateString())
            ->where('end_date', '>=', $from->toDateString())
            ->orderBy('start_date')
            ->get()
            ->groupBy('vehicle_id');

        $includeVehicleCells = $view !== self::VIEW_YEAR;

        $vehicleRows = [];
        $free = 0;
        $booked = 0;
        $inUse = 0;
        $unavailable = 0;

        $dayTallies = [];
        foreach ($dates as $day) {
            $dayTallies[$day] = ['free' => 0, 'booked' => 0, 'in_use' => 0, 'unavailable' => 0];
        }

        $occupiedVehicleDays = 0;
        $availableVehicleDays = 0;

        foreach ($vehicles as $vehicle) {
            /** @var Collection<int, Rental> $bookings */
            $bookings = $rentals->get($vehicle->id, collect());
            $periodAvailability = $this->resolvePeriodAvailability($vehicle, $bookings);

            match ($periodAvailability) {
                'unavailable' => $unavailable++,
                'in_use' => $inUse++,
                'booked' => $booked++,
                default => $free++,
            };

            $cells = [];

            foreach ($dates as $day) {
                $dayBookings = $bookings
                    ->filter(fn (Rental $rental): bool => $this->coversDay($rental, $day))
                    ->values();

                $dayStatus = $this->resolveDayStatus($vehicle, $dayBookings);
                $dayTallies[$day][$dayStatus]++;

                if ($vehicle->status === Vehicle::STATUS_ACTIVE) {
                    $availableVehicleDays++;
                    if (in_array($dayStatus, ['booked', 'in_use'], true)) {
                        $occupiedVehicleDays++;
                    }
                }

                if ($includeVehicleCells) {
                    $cells[$day] = [
                        'status' => $dayStatus,
                        'bookings' => $dayBookings
                            ->filter(fn (Rental $rental): bool => in_array($rental->status, [
                                Rental::STATUS_PENDING_RESERVED,
                                Rental::STATUS_CONFIRMED,
                                Rental::STATUS_ACTIVE,
                            ], true))
                            ->map(fn (Rental $rental): array => [
                                'id' => $rental->id,
                                'code' => $rental->code,
                                'status' => $rental->status,
                                'start_date' => $rental->start_date->toDateString(),
                                'end_date' => $rental->end_date->toDateString(),
                                'partner' => $rental->partner?->name,
                            ])
                            ->values()
                            ->all(),
                    ];
                }
            }

            if ($includeVehicleCells) {
                $vehicleRows[] = [
                    'id' => $vehicle->id,
                    'name' => $vehicle->name,
                    'plate_number' => $vehicle->plate_number,
                    'type' => $vehicle->type,
                    'status' => $vehicle->status,
                    'photo_url' => $vehicle->photo_url,
                    'availability' => $periodAvailability,
                    'cells' => $cells,
                ];
            }
        }

        $utilisationByDate = [];
        foreach ($dayTallies as $day => $tally) {
            $activeFleet = $tally['free'] + $tally['booked'] + $tally['in_use'];
            $occupied = $tally['booked'] + $tally['in_use'];
            $utilisationByDate[$day] = [
                ...$tally,
                'utilisation_percent' => $activeFleet > 0
                    ? round(($occupied / $activeFleet) * 100, 1)
                    : 0.0,
            ];
        }

        return [
            'view' => $view,
            'date' => $date->toDateString(),
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'dates' => $dates,
            'counts' => [
                'total' => $vehicles->count(),
                'free' => $free,
                'booked' => $booked,
                'in_use' => $inUse,
                'unavailable' => $unavailable,
            ],
            'utilisation_percent' => $availableVehicleDays > 0
                ? round(($occupiedVehicleDays / $availableVehicleDays) * 100, 1)
                : 0.0,
            'utilisation_by_date' => $utilisationByDate,
            'vehicles' => $vehicleRows,
        ];
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    public function rangeFor(string $view, Carbon $anchor): array
    {
        return match ($view) {
            self::VIEW_TODAY => [$anchor->copy()->startOfDay(), $anchor->copy()->startOfDay()],
            self::VIEW_WEEK => [
                $anchor->copy()->startOfWeek(Carbon::MONDAY)->startOfDay(),
                $anchor->copy()->endOfWeek(Carbon::SUNDAY)->startOfDay(),
            ],
            self::VIEW_MONTH => [
                $anchor->copy()->startOfMonth()->startOfDay(),
                $anchor->copy()->endOfMonth()->startOfDay(),
            ],
            self::VIEW_QUARTER => [
                $anchor->copy()->startOfMonth()->startOfDay(),
                $anchor->copy()->startOfMonth()->addMonths(3)->subDay()->startOfDay(),
            ],
            self::VIEW_YEAR => [
                $anchor->copy()->startOfYear()->startOfDay(),
                $anchor->copy()->endOfYear()->startOfDay(),
            ],
            default => [
                $anchor->copy()->startOfWeek(Carbon::MONDAY)->startOfDay(),
                $anchor->copy()->endOfWeek(Carbon::SUNDAY)->startOfDay(),
            ],
        };
    }

    private function coversDay(Rental $rental, string $day): bool
    {
        return $rental->start_date->toDateString() <= $day
            && $rental->end_date->toDateString() >= $day;
    }

    /**
     * @param  Collection<int, Rental>  $dayBookings
     */
    private function resolveDayStatus(Vehicle $vehicle, Collection $dayBookings): string
    {
        if ($vehicle->status !== Vehicle::STATUS_ACTIVE) {
            return 'unavailable';
        }

        if ($dayBookings->contains(fn (Rental $rental): bool => $rental->status === Rental::STATUS_ACTIVE)) {
            return 'in_use';
        }

        if ($dayBookings->contains(fn (Rental $rental): bool => in_array($rental->status, [
            Rental::STATUS_CONFIRMED,
            Rental::STATUS_PENDING_RESERVED,
        ], true))) {
            return 'booked';
        }

        return 'free';
    }

    /**
     * @param  Collection<int, Rental>  $bookings
     */
    private function resolvePeriodAvailability(Vehicle $vehicle, Collection $bookings): string
    {
        if ($vehicle->status !== Vehicle::STATUS_ACTIVE) {
            return 'unavailable';
        }

        if ($bookings->contains(fn (Rental $rental): bool => $rental->status === Rental::STATUS_ACTIVE)) {
            return 'in_use';
        }

        if ($bookings->contains(fn (Rental $rental): bool => in_array($rental->status, [
            Rental::STATUS_CONFIRMED,
            Rental::STATUS_PENDING_RESERVED,
        ], true))) {
            return 'booked';
        }

        return 'free';
    }
}
