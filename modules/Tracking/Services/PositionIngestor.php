<?php

namespace Modules\Tracking\Services;

use App\Support\Geo;
use Illuminate\Support\Facades\Log;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Events\VehiclePositionsRecorded;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Models\VehiclePosition;
use Modules\Tracking\Support\PositionPayload;

/**
 * Turns one Traccar poll into stored positions, refreshed device state and
 * updated odometers, then announces what landed.
 */
class PositionIngestor
{
    public function __construct(private readonly TraccarClient $client) {}

    public static function for(TrackingConfig $config): self
    {
        return new self(new TraccarClient($config));
    }

    /**
     * Pulls the latest fixes and records them. Returns how many new positions
     * were stored, for the command's output.
     */
    public function ingest(TrackingConfig $config): int
    {
        $payloads = collect($this->client->latestPositions())
            ->map(fn (array $row) => PositionPayload::fromTraccar($row))
            ->filter()
            ->values();

        // Unpaired devices are loaded too: their last fix still updates, which
        // is what lets the pairing screen show live candidates.
        $devices = GpsDevice::query()->get()->keyBy('traccar_device_id');

        $fresh = $payloads->filter(function (PositionPayload $payload) use ($devices) {
            $device = $devices->get($payload->traccarDeviceId);

            if ($device === null) {
                return false;
            }

            // A parked vehicle re-reports the same fix every minute; skipping
            // it here keeps the common case down to zero writes.
            return $device->last_recorded_at === null
                || $payload->recordedAt->gt($device->last_recorded_at);
        })->values();

        if ($fresh->isEmpty()) {
            $config->forceFill(['last_polled_at' => now(), 'last_poll_error' => null])->save();

            return 0;
        }

        $rows = $fresh->map(function (PositionPayload $payload) use ($devices) {
            $device = $devices->get($payload->traccarDeviceId);

            return $payload->toRow($device->id, $device->vehicle_id);
        })->all();

        // Idempotency comes from the (gps_device_id, recorded_at) unique index,
        // so a replayed poll or a retried HTTP call writes nothing twice.
        VehiclePosition::insertOrIgnore($rows);

        foreach ($fresh->groupBy(fn (PositionPayload $payload) => $payload->traccarDeviceId) as $traccarId => $group) {
            $this->applyToDevice($devices->get($traccarId), $group->last(), $group);
        }

        $config->forceFill(['last_polled_at' => now(), 'last_poll_error' => null])->save();

        VehiclePositionsRecorded::dispatch(
            $fresh->all(),
            $devices->filter(fn (GpsDevice $device) => $device->vehicle_id !== null)
                ->mapWithKeys(fn (GpsDevice $device) => [$device->traccar_device_id => $device->vehicle_id])
                ->all(),
            $config->geofence_radius_m,
            $config->checkpoint_min_distance_m,
            $config->checkpoint_min_interval_minutes,
        );

        return $fresh->count();
    }

    /**
     * Refreshes a device's denormalized last fix and rolls its odometer
     * forward.
     *
     * @param  \Illuminate\Support\Collection<int, PositionPayload>  $group
     */
    private function applyToDevice(GpsDevice $device, PositionPayload $latest, $group): void
    {
        $travelled = $this->distanceTravelled($device, $group);

        $device->forceFill([
            'last_latitude' => $latest->latitude,
            'last_longitude' => $latest->longitude,
            'last_speed_kph' => $latest->speedKph,
            'last_course' => $latest->course,
            'last_recorded_at' => $latest->recordedAt,
            'last_seen_at' => now(),
            'last_polled_at' => now(),
            'traccar_total_distance_m' => $latest->totalDistanceM ?? $device->traccar_total_distance_m,
            'accumulated_distance_m' => $device->accumulated_distance_m + $travelled,
        ])->save();

        $this->syncOdometer($device);
    }

    /**
     * Metres covered since the previous poll, in whole metres.
     *
     * Traccar keeps its own per-device odometer, which is more trustworthy than
     * anything derived from two sampled points, so it is preferred whenever it
     * is present and moving forward. A device reset zeroes that counter, which
     * shows up as a backwards value and falls through to haversine.
     *
     * @param  \Illuminate\Support\Collection<int, PositionPayload>  $group
     */
    private function distanceTravelled(GpsDevice $device, $group): int
    {
        $latest = $group->last();

        $delta = null;

        if ($latest->totalDistanceM !== null
            && $device->traccar_total_distance_m !== null
            && $latest->totalDistanceM >= $device->traccar_total_distance_m) {
            $delta = $latest->totalDistanceM - $device->traccar_total_distance_m;
        }

        if ($delta === null) {
            $delta = $this->haversineDelta($device, $group);
        }

        $max = (int) config('tracking.max_position_jump_m', 50000);

        if ($delta > $max) {
            Log::warning('Discarded an implausible GPS distance jump.', [
                'gps_device_id' => $device->id,
                'metres' => $delta,
            ]);

            return 0;
        }

        // Drift while parked: a stationary vehicle wanders a few metres between
        // fixes, which would otherwise accrue kilometres overnight.
        return $delta < (int) config('tracking.min_odometer_delta_m', 20) ? 0 : $delta;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, PositionPayload>  $group
     */
    private function haversineDelta(GpsDevice $device, $group): int
    {
        $lat = $device->last_latitude !== null ? (float) $device->last_latitude : null;
        $lng = $device->last_longitude !== null ? (float) $device->last_longitude : null;
        $metres = 0.0;

        foreach ($group as $payload) {
            if ($lat !== null && $lng !== null) {
                $metres += Geo::distanceMetres($lat, $lng, $payload->latitude, $payload->longitude);
            }

            $lat = $payload->latitude;
            $lng = $payload->longitude;
        }

        return (int) round($metres);
    }

    /**
     * Writes the device's implied reading onto its vehicle, but only when the
     * whole-kilometre value actually changed — otherwise this would issue 1,440
     * no-op updates per vehicle per day.
     */
    private function syncOdometer(GpsDevice $device): void
    {
        if ($device->vehicle_id === null) {
            return;
        }

        $vehicle = Vehicle::find($device->vehicle_id);

        if ($vehicle === null) {
            return;
        }

        $implied = $device->impliedOdometerKm();

        if ($implied > $vehicle->odometer_km) {
            $vehicle->forceFill(['odometer_km' => $implied])->save();
        }
    }
}
