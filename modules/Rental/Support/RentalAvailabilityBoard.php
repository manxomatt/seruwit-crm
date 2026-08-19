<?php

namespace Modules\Rental\Support;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;

class RentalAvailabilityBoard
{
    public function __construct(
        private readonly RentalRateResolver $rates,
    ) {}

    /**
     * Build a vehicle availability board for [$from, $to].
     *
     * Availability is driven by overlapping rental status:
     * - draft only (or none) → free (Tersedia)
     * - confirmed → booked (Dibooking)
     * - active → in_use (Digunakan)
     *
     * @return array{
     *     from: string,
     *     to: string,
     *     counts: array{total: int, free: int, booked: int, in_use: int},
     *     vehicles: list<array{
     *         id: int,
     *         name: string,
     *         plate_number: string,
     *         type: string|null,
     *         status: string,
     *         photo_url: string|null,
     *         availability: string,
     *         has_rate: bool,
     *         bookings: list<array{id: int, code: string, status: string, start_date: string, end_date: string, partner: string|null}>
     *     }>
     * }
     */
    public function build(string $from, string $to): array
    {
        $fromDate = Carbon::parse($from)->toDateString();
        $toDate = Carbon::parse($to)->toDateString();

        $vehicles = Vehicle::query()
            ->orderBy('name')
            ->get(['id', 'name', 'plate_number', 'type', 'status', 'photo_url', 'rental_class']);

        $rentals = Rental::query()
            ->with('partner:id,name')
            ->whereIn('status', [
                Rental::STATUS_DRAFT,
                Rental::STATUS_PENDING,
                Rental::STATUS_PENDING_RESERVED,
                Rental::STATUS_CONFIRMED,
                Rental::STATUS_ACTIVE,
            ])
            ->where('start_date', '<=', $toDate)
            ->where('end_date', '>=', $fromDate)
            ->orderBy('start_date')
            ->get()
            ->groupBy('vehicle_id');

        $rows = [];
        $free = 0;
        $booked = 0;
        $inUse = 0;

        foreach ($vehicles as $vehicle) {
            /** @var Collection<int, Rental> $bookings */
            $bookings = $rentals->get($vehicle->id, collect());

            $bookingRows = $bookings->map(fn (Rental $rental): array => [
                'id' => $rental->id,
                'code' => $rental->code,
                'status' => $rental->status,
                'start_date' => $rental->start_date->toDateString(),
                'end_date' => $rental->end_date->toDateString(),
                'partner' => $rental->partner?->name,
            ])->values()->all();

            $availability = $this->resolveAvailability($vehicle, $bookings);
            $hasRate = $this->rates->hasMatchingRate($vehicle, $fromDate, $toDate);

            match ($availability) {
                'in_use' => $inUse++,
                'booked' => $booked++,
                'free' => $free++,
                default => null,
            };

            $rows[] = [
                'id' => $vehicle->id,
                'name' => $vehicle->name,
                'plate_number' => $vehicle->plate_number,
                'type' => $vehicle->type,
                'rental_class' => $vehicle->rental_class,
                'status' => $vehicle->status,
                'photo_url' => $vehicle->photo_url,
                'availability' => $availability,
                'has_rate' => $hasRate,
                'bookings' => $bookingRows,
            ];
        }

        return [
            'from' => $fromDate,
            'to' => $toDate,
            'counts' => [
                'total' => $vehicles->count(),
                'free' => $free,
                'booked' => $booked,
                'in_use' => $inUse,
            ],
            'vehicles' => $rows,
        ];
    }

    /**
     * @param  Collection<int, Rental>  $bookings
     */
    private function resolveAvailability(Vehicle $vehicle, Collection $bookings): string
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

        // Draft / pending (or none) leave the vehicle available.
        return 'free';
    }
}
