<?php

namespace Modules\Tracking\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Tracking\Models\TrackingConfig;

/**
 * @extends Factory<TrackingConfig>
 */
class TrackingConfigFactory extends Factory
{
    /**
     * @var class-string<TrackingConfig>
     */
    protected $model = TrackingConfig::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'alerts_enabled' => true,
            'alert_speed_kph' => 80,
            'alert_stale_minutes' => 15,
            'alert_idle_minutes' => 30,
            'alert_cooldown_minutes' => 30,
            'geofence_radius_m' => 200,
            'checkpoint_min_distance_m' => 200,
            'checkpoint_min_interval_minutes' => 5,
            'retention_days' => 90,
        ];
    }
}
