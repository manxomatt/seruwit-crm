<?php

namespace Modules\Tracking\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Tracking\Database\Factories\VehiclePositionFactory;

/**
 * One GPS fix. Append-only — nothing ever updates a position, so the model
 * carries created_at alone.
 */
class VehiclePosition extends Model
{
    /** @use HasFactory<VehiclePositionFactory> */
    use HasFactory;

    public $timestamps = false;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return VehiclePositionFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'gps_device_id',
        'vehicle_id',
        'latitude',
        'longitude',
        'speed_kph',
        'course',
        'altitude',
        'ignition',
        'motion',
        'total_distance_m',
        'recorded_at',
        'server_time',
        'attributes',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'speed_kph' => 'decimal:2',
            'course' => 'decimal:2',
            'altitude' => 'decimal:2',
            'ignition' => 'boolean',
            'motion' => 'boolean',
            'total_distance_m' => 'integer',
            'recorded_at' => 'datetime',
            'server_time' => 'datetime',
            'attributes' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<GpsDevice, $this>
     */
    public function gpsDevice(): BelongsTo
    {
        return $this->belongsTo(GpsDevice::class);
    }
}
