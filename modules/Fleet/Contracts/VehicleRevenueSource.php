<?php

namespace Modules\Fleet\Contracts;

use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Downward integration contract allowing Vertical modules (such as Rental)
 * to supply billable utilization and revenue records for Fleet investor
 * settlements without Fleet importing Vertical models directly.
 */
interface VehicleRevenueSource
{
    /**
     * Fetch completed or active revenue items for a vehicle within a date range.
     *
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
    public function getVehicleRevenueItems(int $vehicleId, Carbon $startDate, Carbon $endDate): Collection;
}
