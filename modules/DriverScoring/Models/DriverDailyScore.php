<?php

namespace Modules\DriverScoring\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Fleet\Models\Driver;

class DriverDailyScore extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'driver_id',
        'score_date',
        'score',
        'harsh_brake_count',
        'harsh_accel_count',
        'speeding_count',
        'idle_count',
        'points_delta',
        'event_count',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'score_date' => 'date',
            'score' => 'integer',
            'harsh_brake_count' => 'integer',
            'harsh_accel_count' => 'integer',
            'speeding_count' => 'integer',
            'idle_count' => 'integer',
            'points_delta' => 'integer',
            'event_count' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Driver, $this>
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }
}
