<?php

namespace Modules\Rental\Http\Resources\Mobile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Rental\Models\Rental;

/**
 * @mixin Rental
 */
class MobileRentalBookingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Rental $rental */
        $rental = $this->resource;
        $token = (string) $rental->public_token;

        return [
            'code' => $rental->code,
            'public_token' => $token,
            'status' => $rental->status,
            'channel' => $rental->channel,
            'booker_phone' => $rental->booker_phone,
            'start_date' => $rental->start_date?->toDateString(),
            'end_date' => $rental->end_date?->toDateString(),
            'period_type' => $rental->period_type,
            'total_periods' => (int) $rental->total_periods,
            'rate_per_period' => (float) $rental->rate_per_period,
            'base_amount' => (float) $rental->base_amount,
            'deposit_amount' => (float) $rental->deposit_amount,
            'deposit_received' => $rental->isDepositReceived(),
            'deposit_status' => $rental->deposit_status,
            'one_way_fee_amount' => $rental->one_way_fee_amount !== null ? (float) $rental->one_way_fee_amount : null,
            'total_amount' => (float) $rental->total_amount,
            'pickup_location' => $rental->pickup_location,
            'return_location' => $rental->return_location,
            'pickup_location_id' => $rental->pickup_location_id,
            'return_location_id' => $rental->return_location_id,
            'insurance_package' => $rental->insurancePackage ? [
                'id' => $rental->insurancePackage->id,
                'code' => $rental->insurancePackage->code,
                'name' => $rental->insurancePackage->name,
                'amount' => (float) $rental->insurancePackage->amount,
            ] : null,
            'vehicle' => $rental->vehicle ? (new MobileRentalVehicleResource($rental->vehicle))->resolve() : null,
            'cancelled_reason' => $rental->cancelled_reason,
            'confirmed_at' => $rental->confirmed_at?->toIso8601String(),
            'reserved_until' => $rental->reserved_until?->toIso8601String(),
            'booking_path' => '/api/mobile/v1/rental/bookings/'.$token,
        ];
    }
}
