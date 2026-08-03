<?php

namespace Modules\Tracking\Support;

use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;

/**
 * One GPS provider position row, normalised into the shapes this application
 * stores and reasons about. Kept as a plain value object so it can travel to
 * other modules in an event without dragging Eloquent models across a module
 * boundary.
 *
 * `traccarDeviceId` is the local provider key: Traccar's device id, or a
 * numeric IMEI from Sky Track / GPS-Server (stored the same way on gps_devices).
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

        $latitude = (float) $latitude;
        $longitude = (float) $longitude;

        if (abs($latitude) > 90 || abs($longitude) > 180) {
            return null;
        }

        // Null island: a device with no satellite lock reports 0,0, a real
        // coordinate in the Atlantic that would otherwise draw a line from
        // Jakarta to the Gulf of Guinea. Traccar's own `valid` flag is
        // deliberately NOT used to reject here — a parked vehicle reports
        // valid=false with its last-known coordinates, and dropping those would
        // hide most of a fleet most of the time.
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
     * Builds a payload from a Sky Track `/api/tracking/objects` row, or null
     * when the fix is not usable. Speed is already km/h; IMEI is the device key.
     *
     * @param  array<string, mixed>  $row
     */
    public static function fromSkyTrack(array $row): ?self
    {
        $imei = trim((string) Arr::get($row, 'imei', ''));

        if ($imei === '' || ! ctype_digit($imei)) {
            return null;
        }

        $data = Arr::get($row, 'data');
        $data = is_array($data) ? $data : [];

        $latitude = Arr::get($data, 'lat');
        $longitude = Arr::get($data, 'lng');

        if (! is_numeric($latitude) || ! is_numeric($longitude)) {
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

        $recordedAt = self::parseSkyTrackTime(
            Arr::get($data, 'dt_tracker')
            ?? Arr::get($data, 'dt_server')
        );

        if ($recordedAt === null) {
            return null;
        }

        if ($recordedAt->isAfter(now()->addMinutes((int) config('tracking.max_future_fix_minutes', 10)))) {
            return null;
        }

        $params = Arr::get($data, 'params');
        $params = is_array($params) ? $params : null;

        $totalDistance = Arr::get($params ?? [], 'totalDistance');

        return new self(
            traccarDeviceId: (int) $imei,
            latitude: $latitude,
            longitude: $longitude,
            speedKph: round((float) (Arr::get($data, 'speed') ?? 0), 2),
            course: is_numeric(Arr::get($data, 'angle')) ? (float) $data['angle'] : null,
            altitude: is_numeric(Arr::get($data, 'altitude')) ? (float) $data['altitude'] : null,
            ignition: self::parseBool(Arr::get($params ?? [], 'acc')),
            motion: self::parseBool(Arr::get($params ?? [], 'motion')),
            totalDistanceM: is_numeric($totalDistance) ? (int) round((float) $totalDistance) : null,
            recordedAt: $recordedAt,
            serverTime: self::parseSkyTrackTime(Arr::get($data, 'dt_server')),
            attributes: $params,
        );
    }

    /**
     * Builds a payload from a GPS-Server `USER_GET_OBJECTS` row, or null when
     * the fix is not usable. Speed is already km/h; IMEI is the device key;
     * odometer is kilometres and is converted to metres for distance tracking.
     *
     * @param  array<string, mixed>  $row
     */
    public static function fromGpsServer(array $row): ?self
    {
        $imei = trim((string) Arr::get($row, 'imei', ''));

        if ($imei === '' || ! ctype_digit($imei)) {
            return null;
        }

        $latitude = Arr::get($row, 'lat');
        $longitude = Arr::get($row, 'lng');

        if (! is_numeric($latitude) || ! is_numeric($longitude)) {
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

        $recordedAt = self::parseGpsServerTime(
            Arr::get($row, 'dt_tracker')
            ?? Arr::get($row, 'dt_server')
        );

        if ($recordedAt === null) {
            return null;
        }

        if ($recordedAt->isAfter(now()->addMinutes((int) config('tracking.max_future_fix_minutes', 10)))) {
            return null;
        }

        $params = Arr::get($row, 'params');
        $params = is_array($params) ? $params : null;

        $odometerKm = Arr::get($row, 'odometer');
        $totalDistanceM = is_numeric($odometerKm)
            ? (int) round(((float) $odometerKm) * 1000)
            : null;

        return new self(
            traccarDeviceId: (int) $imei,
            latitude: $latitude,
            longitude: $longitude,
            speedKph: round((float) (Arr::get($row, 'speed') ?? 0), 2),
            course: is_numeric(Arr::get($row, 'angle')) ? (float) $row['angle'] : null,
            altitude: is_numeric(Arr::get($row, 'altitude')) ? (float) $row['altitude'] : null,
            ignition: self::parseBool(Arr::get($params ?? [], 'acc')),
            motion: self::parseBool(Arr::get($params ?? [], 'track') ?? Arr::get($params ?? [], 'motion')),
            totalDistanceM: $totalDistanceM,
            recordedAt: $recordedAt,
            serverTime: self::parseGpsServerTime(Arr::get($row, 'dt_server')),
            attributes: $params,
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

    /**
     * Sky Track emits naive local datetimes. Parse them in the configured
     * Sky Track zone, then convert into the app timezone for storage/compare.
     */
    private static function parseSkyTrackTime(mixed $value): ?CarbonImmutable
    {
        return self::parseNaiveProviderTime(
            $value,
            (string) config('tracking.sky_track_timezone', 'Asia/Jakarta'),
        );
    }

    /**
     * GPS-Server also emits naive local datetimes (typically Asia/Jakarta).
     */
    private static function parseGpsServerTime(mixed $value): ?CarbonImmutable
    {
        return self::parseNaiveProviderTime(
            $value,
            (string) config('tracking.gps_server_timezone', 'Asia/Jakarta'),
        );
    }

    private static function parseNaiveProviderTime(mixed $value, string $timezone): ?CarbonImmutable
    {
        if (! is_string($value) || $value === '' || str_starts_with($value, '0000-00-00')) {
            return null;
        }

        try {
            return CarbonImmutable::parse($value, $timezone)
                ->timezone((string) config('app.timezone', 'UTC'));
        } catch (\Throwable) {
            return null;
        }
    }

    private static function parseBool(mixed $value): ?bool
    {
        return $value === null ? null : filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }
}
