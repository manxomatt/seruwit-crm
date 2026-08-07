<?php

namespace Modules\Shuttle\Support;

use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Maps known booking/OTP domain exceptions to stable mobile API error codes.
 */
class MobileApiExceptionMapper
{
    /**
     * @return array{status: int, code: string, message: string}
     */
    public function map(Throwable $e): array
    {
        if ($e instanceof ValidationException) {
            return [
                'status' => 422,
                'code' => 'validation_error',
                'message' => $e->getMessage(),
            ];
        }

        $message = $e->getMessage();

        $map = [
            __('shuttle.public.disabled') => ['passenger_booking_disabled', 404],
            __('shuttle.public.otp_invalid') => ['otp_invalid', 422],
            __('shuttle.public.hold_expired') => ['hold_expired', 400],
            __('shuttle.public.pay_draft_only') => ['pay_draft_only', 400],
            __('shuttle.public.gateway_unavailable') => ['gateway_unavailable', 503],
            __('shuttle.messages.insufficient_seats') => ['insufficient_seats', 400],
            __('shuttle.validation.door_product_requires_door') => ['door_product_requires_door', 422],
            __('shuttle.validation.passenger_count_mismatch') => ['passenger_count_mismatch', 422],
            __('shuttle.messages.departure_not_open') => ['departure_not_open', 400],
            __('shuttle.public.not_passenger_channel') => ['not_passenger_channel', 400],
            __('shuttle.public.cancelled_by_passenger') => ['cancel_not_allowed', 400],
            __('rental.public.disabled') => ['passenger_booking_disabled', 404],
            __('rental.public.not_mobile_channel') => ['not_mobile_channel', 400],
            __('rental.public.not_passenger_channel') => ['not_passenger_channel', 400],
            __('rental.public.gateway_unavailable') => ['gateway_unavailable', 503],
            __('rental.errors.cancel_draft_confirmed_only') => ['cancel_not_allowed', 400],
        ];

        foreach ($map as $known => [$code, $status]) {
            if ($message === $known) {
                return [
                    'status' => $status,
                    'code' => $code,
                    'message' => $message,
                ];
            }
        }

        return [
            'status' => 400,
            'code' => 'booking_failed',
            'message' => $message !== '' ? $message : __('shuttle.public.disabled'),
        ];
    }
}
