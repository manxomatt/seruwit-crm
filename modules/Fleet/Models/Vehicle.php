<?php

namespace Modules\TransportationManagement\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\TransportationManagement\Database\Factories\VehicleFactory;

class Vehicle extends Model
{
    /** @use HasFactory<VehicleFactory> */
    use HasFactory;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return VehicleFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'plate_number',
        'type',
        'brand',
        'model_year',
        'capacity',
        'fuel_type',
        'status',
        'odometer_km',
        'stnk_expires_at',
        'kir_expires_at',
        'photo_url',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'model_year' => 'integer',
            'odometer_km' => 'integer',
            'stnk_expires_at' => 'date',
            'kir_expires_at' => 'date',
        ];
    }

    /**
     * @return HasMany<Trip, $this>
     */
    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    /**
     * @return HasMany<VehicleMaintenanceLog, $this>
     */
    public function maintenanceLogs(): HasMany
    {
        return $this->hasMany(VehicleMaintenanceLog::class)->latest('scheduled_date');
    }

    /**
     * @return HasMany<FuelLog, $this>
     */
    public function fuelLogs(): HasMany
    {
        return $this->hasMany(FuelLog::class)->latest('filled_at');
    }

    /**
     * A vehicle already committed to a scheduled or in-progress trip cannot
     * take on another one until that trip finishes or is cancelled.
     */
    public function hasActiveTrip(?int $excludingTripId = null): bool
    {
        return $this->trips()
            ->whereIn('status', [Trip::STATUS_SCHEDULED, Trip::STATUS_IN_PROGRESS])
            ->when($excludingTripId, fn ($query) => $query->where('id', '!=', $excludingTripId))
            ->exists();
    }
}
