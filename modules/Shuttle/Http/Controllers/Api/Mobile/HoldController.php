<?php

namespace Modules\Shuttle\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Shuttle\Http\Controllers\Api\Mobile\Concerns\InteractsWithMobilePassengerApi;
use Modules\Shuttle\Http\Requests\Mobile\StoreMobileHoldRequest;
use Modules\Shuttle\Http\Resources\Mobile\MobileBookingResource;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttleCorridor;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\Shuttle\Support\MobileApiIdempotency;
use Modules\Shuttle\Support\MobilePassengerTokenService;
use Modules\Shuttle\Support\PassengerBookingService;
use Modules\Shuttle\Support\PassengerOtpService;
use Throwable;

class HoldController extends Controller
{
    use InteractsWithMobilePassengerApi;

    public function store(
        StoreMobileHoldRequest $request,
        PassengerBookingService $bookings,
        PassengerOtpService $otp,
        MobilePassengerTokenService $tokens,
        MobileApiIdempotency $idempotency,
    ): JsonResponse {
        $this->ensurePassengerChannelEnabled();

        if ($replay = $idempotency->recall($request, 'hold')) {
            return $replay;
        }

        $data = $request->validated();

        try {
            $bookerPhone = $this->resolveBookerPhone($request, $otp, $tokens, $data);
            $departure = ShuttleDeparture::query()->with('corridor')->findOrFail($data['departure_id']);

            if ($departure->resolvedServiceType() === ShuttleCorridor::SERVICE_POOL) {
                $data['pickup_mode'] = ShuttleBooking::MODE_POOL;
                $data['dropoff_mode'] = ShuttleBooking::MODE_POOL;
                $data['pickup_address'] = null;
                $data['pickup_lat'] = null;
                $data['pickup_lng'] = null;
                $data['dropoff_address'] = null;
                $data['dropoff_lat'] = null;
                $data['dropoff_lng'] = null;
            } elseif ($data['pickup_mode'] === ShuttleBooking::MODE_POOL
                && $data['dropoff_mode'] === ShuttleBooking::MODE_POOL) {
                return response()->json([
                    'message' => __('shuttle.validation.door_product_requires_door'),
                    'code' => 'door_product_requires_door',
                    'errors' => [
                        'pickup_mode' => [__('shuttle.validation.door_product_requires_door')],
                    ],
                ], 422);
            }

            $booking = $bookings->hold([
                'departure_id' => (int) $data['departure_id'],
                'passenger_count' => (int) $data['passenger_count'],
                'unit_fare' => (float) ($departure->corridor?->base_fare ?? 0),
                'pickup_mode' => $data['pickup_mode'],
                'dropoff_mode' => $data['dropoff_mode'],
                'booker_phone' => $bookerPhone,
                'booker_phone_verified_at' => now(),
                'pickup_address' => $data['pickup_address'] ?? null,
                'pickup_lat' => $data['pickup_lat'] ?? null,
                'pickup_lng' => $data['pickup_lng'] ?? null,
                'dropoff_address' => $data['dropoff_address'] ?? null,
                'dropoff_lat' => $data['dropoff_lat'] ?? null,
                'dropoff_lng' => $data['dropoff_lng'] ?? null,
                'notes' => $data['notes'] ?? null,
            ], $data['passengers']);
        } catch (Throwable $e) {
            return $this->jsonFromThrowable($e);
        }

        $response = response()->json([
            'booking' => (new MobileBookingResource($booking))->resolve(),
        ], 201);

        $idempotency->store($request, 'hold', $response);

        return $response;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveBookerPhone(
        Request $request,
        PassengerOtpService $otp,
        MobilePassengerTokenService $tokens,
        array $data,
    ): string {
        $fromBearer = $request->attributes->get('mobile_passenger_phone');
        if (is_string($fromBearer) && $fromBearer !== '') {
            return $fromBearer;
        }

        $plain = (string) $request->bearerToken();
        if ($plain !== '') {
            $row = $tokens->findValid($plain);
            if ($row !== null) {
                $request->attributes->set('mobile_passenger_phone', $row->phone);

                return $row->phone;
            }

            abort(response()->json([
                'message' => 'Unauthenticated.',
                'code' => 'unauthenticated',
            ], 401));
        }

        $phone = (string) ($data['booker_phone'] ?? '');
        $code = (string) ($data['otp_code'] ?? '');

        if ($otp->isVerified($phone) || $otp->verify($phone, $code)) {
            return $otp->normalize($phone);
        }

        abort(response()->json([
            'message' => __('shuttle.public.otp_invalid'),
            'code' => 'otp_invalid',
            'errors' => [
                'otp_code' => [__('shuttle.public.otp_invalid')],
            ],
        ], 422));
    }
}
