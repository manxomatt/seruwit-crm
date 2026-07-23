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
     * Whether $column (vehicle_id or driver_id) already has an active trip on
     * $date. Trip has no duration/end time, so "conflict" is scoped to the
     * calendar date rather than a true time-overlap check — a vehicle/driver
     * can be dispatched again on a different day, just not twice on the same
     * one. Shared by StoreTripRequest/UpdateTripRequest and
     * TripSchedule::generateTripsBetween() so the rule has one definition.
     */
    public static function hasActiveTripOn(string $column, int $id, string|\DateTimeInterface $date, ?int $excludingTripId = null): bool
    {
        return static::query()
            ->where($column, $id)
            ->whereIn('status', [self::STATUS_SCHEDULED, self::STATUS_IN_PROGRESS])
            ->whereDate('scheduled_at', $date)
            ->when($excludingTripId, fn ($query) => $query->where('id', '!=', $excludingTripId))
            ->exists();
    }

    /**
     * Reasons a vehicle cannot be dispatched on $date, empty when it can.
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
    public static function vehicleDispatchReasons(Vehicle $vehicle, string|\DateTimeInterface $date, ?int $excludingTripId = null): array
    {
        $reasons = [];

        if ($vehicle->status !== Vehicle::STATUS_ACTIVE) {
            $reasons[] = "Vehicle {$vehicle->name} is {$vehicle->status}, not active.";
        }

        if (self::hasActiveTripOn('vehicle_id', $vehicle->id, $date, $excludingTripId)) {
            $reasons[] = "Vehicle {$vehicle->name} already has a trip on this date.";
        }

        if ($vehicle->stnk_expires_at && $vehicle->stnk_expires_at->isPast()) {
            $reasons[] = "Vehicle {$vehicle->name} has an expired STNK.";
        }

        if ($vehicle->kir_expires_at && $vehicle->kir_expires_at->isPast()) {
            $reasons[] = "Vehicle {$vehicle->name} has an expired KIR.";
        }

        return $reasons;
    }

    /**
     * Reasons a driver cannot be dispatched on $date, empty when they can.
     *
     * @return list<string>
     */
    public static function driverDispatchReasons(Driver $driver, string|\DateTimeInterface $date, ?int $excludingTripId = null): array
    {
        $reasons = [];

        if ($driver->status !== Driver::STATUS_AVAILABLE) {
            $reasons[] = "Driver {$driver->name} is {$driver->status}, not available.";
        }

        if (self::hasActiveTripOn('driver_id', $driver->id, $date, $excludingTripId)) {
            $reasons[] = "Driver {$driver->name} already has a trip on this date.";
        }

        if ($driver->license_expires_at && $driver->license_expires_at->isPast()) {
            $reasons[] = "Driver {$driver->name} has an expired SIM.";
        }

        return $reasons;
    }
}
