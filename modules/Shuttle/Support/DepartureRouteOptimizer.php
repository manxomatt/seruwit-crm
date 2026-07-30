<?php

namespace Modules\Shuttle\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttleCorridor;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\Shuttle\Models\ShuttleRouteStop;
use RuntimeException;
use Throwable;

class DepartureRouteOptimizer
{
    public function __construct(private readonly NearestNeighbourSequencer $sequencer = new NearestNeighbourSequencer) {}

    /**
     * @return array{total_distance_km: float, stop_count: int, unassigned: list<string>, estimated_duration_minutes: int|null, used_osrm: bool}
     */
    public function optimize(ShuttleDeparture $departure): array
    {
        if (! in_array($departure->status, [
            ShuttleDeparture::STATUS_OPEN,
            ShuttleDeparture::STATUS_LOCKED,
            ShuttleDeparture::STATUS_OPTIMIZED,
        ], true)) {
            throw new RuntimeException(__('shuttle.messages.optimize_invalid_status'));
        }

        return DB::transaction(function () use ($departure): array {
            $departure->routeStops()->delete();

            $departure->load([
                'corridor.originLocation',
                'corridor.destinationLocation',
                'originPool',
                'destinationPool',
                'bookings' => fn ($q) => $q->where('status', ShuttleBooking::STATUS_CONFIRMED),
            ]);

            $serviceType = $departure->resolvedServiceType();
            $originPool = $departure->originPool ?? $departure->corridor?->originLocation;
            $destinationPool = $departure->destinationPool ?? $departure->corridor?->destinationLocation;

            if ($serviceType === ShuttleCorridor::SERVICE_POOL) {
                $ordered = $this->poolOnlyStops($originPool, $destinationPool);

                return $this->persistStops($departure, $ordered, unassigned: [], usedOsrm: false);
            }

            $unassigned = [];
            $pickups = [];
            $dropoffs = [];

            foreach ($departure->bookings as $booking) {
                if ($booking->pickup_mode === ShuttleBooking::MODE_DOOR) {
                    if ($booking->pickup_lat === null || $booking->pickup_lng === null) {
                        $unassigned[] = $booking->booking_number.' (pickup)';
                    } else {
                        $pickups[] = [
                            'key' => 'pickup-'.$booking->id,
                            'lat' => (float) $booking->pickup_lat,
                            'lng' => (float) $booking->pickup_lng,
                            'address' => (string) $booking->pickup_address,
                            'booking_id' => $booking->id,
                            'stop_type' => ShuttleRouteStop::TYPE_PICKUP,
                        ];
                    }
                }

                if ($booking->dropoff_mode === ShuttleBooking::MODE_DOOR) {
                    if ($booking->dropoff_lat === null || $booking->dropoff_lng === null) {
                        $unassigned[] = $booking->booking_number.' (dropoff)';
                    } else {
                        $dropoffs[] = [
                            'key' => 'dropoff-'.$booking->id,
                            'lat' => (float) $booking->dropoff_lat,
                            'lng' => (float) $booking->dropoff_lng,
                            'address' => (string) $booking->dropoff_address,
                            'booking_id' => $booking->id,
                            'stop_type' => ShuttleRouteStop::TYPE_DROPOFF,
                        ];
                    }
                }
            }

            // Door product: pool_origin → door pickups → door dropoffs → pool_destination
            $ordered = [];

            if ($originPool && $originPool->latitude !== null && $originPool->longitude !== null) {
                $ordered[] = [
                    'key' => 'pool-origin',
                    'lat' => (float) $originPool->latitude,
                    'lng' => (float) $originPool->longitude,
                    'address' => $originPool->displayAddress(),
                    'booking_id' => null,
                    'stop_type' => ShuttleRouteStop::TYPE_POOL_ORIGIN,
                ];
            }

            $pickupAnchorLat = $ordered !== []
                ? $ordered[array_key_last($ordered)]['lat']
                : ($pickups[0]['lat'] ?? -6.2);
            $pickupAnchorLng = $ordered !== []
                ? $ordered[array_key_last($ordered)]['lng']
                : ($pickups[0]['lng'] ?? 106.8);

            foreach ($this->sequencer->sequence($pickupAnchorLat, $pickupAnchorLng, $pickups) as $stop) {
                $ordered[] = $stop;
            }

            $dropAnchorLat = $ordered !== []
                ? $ordered[array_key_last($ordered)]['lat']
                : ($destinationPool?->latitude !== null ? (float) $destinationPool->latitude : $pickupAnchorLat);
            $dropAnchorLng = $ordered !== []
                ? $ordered[array_key_last($ordered)]['lng']
                : ($destinationPool?->longitude !== null ? (float) $destinationPool->longitude : $pickupAnchorLng);

            foreach ($this->sequencer->sequence($dropAnchorLat, $dropAnchorLng, $dropoffs) as $stop) {
                $ordered[] = $stop;
            }

            if ($destinationPool && $destinationPool->latitude !== null && $destinationPool->longitude !== null) {
                $ordered[] = [
                    'key' => 'pool-destination',
                    'lat' => (float) $destinationPool->latitude,
                    'lng' => (float) $destinationPool->longitude,
                    'address' => $destinationPool->displayAddress(),
                    'booking_id' => null,
                    'stop_type' => ShuttleRouteStop::TYPE_POOL_DESTINATION,
                ];
            }

            $osrmLegs = $this->osrmLegsFor($ordered);

            return $this->persistStops($departure, $ordered, $unassigned, $osrmLegs !== null, $osrmLegs);
        });
    }

