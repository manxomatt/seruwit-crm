<?php

namespace Modules\Shuttle\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Shuttle\Database\Factories\ShuttleScheduleFactory;

class ShuttleSchedule extends Model
{
    /** @use HasFactory<ShuttleScheduleFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return ShuttleScheduleFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'corridor_id',
        'code',
        'days_of_week',
        'departure_time',
        'vehicle_id',
        'driver_id',
        'seat_capacity',
        'pickup_cutoff_minutes',
        'starts_on',
        'ends_on',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'days_of_week' => 'array',
            'seat_capacity' => 'integer',
            'pickup_cutoff_minutes' => 'integer',
            'starts_on' => 'date:Y-m-d',
            'ends_on' => 'date:Y-m-d',
            'is_active' => 'boolean',
        ];
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
     * @return HasMany<ShuttleDeparture, $this>
     */
    public function departures(): HasMany
    {
        return $this->hasMany(ShuttleDeparture::class, 'schedule_id');
    }
}
