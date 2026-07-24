<?php

namespace Modules\DriverScoring\Support;

use Modules\DriverScoring\Models\DriverScoringSetting;
use Modules\DriverScoring\Models\DrivingEvent;
use Modules\Tracking\Models\VehiclePosition;
use Modules\Tracking\Support\PositionPayload;

/**
 * Persists detected events (with dedupe) and updates daily scores.
 */
class DrivingEventRecorder
{
    public function __construct(
        private readonly DrivingEventDetector $detector,
        private readonly DriverScoreAggregator $aggregator,
        private readonly ActiveDriverResolver $drivers,
    ) {}

    /**
     * @param  list<PositionPayload>  $positions
     * @return list<DrivingEvent>
     */
    public function processVehicle(
        int $vehicleId,
        array $positions,
        DriverScoringSetting $settings,
        ?int $gpsDeviceId = null,
    ): array {
        if ($positions === []) {
            return [];
        }

        $attribution = $this->drivers->forVehicle($vehicleId);
        if ($attribution['driver_id'] === null) {
            return [];
        }

        $previous = $this->previousPayload($vehicleId, $positions[0]);
        $detected = $this->detector->detect($positions, $settings, $previous);
        $saved = [];

        foreach ($detected as $event) {
            if ($this->isDuplicate($vehicleId, $event['type'], $event['recorded_at'], $settings)) {
                continue;
            }

            $row = DrivingEvent::query()->create([
                'vehicle_id' => $vehicleId,
                'driver_id' => $attribution['driver_id'],
                'gps_device_id' => $gpsDeviceId,
                'trip_id' => $attribution['trip_id'],
                'type' => $event['type'],
                'severity' => $event['severity'],
                'magnitude' => $event['magnitude'],
                'speed_kph' => $event['speed_kph'],
                'latitude' => $event['latitude'],
                'longitude' => $event['longitude'],
                'points_delta' => $event['points_delta'],
                'recorded_at' => $event['recorded_at'],
                'ended_at' => $event['ended_at'],
                'meta' => $event['meta'],
            ]);

            $this->aggregator->applyEvent($row, $settings);
            $saved[] = $row;
        }

        return $saved;
    }

    /**
     * @param  array{type: string, recorded_at: \Carbon\CarbonImmutable}  $event
     */
    private function isDuplicate(int $vehicleId, string $type, $recordedAt, DriverScoringSetting $settings): bool
    {
        $window = (int) $settings->event_dedupe_seconds;

        return DrivingEvent::query()
            ->where('vehicle_id', $vehicleId)
            ->where('type', $type)
            ->whereBetween('recorded_at', [
                $recordedAt->copy()->subSeconds($window),
                $recordedAt->copy()->addSeconds($window),
            ])
            ->exists();
    }

    private function previousPayload(int $vehicleId, PositionPayload $first): ?PositionPayload
    {
        if (! class_exists(VehiclePosition::class)) {
            return null;
        }

        $row = VehiclePosition::query()
            ->where('vehicle_id', $vehicleId)
            ->where('recorded_at', '<', $first->recordedAt)
            ->orderByDesc('recorded_at')
            ->first();

        if ($row === null) {
            return null;
        }

        return new PositionPayload(
            traccarDeviceId: (int) ($row->gps_device_id ?? 0),
            latitude: (float) $row->latitude,
            longitude: (float) $row->longitude,
            speedKph: (float) $row->speed_kph,
            course: $row->course !== null ? (float) $row->course : null,
            altitude: $row->altitude !== null ? (float) $row->altitude : null,
            ignition: $row->ignition,
            motion: $row->motion,
            totalDistanceM: $row->total_distance_m !== null ? (int) $row->total_distance_m : null,
            recordedAt: $row->recorded_at->toImmutable(),
            serverTime: $row->server_time?->toImmutable(),
            attributes: is_array($row->attributes) ? $row->attributes : null,
        );
    }
}
