<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\MobileRentalBookingService;
use Modules\Rental\Support\RentalPriceEngine;
use Modules\Rental\Support\RentalRateResolver;

/**
 * JSON helpers for the staff Reservation wizard (Create / Edit).
 */
class RentalReservationWizardController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Vehicles available for a date range, with suggested rates.
     */
    public function availableVehicles(Request $request, RentalRateResolver $rates, RentalPriceEngine $priceEngine): JsonResponse
    {
        $data = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'period_type' => ['required', 'in:daily,weekly,monthly'],
            'exclude_rental_id' => ['nullable', 'integer', 'exists:rentals,id'],
        ]);

        $excludeId = isset($data['exclude_rental_id']) ? (int) $data['exclude_rental_id'] : null;
        $start = $data['start_date'];
        $end = $data['end_date'];
        $periodType = $data['period_type'];
        $periods = Rental::computePeriods($start, $end, $periodType);

        $vehicles = Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->orderBy('name')
            ->get(['id', 'name', 'plate_number', 'type', 'rental_class', 'status', 'photo_url', 'stnk_expires_at', 'kir_expires_at']);

        $rows = [];
        $skippedNoRate = 0;
        $skippedUnavailable = 0;

        foreach ($vehicles as $vehicle) {
            $reasons = Rental::vehicleAvailabilityReasons($vehicle, $start, $end, $excludeId);

            if (Modules::available('transportation')) {
                $current = \Carbon\Carbon::parse($start);
                $endDate = \Carbon\Carbon::parse($end);
                while ($current->lte($endDate)) {
                    $date = $current->toDateString();
                    if (\Modules\TransportationManagement\Models\Trip::hasActiveTripOn('vehicle_id', $vehicle->id, $date)) {
                        $reasons[] = __('rental.validation.vehicle_trip_conflict', [
                            'name' => $vehicle->name,
                            'date' => $date,
                        ]);
                        break;
                    }
                    $current->addDay();
                }
            }

            if ($reasons !== []) {
                $skippedUnavailable++;

                continue;
            }

            $rate = $rates->suggest($vehicle, $start, $end, $periodType);

            if ($rate === null) {
                $skippedNoRate++;

                continue;
            }

            if ($rate->min_periods !== null && $periods < (int) $rate->min_periods) {
                $skippedUnavailable++;

                continue;
            }

            try {
                $pricing = $priceEngine->calculate($vehicle, $start, $end, $periodType);
                $ratePerPeriod = $pricing['effective_rate_per_period'];
                $baseAmount = $pricing['base_amount'];
            } catch (\RuntimeException) {
                $ratePerPeriod = (float) $rate->rate_per_period;
                $baseAmount = round($ratePerPeriod * $periods, 2);
            }

            $rows[] = [
                'id' => $vehicle->id,
                'name' => $vehicle->name,
                'plate_number' => $vehicle->plate_number,
                'type' => $vehicle->type,
                'rental_class' => $vehicle->rental_class,
                'photo_url' => $vehicle->photo_url,
                'rate' => [
                    'id' => $rate->id,
                    'name' => $rate->name,
                    'period_type' => $rate->period_type,
                    'rate_per_period' => $ratePerPeriod,
                    'km_limit_per_period' => $rate->km_limit_per_period,
                    'excess_km_rate' => $rate->excess_km_rate !== null ? (float) $rate->excess_km_rate : null,
                    'late_fee_per_day' => $rate->late_fee_per_day !== null ? (float) $rate->late_fee_per_day : null,
                    'deposit_amount' => (float) ($rate->deposit_amount ?? 0),
                    'min_periods' => $rate->min_periods !== null ? (int) $rate->min_periods : null,
                ],
                'total_periods' => $periods,
                'base_amount' => $baseAmount,
            ];
        }

        return response()->json([
            'vehicles' => $rows,
            'meta' => [
                'count' => count($rows),
                'total_periods' => $periods,
                'skipped_no_rate' => $skippedNoRate,
                'skipped_unavailable' => $skippedUnavailable,
                'has_active_rates' => RentalRate::query()->where('is_active', true)->where('period_type', $periodType)->exists(),
            ],
        ]);
    }

    /**
     * Server-side quote for Step Confirm (same pricing rules as mobile quote).
     */
    public function quote(Request $request, MobileRentalBookingService $booking): JsonResponse
    {
        $data = $request->validate([
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'period_type' => ['required', 'in:daily,weekly,monthly'],
            'pickup_location_id' => app(\Modules\Rental\Support\RentalLocationHydrator::class)->depotIdRules(),
            'return_location_id' => app(\Modules\Rental\Support\RentalLocationHydrator::class)->depotIdRules(),
            'one_way_fee_amount' => ['nullable', 'numeric', 'min:0'],
            'insurance_package_id' => ['nullable', 'integer', 'exists:rental_insurance_packages,id'],
            'exclude_rental_id' => ['nullable', 'integer', 'exists:rentals,id'],
        ]);

        $excludeId = isset($data['exclude_rental_id']) ? (int) $data['exclude_rental_id'] : null;
        $vehicle = Vehicle::query()->findOrFail((int) $data['vehicle_id']);

        $reasons = Rental::vehicleAvailabilityReasons(
            $vehicle,
            $data['start_date'],
            $data['end_date'],
            $excludeId,
        );

        $quote = $booking->quote($data);
        $rate = $quote['rate'];

        if ($rate === null) {
            $reasons[] = __('rental.validation.rate_required');
        }

        $quote['reasons'] = $reasons;
        $quote['available'] = $reasons === [] && $rate !== null;

        $ratePayload = $quote['rate'] ?? $rate;

        return response()->json([
            'quote' => [
                'available' => $quote['available'],
                'reasons' => $quote['reasons'],
                'total_periods' => $quote['total_periods'],
                'rate_per_period' => $quote['rate_per_period'],
                'deposit_amount' => $quote['deposit_amount'],
                'base_amount' => $quote['base_amount'],
                'one_way_fee_amount' => $quote['one_way_fee_amount'],
                'insurance_amount' => $quote['insurance_amount'],
                'total_amount' => $quote['total_amount'],
                'min_periods' => $quote['min_periods'],
                'rate' => $ratePayload ? [
                    'id' => $ratePayload->id,
                    'name' => $ratePayload->name,
                    'period_type' => $ratePayload->period_type,
                    'km_limit_per_period' => $ratePayload->km_limit_per_period,
                    'excess_km_rate' => $ratePayload->excess_km_rate !== null ? (float) $ratePayload->excess_km_rate : null,
                    'late_fee_per_day' => $ratePayload->late_fee_per_day !== null ? (float) $ratePayload->late_fee_per_day : null,
                ] : null,
            ],
        ]);
    }
}
