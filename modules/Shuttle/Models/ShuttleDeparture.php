<?php

namespace Modules\Shuttle\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Location;
use Modules\Shuttle\Database\Factories\ShuttleDepartureFactory;

class ShuttleDeparture extends Model
{
    /** @use HasFactory<ShuttleDepartureFactory> */
    use HasFactory;

    public const STATUS_OPEN = 'open';

    public const STATUS_LOCKED = 'locked';

    public const STATUS_OPTIMIZED = 'optimized';

    public const STATUS_DISPATCHED = 'dispatched';

    public const STATUS_IN_TRANSIT = 'in_transit';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    protected static function newFactory(): Factory
    {
        return ShuttleDepartureFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'schedule_id',
        'corridor_id',
        'departure_number',
        'depart_date',
        'depart_time',
        'vehicle_id',
        'driver_id',
        'seat_capacity',
        'seats_booked',
        'status',
        'origin_pool_id',
        'destination_pool_id',
        'optimized_at',
        'dispatched_at',
        'completed_at',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'depart_date' => 'date:Y-m-d',
            'seat_capacity' => 'integer',
            'seats_booked' => 'integer',
            'optimized_at' => 'datetime',
            'dispatched_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function seatsRemaining(): int
    {
        return max(0, $this->seat_capacity - $this->seats_booked);
    }

    public static function nextNumber(): string
    {
        $lastId = (int) static::query()->max('id');

        return sprintf('SH-%s-%05d', now()->format('Y'), $lastId + 1);
    }

    /**
     * @return BelongsTo<ShuttleSchedule, $this>
     */
    public function schedule(): BelongsTo
    {
        return $this->belongsTo(ShuttleSchedule::class, 'schedule_id');
    }

    /**
     * @return BelongsTo<ShuttleCorridor, $this>
     */
    public function corridor(): BelongsTo
    {
        return $this->belongsTo(ShuttleCorridor::class, 'corridor_id');
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
     * @return BelongsTo<Location, $this>
     */
    public function originPool(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'origin_pool_id');
    }

    /**
     * @return BelongsTo<Location, $this>
     */
    public function destinationPool(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'destination_pool_id');
    }

    /**
     * @return HasMany<ShuttleBooking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(ShuttleBooking::class, 'departure_id');
    }

    /**
     * @return HasMany<ShuttleRouteStop, $this>
     */
    public function routeStops(): HasMany
    {
        return $this->hasMany(ShuttleRouteStop::class, 'departure_id')->orderBy('sequence');
    }
}
