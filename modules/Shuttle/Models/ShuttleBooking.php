<?php

namespace Modules\Shuttle\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;
use Modules\Shuttle\Database\Factories\ShuttleBookingFactory;

class ShuttleBooking extends Model
{
    /** @use HasFactory<ShuttleBookingFactory> */
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_BOARDED = 'boarded';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_NO_SHOW = 'no_show';

    public const MODE_POOL = 'pool';

    public const MODE_DOOR = 'door';

    protected static function newFactory(): Factory
    {
        return ShuttleBookingFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'booking_number',
        'departure_id',
        'partner_id',
        'booked_by',
        'status',
        'passenger_count',
        'unit_fare',
        'total_fare',
        'pickup_mode',
        'dropoff_mode',
        'pickup_address',
        'pickup_lat',
        'pickup_lng',
        'pickup_window_start',
        'pickup_window_end',
        'dropoff_address',
        'dropoff_lat',
        'dropoff_lng',
        'invoice_id',
        'credit_invoice_id',
        'notes',
        'cancelled_at',
        'refund_status',
        'cancel_reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'passenger_count' => 'integer',
            'unit_fare' => 'decimal:2',
            'total_fare' => 'decimal:2',
            'pickup_lat' => 'decimal:7',
            'pickup_lng' => 'decimal:7',
            'dropoff_lat' => 'decimal:7',
            'dropoff_lng' => 'decimal:7',
            'cancelled_at' => 'datetime',
        ];
    }

    public static function nextNumber(): string
    {
        $lastId = (int) static::query()->max('id');

        return sprintf('BK-%s-%05d', now()->format('Y'), $lastId + 1);
    }

    /**
     * @return BelongsTo<ShuttleDeparture, $this>
     */
    public function departure(): BelongsTo
    {
        return $this->belongsTo(ShuttleDeparture::class, 'departure_id');
    }

    /**
     * @return BelongsTo<Partner, $this>
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function bookedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'booked_by');
    }

    /**
     * @return BelongsTo<Invoice, $this>
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * @return BelongsTo<Invoice, $this>
     */
    public function creditInvoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'credit_invoice_id');
    }

    /**
     * @return HasMany<ShuttlePassenger, $this>
     */
    public function passengers(): HasMany
    {
        return $this->hasMany(ShuttlePassenger::class, 'booking_id');
    }
}
