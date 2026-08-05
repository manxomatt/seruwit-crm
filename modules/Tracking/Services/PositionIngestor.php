<?php

namespace Modules\Tracking\Services;

use App\Support\Geo;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Events\VehiclePositionsRecorded;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\GpsSource;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Models\VehiclePosition;
use Modules\Tracking\Support\PositionPayload;

/**
 * Turns one GPS source poll into stored positions, refreshed device state and
 * updated odometers, then announces what landed.
 */
class PositionIngestor
{
    public function __construct(
        private readonly GpsSource $source,
        private readonly TrackingConfig $settings,
        private readonly GpsProviderFactory $providers = new GpsProviderFactory,
    ) {}

    public static function for(GpsSource $source, ?TrackingConfig $settings = null): self
    {
        return new self($source, $settings ?? TrackingConfig::current());
    }

    /**
     * Pulls the latest fixes and records them. Returns how many new positions
     * were stored, for the command's output.
     */
    public function ingest(): int
    {
        $payloads = $this->latestPayloads();

        $devices = GpsDevice::query()
            ->where('gps_source_id', $this->source->id)
            ->get()
            ->keyBy('external_device_id');

        $fresh = $payloads->filter(function (PositionPayload $payload) use ($devices) {
            $device = $devices->get($payload->externalDeviceId);

            if ($device === null) {
                return false;
            }

            return $device->last_recorded_at === null
                || $payload->recordedAt->gt($device->last_recorded_at);
        })->values();

        if ($fresh->isEmpty()) {
            $this->source->forceFill(['last_polled_at' => now(), 'last_poll_error' => null])->save();

            return 0;
        }

        $rows = $fresh->map(function (PositionPayload $payload) use ($devices) {
            $device = $devices->get($payload->externalDeviceId);

            return $payload->toRow($device->id, $device->vehicle_id);
        })->all();

        VehiclePosition::insertOrIgnore($rows);

        foreach ($fresh->groupBy(fn (PositionPayload $payload) => $payload->externalDeviceId) as $externalId => $group) {
            $this->applyToDevice($devices->get($externalId), $group->last(), $group);
        }

        $this->source->forceFill(['last_polled_at' => now(), 'last_poll_error' => null])->save();

        VehiclePositionsRecorded::dispatch(
            $fresh->all(),
            $devices->filter(fn (GpsDevice $device) => $device->vehicle_id !== null)
                ->mapWithKeys(fn (GpsDevice $device) => [$device->external_device_id => $device->vehicle_id])
                ->all(),
            $this->settings->geofence_radius_m,
            $this->settings->checkpoint_min_distance_m,
            $this->settings->checkpoint_min_interval_minutes,
        );

        return $fresh->count();
    }

    /**
     * @return Collection<int, PositionPayload>
     */
    private function latestPayloads(): Collection
    {
        $rows = $this->providers->make($this->source)->latestPositions();

        $mapper = match (true) {
            $this->source->usesSkyTrack() => fn (array $row) => PositionPayload::fromSkyTrack($row),
            $this->source->usesGpsServer() => fn (array $row) => PositionPayload::fromGpsServer($row),
            default => fn (array $row) => PositionPayload::fromTraccar($row),
        };

        return collect($rows)->map($mapper)->filter()->values();
    }

    /**
     * @param  Collection<int, PositionPayload>  $group
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
            'provider_total_distance_m' => $latest->totalDistanceM ?? $device->provider_total_distance_m,
            'accumulated_distance_m' => $device->accumulated_distance_m + $travelled,
        ])->save();

        $this->syncOdometer($device);
    }

    /**
     * @param  Collection<int, PositionPayload>  $group
     */
    private function distanceTravelled(GpsDevice $device, $group): int
    {
        $latest = $group->last();

        $delta = null;

        if ($latest->totalDistanceM !== null
            && $device->provider_total_distance_m !== null
            && $latest->totalDistanceM >= $device->provider_total_distance_m) {
            $delta = $latest->totalDistanceM - $device->provider_total_distance_m;
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

        return $delta < (int) config('tracking.min_odometer_delta_m', 20) ? 0 : $delta;
    }

    /**
     * @param  Collection<int, PositionPayload>  $group
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
