<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Driving behaviour thresholds
    |--------------------------------------------------------------------------
    |
    | Defaults for tenant scoring configs. Tenants can override via the
    | driver_scoring_settings row seeded on module install.
    |
    */

    'harsh_brake_kph_per_s' => 11.0,
    'harsh_accel_kph_per_s' => 12.0,
    'speeding_limit_kph' => 80.0,
    'idle_speed_kph' => 3.0,
    'idle_minutes' => 10,
    'min_sample_seconds' => 3,
    'max_sample_seconds' => 60,
    'event_dedupe_seconds' => 30,

    'points' => [
        'daily_base' => 100,
        'harsh_brake' => -5,
        'harsh_accel' => -3,
        'speeding' => -4,
        'idle' => -2,
        'min' => 0,
        'max' => 100,
    ],

];
