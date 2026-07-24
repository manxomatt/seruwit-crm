<?php

namespace Modules\Purchasing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Inventory\Models\Warehouse;
use Modules\Partners\Models\Partner;
use Modules\Purchasing\Database\Factories\PurchaseOrderFactory;

class PurchaseOrder extends Model
{
    /** @use HasFactory<PurchaseOrderFactory> */
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_PARTIAL_RECEIVED = 'partial_received';

    public const STATUS_FULLY_RECEIVED = 'fully_received';

    public const STATUS_CLOSED = 'closed';

    public const STATUS_CANCELLED = 'cancelled';

    /** @var list<string> */
    protected $fillable = [
        'partner_id',
        'warehouse_id',
        'created_by',
        'po_number',
        'status',
        'ordered_at',
        'expected_at',
        'notes',
        'total_amount',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'ordered_at' => 'date',
            'expected_at' => 'date',
            'total_amount' => 'decimal:2',
        ];
    }

    protected static function newFactory(): Factory
    {
        return PurchaseOrderFactory::new();
    }

    /**
     * Generates the next yearly PO number, e.g. PO-2026-0001.
     */
    public static function nextNumber(): string
    {
        $year = now()->format('Y');
        $prefix = "PO-{$year}-";

        $last = static::query()
            ->where('po_number', 'like', $prefix.'%')
            ->orderByDesc('po_number')
            ->value('po_number');

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
            ->sum(fn (PurchaseOrderItem $item): float => (float) $item->quantity_ordered * (float) $item->unit_price);

        $this->update(['total_amount' => $total]);
    }

    public function receivingProgress(): array
    {
        $ordered = (float) $this->items()->sum('quantity_ordered');
        $received = (float) $this->items()->sum('quantity_received');
        $percent = $ordered > 0 ? min(100, round(($received / $ordered) * 100)) : 0;

        return [
            'ordered' => $ordered,
            'received' => $received,
            'percent' => $percent,
        ];
    }

    public function isFullyReceived(): bool
    {
        return $this->items()
            ->get()
            ->every(fn (PurchaseOrderItem $item): bool => (float) $item->quantity_received >= (float) $item->quantity_ordered);
    }

    public function hasReceivableItems(): bool
    {
        return $this->items()
            ->get()
            ->contains(fn (PurchaseOrderItem $item): bool => (float) $item->quantity_received < (float) $item->quantity_ordered);
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [
            self::STATUS_DRAFT,
            self::STATUS_SUBMITTED,
            self::STATUS_APPROVED,
        ], true);
    }

    public function canReceive(): bool
    {
        return in_array($this->status, [
            self::STATUS_APPROVED,
            self::STATUS_PARTIAL_RECEIVED,
        ], true) && $this->hasReceivableItems();
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

    /** @return HasMany<PurchaseOrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    /** @return HasMany<GoodReceiptNote, $this> */
    public function goodReceiptNotes(): HasMany
    {
        return $this->hasMany(GoodReceiptNote::class);
    }
}
