<?php

namespace Modules\TransportationManagement\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\TransportationManagement\Database\Factories\TripCheckpointFactory;

class TripCheckpoint extends Model
{
    /** @use HasFactory<TripCheckpointFactory> */
    use HasFactory;

    /** Typed in by an operator. */
    public const SOURCE_MANUAL = 'manual';

    /** Written automatically from a GPS fix while the trip was under way. */
    public const SOURCE_GPS = 'gps';

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return TripCheckpointFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'trip_id',
        'source',
        'latitude',
        'longitude',
        'note',
        'recorded_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'recorded_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Trip, $this>
     */
    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }
}
