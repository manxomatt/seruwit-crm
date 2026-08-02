<?php

namespace Modules\Rental\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Rental\Http\Controllers\Api\Mobile\Concerns\InteractsWithMobileRentalApi;
use Modules\Rental\Http\Requests\Mobile\CancelMobileRentalBookingRequest;
use Modules\Rental\Http\Requests\Mobile\StoreMobileRentalBookingRequest;
use Modules\Rental\Http\Resources\Mobile\MobileRentalBookingResource;
use Modules\Rental\Models\Rental;
use Modules\Rental\Support\MobilePassengerPartnerResolver;
use Modules\Rental\Support\MobileRentalBookingService;
use Modules\Shuttle\Support\MobileApiIdempotency;
use Throwable;

class BookingController extends Controller
{
    use InteractsWithMobileRentalApi;

    public function index(Request $request, MobilePassengerPartnerResolver $partners): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $phone = $this->requirePassengerPhone($request);
        $partner = $partners->findByPhone($phone);

        $status = $request->string('status')->toString();

        $query = Rental::query()
            ->where('channel', Rental::CHANNEL_MOBILE)
            ->where(function ($q) use ($phone, $partner): void {
                $q->where('booker_phone', $phone);
                if ($partner !== null) {
                    $q->orWhere('partner_id', $partner->id);
                }
            })
            ->with(['vehicle', 'partner', 'insurancePackage'])
            ->latest();

        if ($status !== '') {
            $query->where('status', $status);
        }

        $rentals = $query->limit(50)->get();

        return response()->json([
            'data' => MobileRentalBookingResource::collection($rentals)->resolve(),
            'meta' => ['count' => $rentals->count()],
        ]);
    }

    public function store(
        StoreMobileRentalBookingRequest $request,
        MobileRentalBookingService $bookings,
        MobileApiIdempotency $idempotency,
    ): JsonResponse {
        $this->ensurePassengerChannelEnabled();

        if ($replay = $idempotency->recall($request, 'rental-booking')) {
            return $replay;
        }

        $phone = $this->requirePassengerPhone($request);

        try {
            $rental = $bookings->create($phone, $request->validated());
        } catch (Throwable $e) {
            return $this->jsonFromThrowable($e);
        }

        $response = response()->json([
            'booking' => (new MobileRentalBookingResource($rental))->resolve(),
            'gateway_available' => $this->gatewayAvailable(),
        ], 201);

        $idempotency->store($request, 'rental-booking', $response);

        return $response;
    }

    public function show(Request $request, string $token): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $rental = $this->findMobileBooking($token);
        $this->assertOptionalOwnership($request, $rental);

        return response()->json([
            'booking' => (new MobileRentalBookingResource($rental))->resolve(),
            'gateway_available' => $this->gatewayAvailable(),
        ]);
    }

    public function cancel(
        CancelMobileRentalBookingRequest $request,
        string $token,
        MobileRentalBookingService $bookings,
    ): JsonResponse {
        $this->ensurePassengerChannelEnabled();

        $rental = $this->findMobileBooking($token);
        $this->assertOwnership($request, $rental);

        try {
            $rental = $bookings->cancel($rental, $request->validated('cancelled_reason'));
        } catch (Throwable $e) {
            return $this->jsonFromThrowable($e);
        }

        return response()->json([
            'booking' => (new MobileRentalBookingResource($rental))->resolve(),
        ]);
    }

    public function payDeposit(
        Request $request,
        string $token,
        MobileApiIdempotency $idempotency,
    ): JsonResponse {
        $this->ensurePassengerChannelEnabled();

        if ($replay = $idempotency->recall($request, 'rental-pay:'.$token)) {
            return $replay;
        }

        $rental = $this->findMobileBooking($token);
        $this->assertOwnership($request, $rental);

        if ($rental->isDepositReceived()) {
            return response()->json([
                'message' => __('rental.public.deposit_already_received'),
                'code' => 'deposit_already_received',
            ], 400);
        }

        if (! in_array($rental->status, [Rental::STATUS_DRAFT, Rental::STATUS_CONFIRMED], true)) {
            return response()->json([
                'message' => __('rental.public.pay_status_invalid'),
                'code' => 'pay_status_invalid',
            ], 400);
        }

        if (! class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class)
            || ! $this->gatewayAvailable()) {
            return response()->json([
                'message' => __('rental.public.gateway_unavailable'),
                'code' => 'gateway_unavailable',
            ], 503);
        }

        try {
            $charge = app(\Modules\Receivables\Support\GatewayCheckoutService::class)
                ->createRentalDepositCharge($rental->loadMissing('partner'));
            $rental->refresh()->load(['vehicle', 'partner', 'insurancePackage']);
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
            'booking' => (new MobileRentalBookingResource($rental))->resolve(),
        ]);

        $idempotency->store($request, 'rental-pay:'.$token, $response);

        return $response;
    }

    private function assertOptionalOwnership(Request $request, Rental $rental): void
    {
        $phone = $request->attributes->get('mobile_passenger_phone');

        if (! is_string($phone) || $phone === '') {
            $plain = (string) $request->bearerToken();
            if ($plain === '') {
                return;
            }

            $row = app(\Modules\Shuttle\Support\MobilePassengerTokenService::class)->findValid($plain);
            if ($row === null) {
                abort(response()->json([
                    'message' => 'Unauthenticated.',
                    'code' => 'unauthenticated',
                ], 401));
            }
            $phone = $row->phone;
        }

        if ($rental->booker_phone !== null && $rental->booker_phone !== $phone) {
            abort(response()->json([
                'message' => 'Forbidden.',
                'code' => 'forbidden',
            ], 403));
        }
    }
}
