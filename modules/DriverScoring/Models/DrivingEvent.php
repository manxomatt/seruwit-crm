<?php

namespace Modules\DriverScoring\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;

class DrivingEvent extends Model
{
    public const TYPE_HARSH_BRAKE = 'harsh_brake';

    public const TYPE_HARSH_ACCEL = 'harsh_accel';

    public const TYPE_SPEEDING = 'speeding';

    public const TYPE_IDLE = 'idle';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'vehicle_id',
        'driver_id',
        'gps_device_id',
        'trip_id',
        'type',
        'severity',
        'magnitude',
        'speed_kph',
        'latitude',
        'longitude',
        'points_delta',
        'recorded_at',
        'ended_at',
        'meta',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'magnitude' => 'decimal:2',
            'speed_kph' => 'decimal:2',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'points_delta' => 'integer',
            'recorded_at' => 'datetime',
            'ended_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Driver, $this>
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /**
     * @return BelongsTo<Vehicle, $this>
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }
}
