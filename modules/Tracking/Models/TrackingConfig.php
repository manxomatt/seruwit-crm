<?php

namespace Modules\Tracking\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Tracking\Database\Factories\TrackingConfigFactory;

/**
 * Tenant-level tracking thresholds and retention. GPS server credentials live on
 * GpsSource — a tenant may connect to several providers at once.
 */
class TrackingConfig extends Model
{
    /** @use HasFactory<TrackingConfigFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return TrackingConfigFactory::new();
    }

    protected $fillable = [
        'alerts_enabled',
        'alert_speed_kph',
        'alert_stale_minutes',
        'alert_idle_minutes',
        'alert_cooldown_minutes',
        'geofence_radius_m',
        'checkpoint_min_distance_m',
        'checkpoint_min_interval_minutes',
        'retention_days',
    ];

    protected function casts(): array
    {
        return [
            'alerts_enabled' => 'boolean',
            'alert_speed_kph' => 'integer',
            'alert_stale_minutes' => 'integer',
            'alert_idle_minutes' => 'integer',
            'alert_cooldown_minutes' => 'integer',
            'geofence_radius_m' => 'integer',
            'checkpoint_min_distance_m' => 'integer',
            'checkpoint_min_interval_minutes' => 'integer',
            'retention_days' => 'integer',
        ];
    }

    public static function current(): self
    {
        return static::query()->firstOrCreate([], []);
    }
}
