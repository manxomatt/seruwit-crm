<?php

namespace Modules\Receivables\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;

class GatewayCharge extends Model
{
    public const PURPOSE_RENTAL_DEPOSIT = 'rental_deposit';

    public const PURPOSE_INVOICE = 'invoice';

    public const STATUS_PENDING = 'pending';

    public const STATUS_PAID = 'paid';

    public const STATUS_FAILED = 'failed';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_CANCELLED = 'cancelled';

    /** @var list<string> */
    protected $fillable = [
        'purpose',
        'rental_id',
        'invoice_id',
        'partner_id',
        'order_id',
        'amount',
        'currency',
        'status',
        'snap_token',
        'redirect_url',
        'payment_type',
        'external_transaction_id',
        'fraud_status',
        'raw_request',
        'raw_notification',
        'created_by',
        'paid_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'raw_request' => 'array',
            'raw_notification' => 'array',
            'paid_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Rental, $this> */
    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }

    /** @return BelongsTo<Invoice, $this> */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isOpen(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }
}
