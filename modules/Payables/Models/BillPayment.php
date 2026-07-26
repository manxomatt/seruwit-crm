<?php

namespace Modules\Payables\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Partners\Models\Partner;

class BillPayment extends Model
{
    public const STATUS_POSTED = 'posted';

    public const STATUS_VOIDED = 'voided';

    public const METHOD_CASH = 'cash';

    public const METHOD_TRANSFER = 'transfer';

    public const METHOD_GIRO = 'giro';

    public const METHOD_OTHER = 'other';

    /** @var list<string> */
    protected $fillable = [
        'code',
        'partner_id',
        'payment_date',
        'amount',
        'method',
        'reference_number',
        'status',
        'notes',
        'recorded_by',
        'voided_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'payment_date' => 'date',
            'amount' => 'decimal:2',
            'voided_at' => 'datetime',
        ];
    }

    public static function nextCode(): string
    {
        $year = now()->format('Y');
        $prefix = "BPAY-{$year}-";
        $last = static::query()
            ->where('code', 'like', $prefix.'%')
            ->orderByDesc('code')
            ->value('code');

        $sequence = 1;
        if (is_string($last) && preg_match('/(\d+)$/', $last, $matches) === 1) {
            $sequence = (int) $matches[1] + 1;
        }

        return sprintf('%s%04d', $prefix, $sequence);
    }

    /** @return list<string> */
    public static function methods(): array
    {
        return [self::METHOD_CASH, self::METHOD_TRANSFER, self::METHOD_GIRO, self::METHOD_OTHER];
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /** @return BelongsTo<User, $this> */
    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /** @return HasMany<BillPaymentAllocation, $this> */
    public function allocations(): HasMany
    {
        return $this->hasMany(BillPaymentAllocation::class);
    }
}
