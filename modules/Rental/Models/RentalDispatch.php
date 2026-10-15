<?php

namespace Modules\Rental\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Fleet\Models\Driver;

class RentalDispatch extends Model
{
    use HasFactory;

    public const TYPE_DELIVERY = 'delivery';

    public const TYPE_PICKUP = 'pickup';

    public const STATUS_SCHEDULED = 'scheduled';

    public const STATUS_ASSIGNED = 'assigned';

    public const STATUS_EN_ROUTE = 'en_route';

    public const STATUS_ARRIVED = 'arrived';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const PAYER_CUSTOMER = 'customer';

    public const PAYER_FREE = 'free';

    public const PAYER_INCLUDED = 'included';

    protected $fillable = [
        'rental_id',
        'type',
        'driver_id',
        'user_id',
        'status',
        'scheduled_at',
        'location_name',
        'location_address',
        'contact_name',
        'contact_phone',
        'fee',
        'fee_payer',
        'dispatched_at',
        'arrived_at',
        'completed_at',
        'start_odometer',
        'start_fuel_level',
        'notes',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'dispatched_at' => 'datetime',
            'arrived_at' => 'datetime',
            'completed_at' => 'datetime',
            'fee' => 'decimal:2',
            'start_odometer' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Rental, $this>
     */
    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }

    /**
     * @return BelongsTo<Driver, $this>
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope for dispatches scheduled today.
     *
     * @param  Builder<static>  $query
     */
    public function scopeToday(Builder $query): Builder
    {
        return $query->whereDate('scheduled_at', today());
    }

    /**
     * Scope for active dispatches (not completed or cancelled).
     *
     * @param  Builder<static>  $query
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNotIn('status', [self::STATUS_COMPLETED, self::STATUS_CANCELLED]);
    }

    /**
     * Scope by type (delivery or pickup).
     *
     * @param  Builder<static>  $query
     */
    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    /**
     * Helper to get runner name whether assigned to Driver or User.
     */
    public function getRunnerNameAttribute(): ?string
    {
        if ($this->driver_id && $this->relationLoaded('driver') && $this->driver) {
            return $this->driver->name;
        }

        if ($this->user_id && $this->relationLoaded('user') && $this->user) {
            return $this->user->name;
        }

        return null;
    }
}
