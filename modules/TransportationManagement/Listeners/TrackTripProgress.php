<?php

namespace Modules\TransportationManagement\Listeners;

use App\Modules\Facades\Modules;
use App\Support\Geo;
use Modules\Tracking\Events\VehiclePositionsRecorded;
use Modules\Tracking\Support\PositionPayload;
use Modules\TransportationManagement\Actions\TripStopTransitions;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripCheckpoint;
use Modules\TransportationManagement\Models\TripStop;

/**
 * Turns raw vehicle telemetry into trip facts: the route trail, the distance
 * covered, and arrival at a planned stop.
 *
 * Lives in Transportation rather than in Tracking because Tracking sits in the
 * Foundation tier and must never know a trip exists. The two meet through an
 * event carrying plain values, which is also why nothing here touches a
 * Tracking model.
 */
class TrackTripProgress
{
    public function __construct(private readonly TripStopTransitions $transitions) {}

    public function handle(VehiclePositionsRecorded $event): void
    {
        // available() is also false during an entitlement downgrade while the
        // data still exists — the module is unreachable by design, so trips
        // simply stop being fed until the tenant upgrades again.
        if (! Modules::available('transportation')) {
            return;
        }

        $byVehicle = $event->byVehicle();

        if ($byVehicle === []) {
            return;
        }

        $trips = Trip::query()
            ->whereIn('vehicle_id', array_keys($byVehicle))
            ->where('status', Trip::STATUS_IN_PROGRESS)
            ->with('stops')
            ->orderByDesc('started_at')
            ->get()
            // A vehicle cannot hold two active trips on one date, but it can
            // across dates; the most recently started one is the live one.
            ->unique('vehicle_id')
            ->keyBy('vehicle_id');

        foreach ($byVehicle as $vehicleId => $positions) {
            $trip = $trips->get($vehicleId);

            if ($trip === null) {
                continue;
            }

            $this->recordTrail($trip, $positions, $event);
            $this->checkGeofences($trip, end($positions), $event->geofenceRadiusM);
        }
    }

    /**
     * Writes the throttled GPS trail and rolls the trip's distance forward.
     *
     * Throttling is what makes the trail a durable archive rather than a copy
     * of the raw position feed: one point per few hundred metres is enough to
     * draw the route and survives the retention window that trims positions.
     *
     * @param  array<int, PositionPayload>  $positions
     */
    private function recordTrail(Trip $trip, array $positions, VehiclePositionsRecorded $event): void
    {
        $last = TripCheckpoint::query()
            ->where('trip_id', $trip->id)
            ->where('source', TripCheckpoint::SOURCE_GPS)
            ->orderByDesc('recorded_at')
            ->first();

        $lastLat = $last?->latitude === null ? null : (float) $last->latitude;
        $lastLng = $last?->longitude === null ? null : (float) $last->longitude;
        $lastAt = $last?->recorded_at;
        $addedMetres = 0.0;

        foreach ($positions as $position) {
            if ($lastLat !== null && $lastLng !== null) {
                $metres = Geo::distanceMetres($lastLat, $lastLng, $position->latitude, $position->longitude);
                $minutes = $lastAt === null ? PHP_INT_MAX : $lastAt->diffInMinutes($position->recordedAt);

                if ($metres < $event->checkpointMinDistanceM && $minutes < $event->checkpointMinIntervalMinutes) {
                    continue;
                }

                // Distance is summed across written checkpoints rather than raw
                // fixes: it then matches the line drawn on the map, and drift
                // while parked never inflates it.
                if ($metres <= config('tracking.max_position_jump_m', 50000)) {
                    $addedMetres += $metres;
                }
            }

            TripCheckpoint::create([
                'trip_id' => $trip->id,
                'source' => TripCheckpoint::SOURCE_GPS,
                'latitude' => $position->latitude,
                'longitude' => $position->longitude,
                'recorded_at' => $position->recordedAt,
            ]);

            $lastLat = $position->latitude;
            $lastLng = $position->longitude;
            $lastAt = $position->recordedAt;
        }

        if ($addedMetres > 0) {
            // A plain save, not a bulk update: Orders observes trip changes and
            // needs the model event. Its handler returns early unless the
            // status changed, so this is inert there.
            $trip->distance_km = round((float) $trip->distance_km + $addedMetres / 1000, 2);
            $trip->save();
        }
    }

    /**
     * Marks the first pending stop the vehicle has reached as arrived.
     *
     * Arrival only — never completion. Completing a dropoff is what tells
     * Orders a delivery order was delivered, which in turn is what makes it
     * billable, and a truck idling at a red light near a warehouse must never
     * silently settle a delivery. Completion stays a human act.
     */
    private function checkGeofences(Trip $trip, PositionPayload $position, int $radiusMetres): void
    {
        $stop = $trip->stops
            ->filter(fn (TripStop $stop) => $stop->status === TripStop::STATUS_PENDING
                && $stop->lat !== null
                && $stop->lng !== null)
            ->sortBy('sequence')
            // Only the first match: a pickup and a dropoff at the same yard
            // would otherwise both flip on a single fix.
            ->first(fn (TripStop $stop) => Geo::isWithin(
                $position->latitude,
                $position->longitude,
                (float) $stop->lat,
                (float) $stop->lng,
                $radiusMetres,
            ));

        if ($stop !== null) {
            $this->transitions->arrive($trip, $stop);
        }
    }
}
