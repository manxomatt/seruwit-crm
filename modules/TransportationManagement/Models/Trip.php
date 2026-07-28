<?php

namespace Modules\TransportationManagement\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\TransportationManagement\Database\Factories\TripFactory;

class Trip extends Model
{
    /** @use HasFactory<TripFactory> */
    use HasFactory;

    public const STATUS_SCHEDULED = 'scheduled';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    /** Default planned window when no end time / duration / distance is given. */
    public const DEFAULT_DURATION_MINUTES = 480;

    /** Assumed average speed (km/h) when estimating end from distance. */
    public const ESTIMATE_SPEED_KPH = 40;

    /** Buffer minutes added on top of travel time estimates (loading / stops). */
    public const ESTIMATE_BUFFER_MINUTES = 60;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return TripFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'trip_schedule_id',
        'vehicle_id',
        'driver_id',
        'partner_id',
        'origin',
        'destination',
        'cargo_notes',
        'scheduled_at',
        'scheduled_end_at',
        'started_at',
        'completed_at',
        'distance_km',
        'status',
        'cancelled_reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'scheduled_end_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'distance_km' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Vehicle, $this>
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * @return BelongsTo<Driver, $this>
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /**
     * @return BelongsTo<Partner, $this>
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * @return HasMany<TripCheckpoint, $this>
     */
    public function checkpoints(): HasMany
    {
        return $this->hasMany(TripCheckpoint::class)->orderBy('recorded_at');
    }

    /**
     * The cargo manifest for this trip.
     *
     * @return HasMany<TripItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(TripItem::class)->orderBy('id');
    }

    /**
     * The route's ordered pickup/dropoff stops. Optional fine-grained detail;
     * origin/destination remain the coarse route summary.
     *
     * @return HasMany<TripStop, $this>
     */
    public function stops(): HasMany
    {
        return $this->hasMany(TripStop::class)->orderBy('sequence');
    }

    /**
     * The recurring template this trip was generated from, if any. Null for
     * trips dispatched one-off.
     *
     * @return BelongsTo<TripSchedule, $this>
     */
    public function tripSchedule(): BelongsTo
    {
        return $this->belongsTo(TripSchedule::class);
    }

    /**
     * Generates the next sequential human-readable trip code, e.g. TRIP-000001.
     * Not safe against a race between two simultaneous store requests, but
     * dispatch creation is a low-frequency, single-operator action here.
     */
    public static function nextCode(): string
    {
        $lastNumber = (int) static::query()
            ->orderByDesc('id')
            ->value('id');

        return sprintf('TRIP-%06d', $lastNumber + 1);
    }

    /**
     * Estimate a planned end time from start + optional duration or distance.
     */
    public static function estimateEndAt(
        \DateTimeInterface|string $startsAt,
        ?float $distanceKm = null,
        ?int $durationMinutes = null,
    ): \Illuminate\Support\Carbon {
        $start = \Illuminate\Support\Carbon::parse($startsAt);

        if ($durationMinutes !== null) {
            return $start->copy()->addMinutes(max(1, $durationMinutes));
        }

        if ($distanceKm !== null && $distanceKm > 0) {
            $travelMinutes = (int) round(($distanceKm / self::ESTIMATE_SPEED_KPH) * 60);
            $minutes = max(60, $travelMinutes + self::ESTIMATE_BUFFER_MINUTES);

            return $start->copy()->addMinutes($minutes);
        }

        return $start->copy()->addMinutes(self::DEFAULT_DURATION_MINUTES);
    }

    /**
     * Resolve a dispatch window. A date-only string (no clock time) with no
     * explicit end becomes the full calendar day — used by rental day checks.
     *
     * @return array{0: \Illuminate\Support\Carbon, 1: \Illuminate\Support\Carbon}
     */
    public static function resolveWindow(
        \DateTimeInterface|string $startsAt,
        \DateTimeInterface|string|null $endsAt = null,
        ?float $distanceKm = null,
        ?int $durationMinutes = null,
    ): array {
        $start = \Illuminate\Support\Carbon::parse($startsAt);

        if ($endsAt !== null) {
            $end = \Illuminate\Support\Carbon::parse($endsAt);

            if ($end->lte($start)) {
                $end = $start->copy()->addMinute();
            }

            return [$start, $end];
        }

        if (is_string($startsAt) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $startsAt) === 1) {
            return [$start->copy()->startOfDay(), $start->copy()->endOfDay()];
        }

