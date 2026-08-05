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

    protected static function newFactory(): Factory
    {
        return GpsDeviceFactory::new();
    }

    protected $fillable = [
        'gps_source_id',
        'vehicle_id',
        'external_device_id',
        'unique_id',
        'name',
        'status',
        'last_seen_at',
        'last_latitude',
        'last_longitude',
        'last_speed_kph',
        'last_course',
        'last_recorded_at',
        'provider_total_distance_m',
        'accumulated_distance_m',
        'odometer_base_km',
        'last_polled_at',
    ];

    protected function casts(): array
    {
        return [
            'external_device_id' => 'integer',
            'last_seen_at' => 'datetime',
            'last_latitude' => 'decimal:7',
            'last_longitude' => 'decimal:7',
            'last_speed_kph' => 'decimal:2',
            'last_course' => 'decimal:2',
            'last_recorded_at' => 'datetime',
            'provider_total_distance_m' => 'integer',
            'accumulated_distance_m' => 'integer',
            'odometer_base_km' => 'integer',
            'last_polled_at' => 'datetime',
        ];
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(GpsSource::class, 'gps_source_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function positions(): HasMany
    {
        return $this->hasMany(VehiclePosition::class);
    }

    public function scopePaired(Builder $query): Builder
    {
        return $query->whereNotNull('vehicle_id');
    }

    public function hasPosition(): bool
    {
        return $this->last_latitude !== null && $this->last_longitude !== null;
    }

    public function impliedOdometerKm(): int
    {
        return $this->odometer_base_km + intdiv($this->accumulated_distance_m, 1000);
    }
}
