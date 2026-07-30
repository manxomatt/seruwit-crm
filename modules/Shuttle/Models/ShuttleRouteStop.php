<?php

namespace Modules\Shuttle\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShuttleRouteStop extends Model
{
    public const TYPE_PICKUP = 'pickup';

    public const TYPE_POOL_ORIGIN = 'pool_origin';

    public const TYPE_POOL_DESTINATION = 'pool_destination';

    public const TYPE_DROPOFF = 'dropoff';

    public const STATUS_PENDING = 'pending';

    public const STATUS_ARRIVED = 'arrived';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_SKIPPED = 'skipped';

    /** @var list<string> */
    protected $fillable = [
        'departure_id',
        'booking_id',
        'stop_type',
        'sequence',
        'address',
        'lat',
        'lng',
        'eta_at',
        'distance_from_previous_km',
        'status',
        'completed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sequence' => 'integer',
            'lat' => 'decimal:7',
            'lng' => 'decimal:7',
            'eta_at' => 'datetime',
            'distance_from_previous_km' => 'decimal:2',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<ShuttleDeparture, $this>
     */
    public function departure(): BelongsTo
    {
        return $this->belongsTo(ShuttleDeparture::class, 'departure_id');
    }

    /**
     * @return BelongsTo<ShuttleBooking, $this>
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(ShuttleBooking::class, 'booking_id');
    }
}
