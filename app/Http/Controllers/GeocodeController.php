<?php

namespace App\Http\Controllers;

use App\Support\NominatimGeocoder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            return response()->json(['message' => __('common.geocode.failed')], 502);
        }

        return response()->json($result);
    }

    public function forward(Request $request, NominatimGeocoder $geocoder): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:255'],
        ]);

        try {
            $result = $geocoder->forward($validated['q']);
            if (! $result) {
                return response()->json(['message' => __('common.geocode.not_found')], 404);
            }

            return response()->json($result);
        } catch (Throwable) {
            return response()->json(['message' => __('common.geocode.failed')], 502);
        }
    }
}