    /**
     * @return list<array{key: string, lat: float, lng: float, address: string, booking_id: null, stop_type: string}>
     */
    private function poolOnlyStops(mixed $originPool, mixed $destinationPool): array
    {
        $ordered = [];

        if ($originPool && $originPool->latitude !== null && $originPool->longitude !== null) {
            $ordered[] = [
                'key' => 'pool-origin',
                'lat' => (float) $originPool->latitude,
                'lng' => (float) $originPool->longitude,
                'address' => $originPool->displayAddress(),
                'booking_id' => null,
                'stop_type' => ShuttleRouteStop::TYPE_POOL_ORIGIN,
            ];
        }

        if ($destinationPool && $destinationPool->latitude !== null && $destinationPool->longitude !== null) {
            $ordered[] = [
                'key' => 'pool-destination',
                'lat' => (float) $destinationPool->latitude,
                'lng' => (float) $destinationPool->longitude,
                'address' => $destinationPool->displayAddress(),
                'booking_id' => null,
                'stop_type' => ShuttleRouteStop::TYPE_POOL_DESTINATION,
            ];
        }

        return $ordered;
    }

    /**
     * @param  list<array{lat: float, lng: float, address: string, booking_id: int|null, stop_type: string}>  $ordered
     * @param  list<string>  $unassigned
     * @param  list<array{distance_m: float, duration_s: float}>|null  $osrmLegs
     * @return array{total_distance_km: float, stop_count: int, unassigned: list<string>, estimated_duration_minutes: int|null, used_osrm: bool}
     */
    private function persistStops(
        ShuttleDeparture $departure,
        array $ordered,
        array $unassigned,
        bool $usedOsrm,
        ?array $osrmLegs = null,
    ): array {
        if ($usedOsrm && $osrmLegs === null) {
            $osrmLegs = $this->osrmLegsFor($ordered);
            $usedOsrm = $osrmLegs !== null;
        }

        $totalDistance = 0.0;
        $totalDuration = 0;
        $prevLat = null;
        $prevLng = null;
        $sequence = 1;
        $cursor = $this->departureStartAt($departure);

        foreach ($ordered as $index => $stop) {
            $legKm = 0.0;
            $legSeconds = 0;

            if ($prevLat !== null && $prevLng !== null) {
                if ($usedOsrm && isset($osrmLegs[$index - 1])) {
                    $legKm = round($osrmLegs[$index - 1]['distance_m'] / 1000, 2);
                    $legSeconds = (int) round($osrmLegs[$index - 1]['duration_s']);
                } else {
                    $legKm = round(Haversine::distanceKm($prevLat, $prevLng, $stop['lat'], $stop['lng']), 2);
                    $legSeconds = (int) round(($legKm / 40) * 3600);
                }
                $totalDistance += $legKm;
                $totalDuration += $legSeconds;
                $cursor = $cursor->copy()->addSeconds($legSeconds);
            }

            $departure->routeStops()->create([
                'booking_id' => $stop['booking_id'],
                'stop_type' => $stop['stop_type'],
                'sequence' => $sequence++,
                'address' => $stop['address'],
                'lat' => $stop['lat'],
                'lng' => $stop['lng'],
                'eta_at' => $cursor,
                'distance_from_previous_km' => $legKm,
                'duration_from_previous_seconds' => $legSeconds,
                'status' => ShuttleRouteStop::STATUS_PENDING,
            ]);

            $prevLat = $stop['lat'];
            $prevLng = $stop['lng'];
        }

        $estimatedMinutes = $ordered === [] ? null : (int) max(1, (int) ceil($totalDuration / 60));

        $departure->update([
            'status' => ShuttleDeparture::STATUS_OPTIMIZED,
            'optimized_at' => now(),
            'estimated_distance_km' => round($totalDistance, 2),
            'estimated_duration_minutes' => $estimatedMinutes,
        ]);

        return [
            'total_distance_km' => round($totalDistance, 2),
            'stop_count' => count($ordered),
            'unassigned' => $unassigned,
            'estimated_duration_minutes' => $estimatedMinutes,
            'used_osrm' => $usedOsrm,
        ];
    }

    /**
     * @param  list<array{lat: float, lng: float}>  $ordered
     * @return list<array{distance_m: float, duration_s: float}>|null
     */
    private function osrmLegsFor(array $ordered): ?array
    {
        if (count($ordered) < 2 || ! class_exists(\Modules\TransportationManagement\Support\OsrmRouter::class)) {
            return null;
        }

        try {
            $waypoints = array_map(fn (array $stop): array => [$stop['lat'], $stop['lng']], $ordered);
            $detailed = app(\Modules\TransportationManagement\Support\OsrmRouter::class)
                ->drivingRouteDetailed($waypoints);

            if (count($detailed['legs']) !== count($ordered) - 1) {
                return null;
            }

            return $detailed['legs'];
        } catch (Throwable) {
            return null;
        }
    }

    private function departureStartAt(ShuttleDeparture $departure): Carbon
    {
        $date = $departure->depart_date?->toDateString() ?? now()->toDateString();
        $time = substr((string) $departure->depart_time, 0, 8);

        return Carbon::parse($date.' '.$time);
    }
}
