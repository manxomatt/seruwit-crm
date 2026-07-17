<?php

namespace Modules\Fleet\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Fleet\Database\Factories\VehicleFactory;

/**
 * Deliberately has no knowledge of Trip or any other consumer's booking
 * concept — Fleet exists so Transportation, Rental, or any future module can
 * reference the same vehicle records via `requires(): ['fleet']` without this
 * module depending back on any of them.
 */
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
}
