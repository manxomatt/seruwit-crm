<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Fuel anomaly thresholds
    |--------------------------------------------------------------------------
    |
    | Used by FuelAnomalyDetector when a fill is recorded. Values are relative
    | to the vehicle's expected_km_per_liter (when set) or the rolling average
    | of recent full-tank fills.
    |
    */

    'fuel' => [
        'efficiency_drop_ratio' => 0.65,
        'min_distance_km_for_efficiency' => 20,
        'rolling_average_fills' => 5,
    ],

];
