<?php

namespace Modules\Collections\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;

class CollectionPromise extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_FULFILLED = 'fulfilled';

    public const STATUS_BROKEN = 'broken';

    public const STATUS_CANCELLED = 'cancelled';

    protected $table = 'collection_promises';

    protected $fillable = [
        'invoice_id',
        'partner_id',
        'promised_amount',
        'promised_date',
        'status',
        'notes',
        'recorded_by',
        'fulfilled_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'promised_amount' => 'decimal:2',
            'promised_date' => 'date:Y-m-d',
            'fulfilled_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Invoice, $this>
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
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
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
