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
        'origin_location_id',
        'destination_location_id',
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
