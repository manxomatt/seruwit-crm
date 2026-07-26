<?php

namespace Modules\Fleet\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Fleet\Database\Factories\FuelLogFactory;

class FuelLog extends Model
{
    /** @use HasFactory<FuelLogFactory> */
    use HasFactory;

    public const ODOMETER_SOURCE_MANUAL = 'manual';

    public const ODOMETER_SOURCE_VEHICLE = 'vehicle';

    public const ODOMETER_SOURCE_GPS = 'gps';

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return FuelLogFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'vehicle_id',
        'driver_id',
        'filled_at',
        'liters',
        'cost',
        'odometer_km',
        'station_name',
        'receipt_number',
        'is_full_tank',
        'price_per_liter',
        'odometer_source',
        'distance_since_last_km',
        'km_per_liter',
        'liters_per_100km',
        'anomaly_flags',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'filled_at' => 'date:Y-m-d',
            'liters' => 'decimal:2',
            'cost' => 'decimal:2',
            'odometer_km' => 'integer',
            'is_full_tank' => 'boolean',
            'price_per_liter' => 'decimal:2',
            'distance_since_last_km' => 'integer',
            'km_per_liter' => 'decimal:2',
            'liters_per_100km' => 'decimal:2',
            'anomaly_flags' => 'array',
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

    public function hasAnomalies(): bool
    {
        return is_array($this->anomaly_flags) && $this->anomaly_flags !== [];
    }
}
