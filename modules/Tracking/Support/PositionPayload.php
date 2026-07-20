<?php

namespace Modules\Tracking\Support;

use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;

/**
 * One Traccar position row, normalised into the shapes this application stores
 * and reasons about. Kept as a plain value object so it can travel to other
 * modules in an event without dragging Eloquent models across a module
 * boundary.
 */
class PositionPayload
{
    /**
     * Traccar reports speed in knots. Forgetting this conversion under-reports
     * every speed by 46% — a number that still looks entirely plausible on
     * screen, which is exactly why it would never be spotted by eye.
     */
    public const KNOTS_TO_KPH = 1.852;

    /**
     * @param  array<string, mixed>|null  $attributes
     */
    public function __construct(
        public readonly int $traccarDeviceId,
        public readonly float $latitude,
        public readonly float $longitude,
        public readonly float $speedKph,
        public readonly ?float $course,
        public readonly ?float $altitude,
        public readonly ?bool $ignition,
        public readonly ?bool $motion,
        public readonly ?int $totalDistanceM,
        public readonly CarbonImmutable $recordedAt,
        public readonly ?CarbonImmutable $serverTime,
        public readonly ?array $attributes,
    ) {}

    /**
     * Builds a payload from a raw Traccar row, or null when the fix is not
     * usable. Rejecting here rather than downstream keeps every consumer free
     * of "is this coordinate real" checks.
     *
     * @param  array<string, mixed>  $row
     */
    public static function fromTraccar(array $row): ?self
    {
        $deviceId = Arr::get($row, 'deviceId');
        $latitude = Arr::get($row, 'latitude');
        $longitude = Arr::get($row, 'longitude');

        if (! is_numeric($deviceId) || ! is_numeric($latitude) || ! is_numeric($longitude)) {
            return null;
        }

        // Traccar flags a fix it does not trust; a device with no satellite
        // lock reports 0,0, which is a real coordinate in the Atlantic and
        // would otherwise draw a line from Jakarta to the Gulf of Guinea.
        if (Arr::get($row, 'valid') === false) {
            return null;
        }

        $latitude = (float) $latitude;
        $longitude = (float) $longitude;

        if (abs($latitude) > 90 || abs($longitude) > 180) {
            return null;
        }

        if ($latitude === 0.0 && $longitude === 0.0) {
            return null;
        }

        $recordedAt = self::parseTime(
            Arr::get($row, 'fixTime')
            ?? Arr::get($row, 'deviceTime')
            ?? Arr::get($row, 'serverTime')
        );

        if ($recordedAt === null) {
            return null;
        }

        // recorded_at is device-reported and half of the dedupe unique key, so
        // a tracker with a broken clock could otherwise write a row dated years
        // ahead that nothing can ever supersede.
        if ($recordedAt->isAfter(now()->addMinutes((int) config('tracking.max_future_fix_minutes', 10)))) {
            return null;
        }

        $attributes = Arr::get($row, 'attributes');
        $attributes = is_array($attributes) ? $attributes : null;

        $totalDistance = Arr::get($attributes ?? [], 'totalDistance');

        return new self(
            traccarDeviceId: (int) $deviceId,
            latitude: $latitude,
            longitude: $longitude,
            speedKph: round(((float) (Arr::get($row, 'speed') ?? 0)) * self::KNOTS_TO_KPH, 2),
            course: is_numeric(Arr::get($row, 'course')) ? (float) $row['course'] : null,
            altitude: is_numeric(Arr::get($row, 'altitude')) ? (float) $row['altitude'] : null,
            ignition: self::parseBool(Arr::get($attributes ?? [], 'ignition')),
            motion: self::parseBool(Arr::get($attributes ?? [], 'motion')),
            totalDistanceM: is_numeric($totalDistance) ? (int) round((float) $totalDistance) : null,
            recordedAt: $recordedAt,
            serverTime: self::parseTime(Arr::get($row, 'serverTime')),
            attributes: $attributes,
        );
    }

    /**
     * The row shape used for the batched insert.
     *
     * @return array<string, mixed>
     */
    public function toRow(int $deviceId, ?int $vehicleId): array
    {
        return [
            'gps_device_id' => $deviceId,
            'vehicle_id' => $vehicleId,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'speed_kph' => $this->speedKph,
            'course' => $this->course,
            'altitude' => $this->altitude,
            'ignition' => $this->ignition,
            'motion' => $this->motion,
            'total_distance_m' => $this->totalDistanceM,
            'recorded_at' => $this->recordedAt->toDateTimeString(),
            'server_time' => $this->serverTime?->toDateTimeString(),
            'attributes' => $this->attributes === null ? null : json_encode($this->attributes),
            'created_at' => now()->toDateTimeString(),
        ];
    }

    private static function parseTime(mixed $value): ?CarbonImmutable
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        try {
            return CarbonImmutable::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private static function parseBool(mixed $value): ?bool
    {
        return $value === null ? null : filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }
}
