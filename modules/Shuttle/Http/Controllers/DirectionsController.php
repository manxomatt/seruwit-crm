<?php

namespace Modules\Shuttle\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;
use Throwable;

/**
 * Soft OSRM proxy for Shuttle maps — works even when Transportation/Routing
 * modules are not the active vertical for this tenant.
 */
class DirectionsController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'points' => ['required', 'string', 'max:4000'],
        ]);

        $waypoints = $this->parsePoints($validated['points']);

        if (count($waypoints) < 2) {
            return response()->json([
                'message' => __('shuttle.messages.directions_need_points'),
            ], 422);
        }

        if (! class_exists(\Modules\TransportationManagement\Support\OsrmRouter::class)) {
            return response()->json([
                'coordinates' => $waypoints,
                'following_roads' => false,
                'distance_m' => 0,
                'duration_s' => 0,
            ]);
        }

        try {
            $detailed = app(\Modules\TransportationManagement\Support\OsrmRouter::class)
                ->drivingRouteDetailed($waypoints);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        } catch (Throwable) {
            return response()->json([
                'message' => __('shuttle.messages.directions_failed'),
            ], 502);
        }

        return response()->json([
            'coordinates' => $detailed['coordinates'],
            'following_roads' => $detailed['coordinates'] !== [],
            'distance_m' => $detailed['distance_m'],
            'duration_s' => $detailed['duration_s'],
        ]);
    }

    /**
     * @return list<array{0: float, 1: float}>
     */
    private function parsePoints(string $points): array
    {
        $waypoints = [];

        foreach (explode('|', $points) as $pair) {
            $parts = array_map('trim', explode(',', $pair));

            if (count($parts) !== 2) {
                continue;
            }

            $lat = (float) $parts[0];
            $lng = (float) $parts[1];

            if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
                continue;
            }

            $waypoints[] = [$lat, $lng];
        }

        return $waypoints;
    }
}
