<?php

namespace Modules\Shuttle\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Shuttle\Http\Controllers\Api\Mobile\Concerns\InteractsWithMobilePassengerApi;
use Modules\Shuttle\Http\Requests\Mobile\CancelMobileTicketRequest;
use Modules\Shuttle\Http\Resources\Mobile\MobileBookingResource;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Support\MobileApiIdempotency;
use Modules\Shuttle\Support\MobilePassengerTokenService;
use Modules\Shuttle\Support\PassengerBookingService;
use Throwable;

class TicketController extends Controller
{
    use InteractsWithMobilePassengerApi;

    public function show(Request $request, string $token): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $booking = $this->findPassengerBooking($token);
        $this->assertOptionalOwnership($request, $booking);

        return response()->json([
            'booking' => (new MobileBookingResource($booking))->resolve(),
            'gateway_available' => $this->gatewayAvailable(),
        ]);
    }

    public function cancel(
        CancelMobileTicketRequest $request,
        string $token,
        PassengerBookingService $bookings,
    ): JsonResponse {
        $this->ensurePassengerChannelEnabled();

        $booking = $this->findPassengerBooking($token);
        $this->assertOptionalOwnership($request, $booking);

        try {
            $booking = $bookings->cancelPassenger(
                $booking,
                $request->validated('cancel_reason'),
            );
        } catch (Throwable $e) {
            return $this->jsonFromThrowable($e);
        }

        $booking->load(['passengers', 'departure.corridor']);

        return response()->json([
            'booking' => (new MobileBookingResource($booking))->resolve(),
        ]);
    }

    public function pay(
        Request $request,
        string $token,
        MobileApiIdempotency $idempotency,
    ): JsonResponse {
        $this->ensurePassengerChannelEnabled();

        if ($replay = $idempotency->recall($request, 'pay:'.$token)) {
            return $replay;
        }

        $booking = $this->findPassengerBooking($token);
        $this->assertOptionalOwnership($request, $booking);

        if ($booking->status !== ShuttleBooking::STATUS_DRAFT) {
            return response()->json([
                'message' => __('shuttle.public.pay_draft_only'),
                'code' => 'pay_draft_only',
            ], 400);
        }

        if ($booking->isHoldExpired()) {
            return response()->json([
                'message' => __('shuttle.public.hold_expired'),
                'code' => 'hold_expired',
            ], 400);
        }

        if (! class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class)
            || ! $this->gatewayAvailable()) {
            return response()->json([
                'message' => __('shuttle.public.gateway_unavailable'),
                'code' => 'gateway_unavailable',
            ], 503);
        }

        try {
            $charge = app(\Modules\Receivables\Support\GatewayCheckoutService::class)
                ->createShuttleBookingCharge($booking);

            $booking->update(['payment_status' => ShuttleBooking::PAYMENT_PENDING]);
            $booking->refresh()->load(['passengers', 'departure.corridor']);
        } catch (Throwable $e) {
            return $this->jsonFromThrowable($e);
        }

        $response = response()->json([
            'payment' => [
                'mode' => 'midtrans_snap',
                'redirect_url' => $charge->redirect_url,
                'snap_token' => $charge->snap_token ?? null,
                'expires_at' => null,
            ],
            'booking' => (new MobileBookingResource($booking))->resolve(),
        ]);

        $idempotency->store($request, 'pay:'.$token, $response);

        return $response;
    }

    private function findPassengerBooking(string $token): ShuttleBooking
    {
        return ShuttleBooking::query()
            ->where('public_token', $token)
            ->where('channel', ShuttleBooking::CHANNEL_PASSENGER)
            ->with(['passengers', 'departure.corridor'])
            ->firstOrFail();
    }

    private function assertOptionalOwnership(Request $request, ShuttleBooking $booking): void
    {
        $phone = $request->attributes->get('mobile_passenger_phone');

        if (! is_string($phone) || $phone === '') {
            $plain = (string) $request->bearerToken();
            if ($plain === '') {
                return;
            }

            $row = app(MobilePassengerTokenService::class)->findValid($plain);
            if ($row === null) {
                abort(response()->json([
                    'message' => 'Unauthenticated.',
                    'code' => 'unauthenticated',
                ], 401));
            }
            $phone = $row->phone;
        }

        if ($booking->booker_phone !== null && $booking->booker_phone !== $phone) {
            abort(response()->json([
                'message' => 'Forbidden.',
                'code' => 'forbidden',
            ], 403));
        }
    }
}
