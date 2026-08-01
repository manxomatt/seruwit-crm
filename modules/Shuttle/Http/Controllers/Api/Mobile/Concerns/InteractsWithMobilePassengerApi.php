<?php

namespace Modules\Shuttle\Http\Controllers\Api\Mobile\Concerns;

use App\Modules\Facades\Modules;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Schema;
use Modules\Partners\Models\Location;
use Modules\Shuttle\Models\ShuttleSetting;
use Modules\Shuttle\Support\MobileApiExceptionMapper;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

trait InteractsWithMobilePassengerApi
{
    protected function passengerChannelEnabled(): bool
    {
        if (! tenancy()->initialized && ! app()->runningUnitTests()) {
            return false;
        }

        if (! Modules::available('shuttle') || ! Schema::hasTable('shuttle_settings')) {
            return false;
        }

        return ShuttleSetting::getValue(ShuttleSetting::KEY_PASSENGER_BOOKING_ENABLED, '0') === '1';
    }

    protected function ensurePassengerChannelEnabled(): void
    {
        if (! $this->passengerChannelEnabled()) {
            abort(response()->json([
                'message' => __('shuttle.public.disabled'),
                'code' => 'passenger_booking_disabled',
            ], Response::HTTP_NOT_FOUND));
        }
    }

    /**
     * @return array{name: string, primary_color: string, logo_url: null}
     */
    protected function brandPayload(): array
    {
        $defaults = ShuttleSetting::defaults();
        $mapped = array_merge($defaults, ShuttleSetting::allMapped());

        return [
            'name' => $mapped[ShuttleSetting::KEY_PUBLIC_BRAND_NAME] ?: 'Travel',
            'primary_color' => $mapped[ShuttleSetting::KEY_PUBLIC_BRAND_COLOR] ?: '#0f766e',
            'logo_url' => null,
        ];
    }

    protected function gatewayAvailable(): bool
    {
        return class_exists(\Modules\Receivables\Support\GatewayCheckoutService::class)
            && app(\Modules\Receivables\Support\GatewayCheckoutService::class)->isAvailable();
    }

    protected function holdTtlMinutes(): int
    {
        return max(5, ShuttleSetting::getInt(ShuttleSetting::KEY_HOLD_TTL_MINUTES, 15));
    }

    /**
     * @return array{latitude: string, longitude: string, address: string, name: string}|null
     */
    protected function poolPin(?Location $location): ?array
    {
        if ($location === null || $location->latitude === null || $location->longitude === null) {
            return null;
        }

        return [
            'latitude' => (string) $location->latitude,
            'longitude' => (string) $location->longitude,
            'address' => filled($location->address) ? (string) $location->address : (string) $location->name,
            'name' => (string) $location->name,
        ];
    }

    protected function jsonFromThrowable(Throwable $e): JsonResponse
    {
        $mapped = app(MobileApiExceptionMapper::class)->map($e);

        return response()->json([
            'message' => $mapped['message'],
            'code' => $mapped['code'],
        ], $mapped['status']);
    }
}
