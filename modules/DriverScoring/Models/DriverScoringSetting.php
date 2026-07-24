<?php

namespace Modules\DriverScoring\Models;

use Illuminate\Database\Eloquent\Model;

class DriverScoringSetting extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'harsh_brake_kph_per_s',
        'harsh_accel_kph_per_s',
        'speeding_limit_kph',
        'idle_speed_kph',
        'idle_minutes',
        'min_sample_seconds',
        'max_sample_seconds',
        'event_dedupe_seconds',
        'daily_base_points',
        'points_harsh_brake',
        'points_harsh_accel',
        'points_speeding',
        'points_idle',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'harsh_brake_kph_per_s' => 'decimal:2',
            'harsh_accel_kph_per_s' => 'decimal:2',
            'speeding_limit_kph' => 'decimal:2',
            'idle_speed_kph' => 'decimal:2',
            'idle_minutes' => 'integer',
            'min_sample_seconds' => 'integer',
            'max_sample_seconds' => 'integer',
            'event_dedupe_seconds' => 'integer',
            'daily_base_points' => 'integer',
            'points_harsh_brake' => 'integer',
            'points_harsh_accel' => 'integer',
            'points_speeding' => 'integer',
            'points_idle' => 'integer',
        ];
    }

    public static function current(): self
    {
        $row = static::query()->first();

        if ($row) {
            return $row;
        }

        return static::query()->create([
            'harsh_brake_kph_per_s' => config('scoring.harsh_brake_kph_per_s'),
            'harsh_accel_kph_per_s' => config('scoring.harsh_accel_kph_per_s'),
            'speeding_limit_kph' => config('scoring.speeding_limit_kph'),
            'idle_speed_kph' => config('scoring.idle_speed_kph'),
            'idle_minutes' => config('scoring.idle_minutes'),
            'min_sample_seconds' => config('scoring.min_sample_seconds'),
            'max_sample_seconds' => config('scoring.max_sample_seconds'),
            'event_dedupe_seconds' => config('scoring.event_dedupe_seconds'),
            'daily_base_points' => config('scoring.points.daily_base'),
            'points_harsh_brake' => config('scoring.points.harsh_brake'),
            'points_harsh_accel' => config('scoring.points.harsh_accel'),
            'points_speeding' => config('scoring.points.speeding'),
            'points_idle' => config('scoring.points.idle'),
        ]);
    }
}
