<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Inventory\Support\NominatimGeocoder;
use RuntimeException;
use Throwable;

class GeocodeController extends Controller
{
    public function reverse(Request $request, NominatimGeocoder $geocoder): JsonResponse
    {
        $validated = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
        ]);

        try {
            $result = $geocoder->reverse((float) $validated['lat'], (float) $validated['lng']);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        } catch (Throwable) {
            return response()->json(['message' => __('inventory.messages.geocode_failed')], 502);
        }

        return response()->json($result);
    }
}
