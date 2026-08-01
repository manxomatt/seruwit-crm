<?php

namespace Modules\Shuttle\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Support\NominatimGeocoder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Shuttle\Http\Controllers\Api\Mobile\Concerns\InteractsWithMobilePassengerApi;
use RuntimeException;
use Throwable;

class GeocodeController extends Controller
{
    use InteractsWithMobilePassengerApi;

    public function reverse(Request $request, NominatimGeocoder $geocoder): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $validated = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
        ]);

        try {
            $result = $geocoder->reverse((float) $validated['lat'], (float) $validated['lng']);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'code' => 'geocode_failed',
            ], 422);
        } catch (Throwable) {
            return response()->json([
                'message' => __('common.geocode.failed'),
                'code' => 'geocode_failed',
            ], 502);
        }

        return response()->json([
            'address' => $result['address'] ?? null,
            'latitude' => $result['latitude'] ?? (float) $validated['lat'],
            'longitude' => $result['longitude'] ?? (float) $validated['lng'],
        ]);
    }
}
