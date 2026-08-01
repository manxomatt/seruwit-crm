<?php

namespace Modules\Shuttle\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Shuttle\Http\Controllers\Api\Mobile\Concerns\InteractsWithMobilePassengerApi;

class BootstrapController extends Controller
{
    use InteractsWithMobilePassengerApi;

    public function __invoke(Request $request): JsonResponse
    {
        $shuttleEnabled = $this->passengerChannelEnabled();

        return response()->json([
            'tenant' => [
                'id' => tenancy()->initialized ? (string) tenant('id') : null,
                'name' => tenancy()->initialized ? (string) (tenant('name') ?? tenant('id')) : null,
            ],
            'brand' => $this->brandPayload(),
            'surfaces' => [
                'shuttle' => [
                    'enabled' => $shuttleEnabled,
                    'hold_ttl_minutes' => $shuttleEnabled ? $this->holdTtlMinutes() : null,
                    'gateway_available' => $shuttleEnabled && $this->gatewayAvailable(),
                ],
                'rental' => [
                    'enabled' => false,
                ],
            ],
            'min_app_version' => null,
            'api_version' => 1,
        ]);
    }
}
