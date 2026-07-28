<?php

namespace Modules\Tracking\Models;

use Illuminate\Database\Eloquent\Model;

class TrackingGeofence extends Model
{
    public const ALERT_EXIT = 'exit';

    public const ALERT_ENTER = 'enter';

    public const ALERT_BOTH = 'both';

    /** @var list<string> */
    protected $fillable = [
        'name',
        'latitude',
        'longitude',
        'radius_m',
        'alert_on',
        'active_rentals_only',
        'is_active',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'radius_m' => 'integer',
            'active_rentals_only' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return list<string>
     */
    public static function alertModes(): array
    {
        return [self::ALERT_EXIT, self::ALERT_ENTER, self::ALERT_BOTH];
    }
}
