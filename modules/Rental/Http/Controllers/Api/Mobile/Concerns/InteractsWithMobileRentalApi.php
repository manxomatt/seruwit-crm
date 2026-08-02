<?php

namespace Modules\Rental\Http\Controllers\Api\Mobile\Concerns;

use App\Models\Setting;
use App\Modules\Facades\Modules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Modules\Rental\Models\Rental;
use Modules\Shuttle\Support\MobileApiExceptionMapper;
use Modules\Shuttle\Support\MobilePassengerTokenService;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

trait InteractsWithMobileRentalApi
{
    protected function passengerChannelEnabled(): bool
    {
        if (! tenancy()->initialized && ! app()->runningUnitTests()) {
            return false;
        }

        if (! Modules::available('rental') || ! Schema::hasTable('rentals')) {
            return false;
        }

        return Setting::getValue('rental.passenger_booking_enabled', '0') === '1';
    }

    protected function ensurePassengerChannelEnabled(): void
    {
        if (! $this->passengerChannelEnabled()) {
            abort(response()->json([
                'message' => __('rental.public.disabled'),
                'code' => 'passenger_booking_disabled',
            ], Response::HTTP_NOT_FOUND));
        }
    }

    protected function gatewayAvailable(): bool
    {
        return class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class)
            && app(\Modules\Receivables\Support\GatewayCheckoutService::class)->isAvailable();
    }

    protected function findMobileBooking(string $token): Rental
    {
        return Rental::query()
            ->where('public_token', $token)
            ->where('channel', Rental::CHANNEL_MOBILE)
            ->with(['vehicle', 'partner', 'insurancePackage', 'pickupLocation', 'returnLocation'])
            ->firstOrFail();
    }

    protected function assertOwnership(Request $request, Rental $rental): void
    {
        $phone = $request->attributes->get('mobile_passenger_phone');

        if (! is_string($phone) || $phone === '') {
            $plain = (string) $request->bearerToken();
            if ($plain === '') {
                abort(response()->json([
                    'message' => 'Unauthenticated.',
                    'code' => 'unauthenticated',
                ], 401));
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

        if ($rental->booker_phone !== null && $rental->booker_phone !== $phone) {
            abort(response()->json([
                'message' => 'Forbidden.',
                'code' => 'forbidden',
            ], 403));
        }
    }

    protected function requirePassengerPhone(Request $request): string
    {
        $phone = $request->attributes->get('mobile_passenger_phone');

        if (is_string($phone) && $phone !== '') {
            return $phone;
        }

        $plain = (string) $request->bearerToken();
        $row = $plain !== '' ? app(MobilePassengerTokenService::class)->findValid($plain) : null;

        if ($row === null) {
            abort(response()->json([
                'message' => 'Unauthenticated.',
                'code' => 'unauthenticated',
            ], 401));
        }

        return $row->phone;
    }

    protected function jsonFromThrowable(Throwable $e): JsonResponse
    {
        $mapped = app(MobileApiExceptionMapper::class)->map($e);

        return response()->json([
            'message' => $mapped['message'],
            'code' => $mapped['code'],
            'errors' => $e instanceof \Illuminate\Validation\ValidationException ? $e->errors() : null,
        ], $mapped['status']);
    }
}
