<?php

namespace Modules\Pos\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Inventory\Models\Warehouse;
use Modules\Partners\Models\Partner;

class PosSale extends Model
{
    public const STATUS_COMPLETED = 'completed';

    public const STATUS_VOIDED = 'voided';

    public const STATUS_REFUNDED = 'refunded';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'pos_shift_id',
        'warehouse_id',
        'cashier_id',
        'partner_id',
        'status',
        'subtotal',
        'discount_total',
        'tax_total',
        'grand_total',
        'amount_tendered',
        'change_due',
        'sold_at',
        'voided_at',
        'voided_by',
        'void_reason',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'amount_tendered' => 'decimal:2',
            'change_due' => 'decimal:2',
            'sold_at' => 'datetime',
            'voided_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<PosShift, $this>
     */
    public function shift(): BelongsTo
    {
        return $this->belongsTo(PosShift::class, 'pos_shift_id');
    }

    /**
     * @return BelongsTo<Warehouse, $this>
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
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
    public function voider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    /**
     * @return HasMany<PosSaleItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PosSaleItem::class);
    }

    /**
     * @return HasMany<PosPayment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(PosPayment::class);
    }

    public static function nextCode(): string
    {
        $year = now()->format('Y');
        $prefix = "POS-{$year}-";

        $last = static::query()
            ->where('code', 'like', $prefix.'%')
            ->orderByDesc('code')
            ->value('code');

        $seq = $last ? ((int) substr((string) $last, -4)) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }
}
