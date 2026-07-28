<?php

namespace Modules\Tracking\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Fleet\Models\Vehicle;

class TrackingAlertState extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'alert_key',
        'kind',
        'vehicle_id',
        'gps_device_id',
        'idle_since',
        'inside_geofence',
        'last_alerted_at',
        'meta',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'idle_since' => 'datetime',
            'inside_geofence' => 'boolean',
            'last_alerted_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    /** @return BelongsTo<Vehicle, $this> */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /** @return BelongsTo<GpsDevice, $this> */
    public function gpsDevice(): BelongsTo
    {
        return $this->belongsTo(GpsDevice::class);
    }
}
