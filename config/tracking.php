<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Position Sanity Guards
    |--------------------------------------------------------------------------
    |
    | Telemetry arrives from consumer-grade trackers, so a share of it is
    | nonsense: a fix that teleports across the island, or drift of a few metres
    | while the vehicle is parked. These bound what the odometer will believe.
    |
    | Anything above max_position_jump_m is discarded as a glitch rather than
    | added to the odometer; anything below min_odometer_delta_m is treated as
    | standing still, so a parked vehicle does not slowly accrue kilometres.
    |
    */

    'max_position_jump_m' => env('TRACKING_MAX_POSITION_JUMP_M', 50000),

    'min_odometer_delta_m' => env('TRACKING_MIN_ODOMETER_DELTA_M', 20),

    /*
    |--------------------------------------------------------------------------
    | Future Fix Tolerance
    |--------------------------------------------------------------------------
    |
    | recorded_at comes from the device's own clock and is half of the dedupe
    | unique key. A tracker with a broken clock would otherwise write a row
    | dated years ahead that nothing can ever supersede, so fixes further than
    | this into the future are rejected outright.
    |
    */

    'max_future_fix_minutes' => env('TRACKING_MAX_FUTURE_FIX_MINUTES', 10),

    /*
    |--------------------------------------------------------------------------
    | Prune Chunk Size
    |--------------------------------------------------------------------------
    |
    | vehicle_positions is the largest table in the system by two orders of
    | magnitude, so retention is enforced in bounded deletes rather than one
    | statement that would hold a long transaction against a live table.
    |
    */

    'prune_chunk' => env('TRACKING_PRUNE_CHUNK', 5000),

];
