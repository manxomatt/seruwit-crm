<?php

namespace Modules\Rental\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Rental\Http\Controllers\Api\Mobile\Concerns\InteractsWithMobileRentalApi;
use Modules\Rental\Http\Requests\Mobile\QuoteMobileRentalRequest;
use Modules\Rental\Support\MobileRentalBookingService;

class QuoteController extends Controller
{
    use InteractsWithMobileRentalApi;

    public function __invoke(QuoteMobileRentalRequest $request, MobileRentalBookingService $bookings): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $quote = $bookings->quote($request->validated());

        return response()->json([
            'quote' => [
                'available' => $quote['available'],
                'reasons' => $quote['reasons'],
                'start_date' => $request->validated('start_date'),
                'end_date' => $request->validated('end_date'),
                'period_type' => $request->validated('period_type'),
                'total_periods' => $quote['total_periods'],
                'min_periods' => $quote['min_periods'],
                'rate' => $quote['rate'] ? [
                    'id' => $quote['rate']->id,
                    'name' => $quote['rate']->name,
                    'period_type' => $quote['rate']->period_type,
                    'rate_per_period' => (float) $quote['rate']->rate_per_period,
                    'deposit_amount' => (float) ($quote['rate']->deposit_amount ?? 0),
                    'km_limit_per_period' => $quote['rate']->km_limit_per_period,
                    'excess_km_rate' => $quote['rate']->excess_km_rate !== null ? (float) $quote['rate']->excess_km_rate : null,
                    'late_fee_per_day' => $quote['rate']->late_fee_per_day !== null ? (float) $quote['rate']->late_fee_per_day : null,
                ] : null,
                'rate_per_period' => $quote['rate_per_period'],
                'deposit_amount' => $quote['deposit_amount'],
                'base_amount' => $quote['base_amount'],
                'one_way_fee_amount' => $quote['one_way_fee_amount'],
                'insurance_amount' => $quote['insurance_amount'],
                'total_amount' => $quote['total_amount'],
            ],
        ]);
    }
}