        return [$start, self::estimateEndAt($start, $distanceKm, $durationMinutes)];
    }

    /**
     * Whether $column (vehicle_id or driver_id) already has an active trip
     * whose planned window overlaps [$startsAt, $endsAt).
     */
    public static function hasOverlappingTrip(
        string $column,
        int $id,
        \DateTimeInterface|string $startsAt,
        \DateTimeInterface|string|null $endsAt = null,
        ?int $excludingTripId = null,
        ?float $distanceKm = null,
        ?int $durationMinutes = null,
    ): bool {
        [$start, $end] = self::resolveWindow($startsAt, $endsAt, $distanceKm, $durationMinutes);

        return static::query()
            ->where($column, $id)
            ->whereIn('status', [self::STATUS_SCHEDULED, self::STATUS_IN_PROGRESS])
            ->where('scheduled_at', '<', $end)
            ->where(function ($query) use ($start): void {
                $query->where('scheduled_end_at', '>', $start)
                    ->orWhere(function ($legacy) use ($start): void {
                        $legacy->whereNull('scheduled_end_at')
                            ->whereRaw('scheduled_at + interval \''.self::defaultDurationSql().'\' > ?', [$start]);
                    });
            })
            ->when($excludingTripId, fn ($query) => $query->where('id', '!=', $excludingTripId))
            ->exists();
    }

    private static function defaultDurationSql(): string
    {
        return self::DEFAULT_DURATION_MINUTES.' minutes';
    }

    /**
     * @deprecated Prefer hasOverlappingTrip() — kept as a date-scoped alias for
     * rental day checks (full calendar day window).
     */
    public static function hasActiveTripOn(string $column, int $id, string|\DateTimeInterface $date, ?int $excludingTripId = null): bool
    {
        $day = \Illuminate\Support\Carbon::parse($date)->toDateString();

        return self::hasOverlappingTrip($column, $id, $day, null, $excludingTripId);
    }

    /**
     * Reasons a vehicle cannot be dispatched in the given window, empty when it can.
     *
     * Reads Fleet's own columns (status, STNK/KIR expiry) — a downward
     * dependency, so Fleet stays ignorant of Transportation. Expiry dates
     * default null on vehicles without the Document module; null means "no
     * paper on file / no block", so the gate needs no Modules::available guard.
     * Expired papers are a hard block: dispatching a vehicle with a lapsed KIR
     * is a compliance violation, not a warning.
     *
     * @return list<string>
     */
    public static function vehicleDispatchReasons(
        Vehicle $vehicle,
        \DateTimeInterface|string $startsAt,
        \DateTimeInterface|string|null $endsAt = null,
        ?int $excludingTripId = null,
        ?float $distanceKm = null,
        ?int $durationMinutes = null,
    ): array {
        $reasons = [];

        if ($vehicle->status !== Vehicle::STATUS_ACTIVE) {
            $reasons[] = __('transportation.messages.vehicle_not_active', [
                'name' => $vehicle->name,
                'status' => $vehicle->status,
            ]);
        }

        if (self::hasOverlappingTrip('vehicle_id', $vehicle->id, $startsAt, $endsAt, $excludingTripId, $distanceKm, $durationMinutes)) {
            $reasons[] = __('transportation.messages.vehicle_has_trip', ['name' => $vehicle->name]);
        }

        if ($vehicle->stnk_expires_at && $vehicle->stnk_expires_at->isPast()) {
            $reasons[] = __('transportation.messages.vehicle_stnk_expired', ['name' => $vehicle->name]);
        }

        if ($vehicle->kir_expires_at && $vehicle->kir_expires_at->isPast()) {
            $reasons[] = __('transportation.messages.vehicle_kir_expired', ['name' => $vehicle->name]);
        }

        return $reasons;
    }

    /**
     * Reasons a driver cannot be dispatched in the given window, empty when they can.
     *
     * @return list<string>
     */
    public static function driverDispatchReasons(
        Driver $driver,
        \DateTimeInterface|string $startsAt,
        \DateTimeInterface|string|null $endsAt = null,
        ?int $excludingTripId = null,
        ?float $distanceKm = null,
        ?int $durationMinutes = null,
    ): array {
        $reasons = [];

        if ($driver->status !== Driver::STATUS_AVAILABLE) {
            $reasons[] = __('transportation.messages.driver_not_available', [
                'name' => $driver->name,
                'status' => $driver->status,
            ]);
        }

        if (self::hasOverlappingTrip('driver_id', $driver->id, $startsAt, $endsAt, $excludingTripId, $distanceKm, $durationMinutes)) {
            $reasons[] = __('transportation.messages.driver_has_trip', ['name' => $driver->name]);
        }

        if ($driver->license_expires_at && $driver->license_expires_at->isPast()) {
            $reasons[] = __('transportation.messages.driver_sim_expired', ['name' => $driver->name]);
        }

        return $reasons;
    }
}
