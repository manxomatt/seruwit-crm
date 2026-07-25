<?php

namespace Modules\Sales\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Inventory\Models\Warehouse;
use Modules\Partners\Models\Partner;
use Modules\Sales\Database\Factories\SalesOrderFactory;

class SalesOrder extends Model
{
    /** @use HasFactory<SalesOrderFactory> */
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_PARTIAL_DELIVERED = 'partial_delivered';

    public const STATUS_FULLY_DELIVERED = 'fully_delivered';

    public const STATUS_CLOSED = 'closed';

    public const STATUS_CANCELLED = 'cancelled';

    /** @var list<string> */
    protected $fillable = [
        'partner_id',
        'warehouse_id',
        'created_by',
        'so_number',
        'status',
        'ordered_at',
        'promised_at',
        'notes',
        'total_amount',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'ordered_at' => 'date',
            'promised_at' => 'date',
            'total_amount' => 'decimal:2',
        ];
    }

    protected static function newFactory(): Factory
    {
        return SalesOrderFactory::new();
    }

    /**
     * Generates the next yearly SO number, e.g. SO-2026-0001.
     */
    public static function nextNumber(): string
    {
        $year = now()->format('Y');
        $prefix = "SO-{$year}-";

        $last = static::query()
            ->where('so_number', 'like', $prefix.'%')
            ->orderByDesc('so_number')
            ->value('so_number');

        $sequence = 1;
        if (is_string($last) && preg_match('/(\d+)$/', $last, $matches) === 1) {
            $sequence = (int) $matches[1] + 1;
        }

        return sprintf('%s%04d', $prefix, $sequence);
    }

    public function recalculateTotal(): void
    {
        $total = $this->items()
            ->get()
            ->sum(fn (SalesOrderItem $item): float => (float) $item->quantity_ordered * (float) $item->unit_price);

        $this->update(['total_amount' => $total]);
    }

    public function deliveringProgress(): array
    {
        $ordered = (float) $this->items()->sum('quantity_ordered');
        $delivered = (float) $this->items()->sum('quantity_delivered');
        $percent = $ordered > 0 ? min(100, round(($delivered / $ordered) * 100)) : 0;

        return [
            'ordered' => $ordered,
            'delivered' => $delivered,
            'percent' => $percent,
        ];
    }

    public function isFullyDelivered(): bool
    {
        return $this->items()
            ->get()
            ->every(fn (SalesOrderItem $item): bool => (float) $item->quantity_delivered >= (float) $item->quantity_ordered);
    }

    public function hasDeliverableItems(): bool
    {
        return $this->items()
            ->get()
            ->contains(fn (SalesOrderItem $item): bool => $item->remainingQuantity() > 0);
    }

    public function canBeCancelled(): bool
    {
        if (! in_array($this->status, [self::STATUS_DRAFT, self::STATUS_CONFIRMED], true)) {
            return false;
        }

        return ! $this->goodsIssueNotes()
            ->where('status', '!=', GoodsIssueNote::STATUS_VOIDED)
            ->exists();
    }

    public function canIssue(): bool
    {
        return in_array($this->status, [
            self::STATUS_CONFIRMED,
            self::STATUS_PARTIAL_DELIVERED,
        ], true) && $this->hasDeliverableItems();
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
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

    /** @return HasMany<SalesOrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class);
    }

    /** @return HasMany<GoodsIssueNote, $this> */
    public function goodsIssueNotes(): HasMany
    {
        return $this->hasMany(GoodsIssueNote::class);
    }
}
