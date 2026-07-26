<?php

namespace Modules\Receivables\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Partners\Models\Partner;
use Modules\Receivables\Database\Factories\PaymentFactory;

class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use HasFactory;

    public const STATUS_POSTED = 'posted';

    public const STATUS_VOIDED = 'voided';

    public const TYPE_DOWN_PAYMENT = 'down_payment';

    public const TYPE_INSTALLMENT = 'installment';

    public const TYPE_SETTLEMENT = 'settlement';

    public const TYPE_OTHER = 'other';

    public const METHOD_CASH = 'cash';

    public const METHOD_TRANSFER = 'transfer';

    public const METHOD_GIRO = 'giro';

    public const METHOD_CARD = 'card';

    public const METHOD_OTHER = 'other';

    protected static function newFactory(): Factory
    {
        return PaymentFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'partner_id',
        'payment_date',
        'amount',
        'type',
        'method',
        'reference_number',
        'status',
        'notes',
        'recorded_by',
        'voided_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payment_date' => 'date:Y-m-d',
            'amount' => 'decimal:2',
            'voided_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Partner, $this>
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * @return HasMany<PaymentAllocation, $this>
     */
    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class);
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'recorded_by');
    }

    public function isPosted(): bool
    {
        return $this->status === self::STATUS_POSTED;
    }

    public static function nextCode(): string
    {
        $year = now()->format('Y');
        $prefix = "PAY-{$year}-";

        $last = static::query()
            ->where('code', 'like', $prefix.'%')
            ->orderByDesc('code')
            ->value('code');

        $seq = $last ? ((int) substr((string) $last, -4)) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }

    /**
     * @return list<string>
     */
    public static function types(): array
    {
        return [
            self::TYPE_DOWN_PAYMENT,
            self::TYPE_INSTALLMENT,
            self::TYPE_SETTLEMENT,
            self::TYPE_OTHER,
        ];
    }

    /**
     * @return list<string>
     */
    public static function methods(): array
    {
        return [
            self::METHOD_CASH,
            self::METHOD_TRANSFER,
            self::METHOD_GIRO,
            self::METHOD_CARD,
            self::METHOD_OTHER,
        ];
    }
}
