<?php

namespace Modules\TransportationManagement\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Customer\Models\Customer;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
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
        'customer_id',
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
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
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
}
