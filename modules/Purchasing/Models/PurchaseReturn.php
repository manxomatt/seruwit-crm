<?php

namespace Modules\Purchasing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Inventory\Models\Warehouse;

class PurchaseReturn extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_VOIDED = 'voided';

    /** @var list<string> */
    protected $fillable = [
        'return_number',
        'purchase_order_id',
        'good_receipt_note_id',
        'warehouse_id',
        'created_by',
        'status',
        'returned_at',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'returned_at' => 'date:Y-m-d',
        ];
    }

    public static function nextNumber(): string
    {
        $year = now()->format('Y');
        $prefix = "PR-{$year}-";
        $last = static::query()->where('return_number', 'like', $prefix.'%')->orderByDesc('return_number')->value('return_number');
        $sequence = 1;
        if (is_string($last) && preg_match('/(\d+)$/', $last, $matches) === 1) {
            $sequence = (int) $matches[1] + 1;
        }

        return sprintf('%s%04d', $prefix, $sequence);
    }

    /** @return BelongsTo<PurchaseOrder, $this> */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /** @return BelongsTo<GoodReceiptNote, $this> */
    public function goodReceiptNote(): BelongsTo
    {
        return $this->belongsTo(GoodReceiptNote::class);
    }

    /** @return BelongsTo<Warehouse, $this> */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /** @return BelongsTo<User, $this> */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasMany<PurchaseReturnItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseReturnItem::class);
    }
}
