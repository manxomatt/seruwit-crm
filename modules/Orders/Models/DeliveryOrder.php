<?php

namespace Modules\Orders\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Customer\Models\Customer;
use Modules\Orders\Database\Factories\DeliveryOrderFactory;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;

class DeliveryOrder extends Model
{
    /** @use HasFactory<DeliveryOrderFactory> */
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_ASSIGNED = 'assigned';

    public const STATUS_IN_TRANSIT = 'in_transit';

    public const STATUS_DELIVERED = 'delivered';

    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return DeliveryOrderFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'customer_id',
        'trip_id',
        'status',
        'order_date',
        'pickup_address',
        'delivery_address',
        'notes',
        'confirmed_at',
        'delivered_at',
        'cancelled_reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'order_date' => 'date',
            'confirmed_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * The trip fulfilling this order, once assigned. A trip may carry several
     * orders (consolidation); an order always travels whole on one trip.
     *
     * @return BelongsTo<Trip, $this>
     */
    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    /**
     * @return HasMany<DeliveryOrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(DeliveryOrderItem::class)->orderBy('id');
    }

    /**
     * The dropoff stop Orders created for this order on its trip, if any.
     * Queried directly because trip_stops carries no FK to delivery_orders
     * (Transportation must not depend on the optional Orders module).
     */
    public function dropoffStop(): ?TripStop
    {
        return TripStop::query()
            ->where('delivery_order_id', $this->id)
            ->where('type', TripStop::TYPE_DROPOFF)
            ->first();
    }

    /**
     * Generates the next sequential human-readable order code, e.g. DO-000001.
     * Not safe against a race between two simultaneous store requests, but
     * order creation is a low-frequency, single-operator action here — same
     * trade-off as Trip::nextCode().
     */
    public static function nextCode(): string
    {
        $lastNumber = (int) static::query()
            ->orderByDesc('id')
            ->value('id');

        return sprintf('DO-%06d', $lastNumber + 1);
    }
}
