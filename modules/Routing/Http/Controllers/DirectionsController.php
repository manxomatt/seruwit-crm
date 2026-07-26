<?php

namespace Modules\Routing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\TransportationManagement\Support\OsrmRouter;
use RuntimeException;
use Throwable;

/**
 * Same OSRM proxy as Transportation, exposed under routing.* so plan pages
 * do not require the transportation.view permission.
 */
class DirectionsController extends Controller
{
    public function __invoke(Request $request, OsrmRouter $router): JsonResponse
    {
        $validated = $request->validate([
            'points' => ['required', 'string', 'max:4000'],
        ]);

        $waypoints = $this->parsePoints($validated['points']);

        if (count($waypoints) < 2) {
            return response()->json([
                'message' => __('routing.messages.directions_need_points'),
            ], 422);
        }

        try {
            $coordinates = $router->drivingRoute($waypoints);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        } catch (Throwable) {
            return response()->json([
                'message' => __('routing.messages.directions_failed'),
            ], 502);
        }

        return response()->json([
            'coordinates' => $coordinates,
            'following_roads' => true,
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
