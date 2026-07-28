<?php

namespace Modules\Rental\Support;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;

class RentalAvailabilityBoard
{
    /**
     * Build a vehicle availability board for [$from, $to].
     *
     * @return array{
     *     from: string,
     *     to: string,
     *     counts: array{total: int, free: int, booked: int},
     *     vehicles: list<array{
     *         id: int,
     *         name: string,
     *         plate_number: string,
     *         type: string|null,
     *         status: string,
     *         availability: string,
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
            ->get(['id', 'name', 'plate_number', 'type', 'status']);

        $rentals = Rental::query()
            ->with('partner:id,name')
            ->whereIn('status', [Rental::STATUS_CONFIRMED, Rental::STATUS_ACTIVE])
            ->where('start_date', '<=', $toDate)
            ->where('end_date', '>=', $fromDate)
            ->orderBy('start_date')
            ->get()
            ->groupBy('vehicle_id');

        $rows = [];
        $free = 0;
        $booked = 0;

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

            $availability = 'free';

            if ($vehicle->status !== Vehicle::STATUS_ACTIVE) {
                $availability = 'unavailable';
            } elseif ($bookingRows !== []) {
                $availability = 'booked';
                $booked++;
            } else {
                $free++;
            }

            $rows[] = [
                'id' => $vehicle->id,
                'name' => $vehicle->name,
                'plate_number' => $vehicle->plate_number,
                'type' => $vehicle->type,
                'status' => $vehicle->status,
                'availability' => $availability,
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
            ],
            'vehicles' => $rows,
        ];
    }
}
