<?php

namespace Modules\TransportationManagement\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\TransportationManagement\Database\Factories\TripStopFactory;

class TripStop extends Model
{
    /** @use HasFactory<TripStopFactory> */
    use HasFactory;

    public const TYPE_PICKUP = 'pickup';

    public const TYPE_DROPOFF = 'dropoff';

    public const STATUS_PENDING = 'pending';

    public const STATUS_ARRIVED = 'arrived';

    public const STATUS_COMPLETED = 'completed';

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return TripStopFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'trip_id',
        'sequence',
        'type',
        'address',
        'lat',
        'lng',
        'delivery_order_id',
        'status',
        'arrived_at',
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
            'arrived_at' => 'datetime',
            'completed_at' => 'datetime',
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
