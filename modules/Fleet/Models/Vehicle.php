<?php

namespace Modules\Fleet\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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

    public const STATUS_ACTIVE = 'active';

    public const STATUS_MAINTENANCE = 'maintenance';

    public const STATUS_INACTIVE = 'inactive';

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
        'rental_class',
        'brand',
        'model_year',
        'color',
        'capacity',
        'capacity_kg',
        'capacity_seats',
        'cost_per_km',
        'tank_capacity_liters',
        'expected_km_per_liter',
        'fuel_type',
        'status',
        'home_base_id',
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
            'capacity_kg' => 'decimal:2',
            'capacity_seats' => 'integer',
            'cost_per_km' => 'decimal:2',
            'tank_capacity_liters' => 'decimal:2',
            'expected_km_per_liter' => 'decimal:2',
            'stnk_expires_at' => 'date:Y-m-d',
            'kir_expires_at' => 'date:Y-m-d',
            'home_base_id' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<FleetBase, $this>
     */
    public function homeBase(): BelongsTo
    {
        return $this->belongsTo(FleetBase::class, 'home_base_id');
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
