<?php

namespace Modules\Shuttle\Http\Resources\Mobile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Shuttle\Models\ShuttleBooking;

/**
 * @mixin ShuttleBooking
 */
class MobileBookingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var ShuttleBooking $booking */
        $booking = $this->resource;

        $amountDue = (float) $booking->total_fare;
        if (class_exists(\Modules\Shuttle\Support\ShuttleAccountingService::class)) {
            $amountDue = (float) app(\Modules\Shuttle\Support\ShuttleAccountingService::class)
                ->splitFare((float) $booking->total_fare)['paid'];
        }

        $token = (string) $booking->public_token;

        return [
            'booking_number' => $booking->booking_number,
            'public_token' => $token,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'passenger_count' => (int) $booking->passenger_count,
            'total_fare' => (float) $booking->total_fare,
            'amount_due' => $amountDue,
            'hold_expires_at' => $booking->hold_expires_at?->toIso8601String(),
            'booker_phone' => $booking->booker_phone,
            'pickup_mode' => $booking->pickup_mode,
            'dropoff_mode' => $booking->dropoff_mode,
            'pickup_address' => $booking->pickup_address,
            'dropoff_address' => $booking->dropoff_address,
            'departure' => $booking->departure ? [
                'depart_date' => $booking->departure->depart_date?->toDateString(),
                'depart_time' => substr((string) $booking->departure->depart_time, 0, 5),
                'corridor' => $booking->departure->corridor?->name,
            ] : null,
            'passengers' => $booking->passengers->map(fn ($p) => [
                'name' => $p->name,
                'phone' => $p->phone,
                'seat_label' => $p->seat_label,
            ])->values()->all(),
            'ticket_path' => '/book/shuttle/ticket/'.$token,
            'qr_payload' => url('/book/shuttle/ticket/'.$token),
        ];
    }
}
