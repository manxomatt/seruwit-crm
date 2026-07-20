<?php

namespace Modules\Tracking\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Database\Factories\GpsDeviceFactory;

class GpsDevice extends Model
{
    /** @use HasFactory<GpsDeviceFactory> */
    use HasFactory;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return GpsDeviceFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'vehicle_id',
        'traccar_device_id',
        'unique_id',
        'name',
        'status',
        'last_seen_at',
        'last_latitude',
        'last_longitude',
        'last_speed_kph',
        'last_course',
        'last_recorded_at',
        'traccar_total_distance_m',
        'accumulated_distance_m',
        'odometer_base_km',
        'last_polled_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'traccar_device_id' => 'integer',
            'last_seen_at' => 'datetime',
            'last_latitude' => 'decimal:7',
            'last_longitude' => 'decimal:7',
            'last_speed_kph' => 'decimal:2',
            'last_course' => 'decimal:2',
            'last_recorded_at' => 'datetime',
            'traccar_total_distance_m' => 'integer',
            'accumulated_distance_m' => 'integer',
            'odometer_base_km' => 'integer',
            'last_polled_at' => 'datetime',
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
     * @return HasMany<VehiclePosition, $this>
     */
    public function positions(): HasMany
    {
        return $this->hasMany(VehiclePosition::class);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopePaired(Builder $query): Builder
    {
        return $query->whereNotNull('vehicle_id');
    }

    /**
     * Whether this device has ever reported a usable fix.
     */
    public function hasPosition(): bool
    {
        return $this->last_latitude !== null && $this->last_longitude !== null;
    }

    /**
     * The odometer reading this device implies for its vehicle: whatever the
     * vehicle read when the two were paired, plus whole kilometres travelled
     * since. Recomputed rather than incremented, so a replayed poll cannot
     * inflate it.
     */
    public function impliedOdometerKm(): int
    {
        return $this->odometer_base_km + intdiv($this->accumulated_distance_m, 1000);
    }
}
