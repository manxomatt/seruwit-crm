<?php

namespace Modules\Tracking\Models;

use Illuminate\Database\Eloquent\Model;

class TrackingGeofence extends Model
{
    public const TYPE_CIRCLE = 'circle';

    public const TYPE_POLYGON = 'polygon';

    public const ALERT_EXIT = 'exit';

    public const ALERT_ENTER = 'enter';

    public const ALERT_BOTH = 'both';

    /** @var list<string> */
    protected $fillable = [
        'name',
        'type',
        'coordinates',
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
            'type' => 'string',
            'coordinates' => 'array',
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
    public static function types(): array
    {
        return [self::TYPE_CIRCLE, self::TYPE_POLYGON];
    }

    /**
     * @return list<string>
     */
    public static function alertModes(): array
    {
        return [self::ALERT_EXIT, self::ALERT_ENTER, self::ALERT_BOTH];
    }

    public function isPolygon(): bool
    {
        return $this->type === self::TYPE_POLYGON;
    }

    public function isCircle(): bool
    {
        return $this->type === self::TYPE_CIRCLE || empty($this->type);
    }
}
