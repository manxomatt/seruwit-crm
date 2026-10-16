<?php

namespace Modules\Rental\Support;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\AccessibleFleetBases;
use Modules\Maintenance\Support\WorkOrderShopHold;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalMaintenanceBlackout;

class RentalAvailabilityBoard
{
    public function __construct(
        private readonly RentalRateResolver $rates,
    ) {}

    /**
     * Build a vehicle availability board for [$from, $to].
     *
     * Availability is driven by overlapping rental status or workshop blackout:
     * - draft only (or none) → free (Tersedia)
     * - blackout → maintenance (Servis/Blackout)
     * - confirmed → booked (Dibooking)
     * - active → in_use (Digunakan)
     *
     * @return array{
     *     from: string,
     *     to: string,
     *     counts: array{total: int, free: int, booked: int, in_use: int, maintenance: int},
     *     vehicles: list<array{
     *         id: int,
     *         name: string,
     *         plate_number: string,
     *         type: string|null,
     *         rental_class: string|null,
     *         status: string,
     *         photo_url: string|null,
     *         availability: string,
     *         has_rate: bool,
     *         blackout: array{id: int, code: string, reason: string, status: string, start_date: string|null, end_date: string|null}|null,
     *         bookings: list<array{id: int, code: string, status: string, start_date: string, end_date: string, partner: string|null}>
     *     }>
     * }
     */
    public function build(string $from, string $to): array
    {
        $fromDate = Carbon::parse($from)->toDateString();
        $toDate = Carbon::parse($to)->toDateString();

        $vehicles = AccessibleFleetBases::scopeVehicles(Vehicle::query())
            ->orderBy('name')
            ->get(['id', 'name', 'plate_number', 'type', 'status', 'photo_url', 'rental_class']);

        $rentals = AccessibleFleetBases::scopeRentals(Rental::query())
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

        $blackouts = RentalMaintenanceBlackout::activeBlackoutsBetween($fromDate, $toDate);

        $rows = [];
        $free = 0;
        $booked = 0;
        $inUse = 0;
        $maintenance = 0;
        $shopHeldVehicleIds = array_fill_keys(WorkOrderShopHold::vehicleIds(), true);

        foreach ($vehicles as $vehicle) {
            /** @var Collection<int, Rental> $bookings */
            $bookings = $rentals->get($vehicle->id, collect());
            $vehicleBlackout = $blackouts->get($vehicle->id)?->first();

            $bookingRows = $bookings->map(fn (Rental $rental): array => [
                'id' => $rental->id,
                'code' => $rental->code,
                'status' => $rental->status,
                'start_date' => $rental->start_date->toDateString(),
                'end_date' => $rental->end_date->toDateString(),
                'partner' => $rental->partner?->name,
            ])->values()->all();

            $availability = $this->resolveAvailability($vehicle, $bookings, $shopHeldVehicleIds, $vehicleBlackout !== null);
            $hasRate = $this->rates->hasMatchingRate($vehicle, $fromDate, $toDate);

            match ($availability) {
                'in_use' => $inUse++,
                'booked' => $booked++,
                'maintenance' => $maintenance++,
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
                'blackout' => $vehicleBlackout ? [
                    'id' => $vehicleBlackout->id,
                    'code' => $vehicleBlackout->code,
                    'reason' => $vehicleBlackout->reason,
                    'status' => $vehicleBlackout->status,
                    'start_date' => $vehicleBlackout->start_date?->toDateString(),
                    'end_date' => $vehicleBlackout->end_date?->toDateString(),
                ] : null,
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
                'maintenance' => $maintenance,
            ],
            'vehicles' => $rows,
        ];
    }

    /**
     * @param  Collection<int, Rental>  $bookings
     * @param  array<int, true>  $shopHeldVehicleIds
     */
    private function resolveAvailability(Vehicle $vehicle, Collection $bookings, array $shopHeldVehicleIds, bool $hasBlackout = false): string
    {
        if ($vehicle->status !== Vehicle::STATUS_ACTIVE || ! $vehicle->hasActiveCapacity() || isset($shopHeldVehicleIds[$vehicle->id])) {
            return 'unavailable';
        }

        if ($hasBlackout) {
            return 'maintenance';
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
