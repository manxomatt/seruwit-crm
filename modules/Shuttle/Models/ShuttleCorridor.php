<?php

namespace Modules\Shuttle\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Partners\Models\Location;
use Modules\Shuttle\Database\Factories\ShuttleCorridorFactory;

class ShuttleCorridor extends Model
{
    /** @use HasFactory<ShuttleCorridorFactory> */
    use HasFactory;

    public const SERVICE_POOL = 'pool';

    public const SERVICE_DOOR = 'door';

    /** @var list<string> */
    public const SERVICE_TYPES = [
        self::SERVICE_POOL,
        self::SERVICE_DOOR,
    ];

    protected static function newFactory(): Factory
    {
        return ShuttleCorridorFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'code',
        'name',
        'origin_city',
        'destination_city',
        'origin_city_id',
        'destination_city_id',
        'service_type',
        'origin_location_id',
        'destination_location_id',
        'origin_pool_id',
        'destination_pool_id',
        'base_fare',
        'estimated_duration_minutes',
        'distance_km',
        'is_active',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'base_fare' => 'decimal:2',
            'estimated_duration_minutes' => 'integer',
            'distance_km' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function isPoolService(): bool
    {
        return $this->service_type === self::SERVICE_POOL;
    }

    public function isDoorService(): bool
    {
        return $this->service_type === self::SERVICE_DOOR;
    }

    /**
     * Named without colliding with the denormalized `origin_city` string column
     * (Eloquent would otherwise serialize both as `origin_city` and overwrite the label).
     *
     * @return BelongsTo<ShuttleCity, $this>
     */
    public function originCityRecord(): BelongsTo
    {
        return $this->belongsTo(ShuttleCity::class, 'origin_city_id');
    }

    /**
     * @return BelongsTo<ShuttleCity, $this>
     */
    public function destinationCityRecord(): BelongsTo
    {
        return $this->belongsTo(ShuttleCity::class, 'destination_city_id');
    }

    /**
     * @return BelongsTo<ShuttlePool, $this>
     */
    public function originPool(): BelongsTo
    {
        return $this->belongsTo(ShuttlePool::class, 'origin_pool_id');
    }

    /**
     * @return BelongsTo<ShuttlePool, $this>
     */
    public function destinationPool(): BelongsTo
    {
        return $this->belongsTo(ShuttlePool::class, 'destination_pool_id');
    }

    /**
     * @return BelongsTo<Location, $this>
     */
    public function originLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'origin_location_id');
    }

    /**
     * @return BelongsTo<Location, $this>
     */
    public function destinationLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'destination_location_id');
    }

    /**
     * @return HasMany<ShuttleSchedule, $this>
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(ShuttleSchedule::class, 'corridor_id');
    }

    /**
     * @return HasMany<ShuttleDeparture, $this>
     */
    public function departures(): HasMany
    {
        return $this->hasMany(ShuttleDeparture::class, 'corridor_id');
    }
}
