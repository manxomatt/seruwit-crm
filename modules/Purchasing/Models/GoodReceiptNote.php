<?php

namespace Modules\Purchasing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Inventory\Models\Warehouse;
use Modules\Purchasing\Database\Factories\GoodReceiptNoteFactory;

class GoodReceiptNote extends Model
{
    /** @use HasFactory<GoodReceiptNoteFactory> */
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_CONFIRMED = 'confirmed';

    /** @var list<string> */
    protected $fillable = [
        'purchase_order_id',
        'warehouse_id',
        'received_by',
        'grn_number',
        'status',
        'received_at',
        'supplier_do_number',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'received_at' => 'date',
        ];
    }

    protected static function newFactory(): Factory
    {
        return GoodReceiptNoteFactory::new();
    }

    /**
     * Generates the next yearly GRN number, e.g. GRN-2026-0001.
     */
    public static function nextNumber(): string
    {
        $year = now()->format('Y');
        $prefix = "GRN-{$year}-";

        $last = static::query()
            ->where('grn_number', 'like', $prefix.'%')
            ->orderByDesc('grn_number')
            ->value('grn_number');

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

    /** @return BelongsTo<Warehouse, $this> */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /** @return BelongsTo<User, $this> */
    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    /** @return HasMany<GoodReceiptNoteItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(GoodReceiptNoteItem::class);
    }
}
