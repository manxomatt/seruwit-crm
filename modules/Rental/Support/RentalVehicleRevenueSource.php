<?php

namespace Modules\Rental\Support;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\Fleet\Contracts\VehicleRevenueSource;
use Modules\Rental\Models\Rental;

class RentalVehicleRevenueSource implements VehicleRevenueSource
{
    /**
     * @return Collection<int, array{
     *     id: int,
     *     code: string,
     *     customer_name: string,
     *     start_date: mixed,
     *     end_date: mixed,
     *     status: string,
     *     days: int,
     *     total_amount: float
     * }>
     */
    public function getVehicleRevenueItems(int $vehicleId, Carbon $startDate, Carbon $endDate): Collection
    {
        $startDateStr = $startDate->toDateString();
        $endDateStr = $endDate->toDateString();

        return Rental::query()
            ->where('vehicle_id', $vehicleId)
            ->whereIn('status', [
                Rental::STATUS_COMPLETED,
                Rental::STATUS_RETURNED,
                Rental::STATUS_ACTIVE,
            ])
            ->where(function ($q) use ($startDateStr, $endDateStr): void {
                $q->whereBetween('start_date', [$startDateStr, $endDateStr])
                    ->orWhereBetween('end_date', [$startDateStr, $endDateStr])
                    ->orWhere(function ($sub) use ($startDateStr, $endDateStr): void {
                        $sub->where('start_date', '<=', $startDateStr)
                            ->where('end_date', '>=', $endDateStr);
                    });
            })
            ->with('partner:id,name,phone,mobile')
            ->orderBy('start_date', 'asc')
            ->get()
            ->map(function (Rental $rental) use ($startDate, $endDate): array {
                $rStart = Carbon::parse($rental->start_date);
                $rEnd = Carbon::parse($rental->end_date ?? $rental->start_date);

                $effStart = $rStart->greaterThan($startDate) ? $rStart : $startDate;
                $effEnd = $rEnd->lessThan($endDate) ? $rEnd : $endDate;
                $days = max(1, (int) $effStart->diffInDays($effEnd) + 1);

                return [
                    'id' => $rental->id,
                    'code' => $rental->code,
                    'customer_name' => $rental->partner?->name ?? 'Pelanggan',
                    'start_date' => $rental->start_date,
                    'end_date' => $rental->end_date,
                    'status' => $rental->status,
                    'days' => $days,
                    'total_amount' => (float) ($rental->total_amount ?? 0),
                ];
            });
    }
}
