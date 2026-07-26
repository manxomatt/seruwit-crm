<?php

namespace Modules\Sales\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Inventory\Models\Warehouse;
use Modules\Sales\Database\Factories\GoodsIssueNoteFactory;

class GoodsIssueNote extends Model
{
    /** @use HasFactory<GoodsIssueNoteFactory> */
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_VOIDED = 'voided';

    /** @var list<string> */
    protected $fillable = [
        'sales_order_id',
        'warehouse_id',
        'issued_by',
        'gin_number',
        'status',
        'issued_at',
        'delivery_note_number',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'issued_at' => 'date:Y-m-d',
        ];
    }

    protected static function newFactory(): Factory
    {
        return GoodsIssueNoteFactory::new();
    }

    /**
     * Generates the next yearly GIN number, e.g. GIN-2026-0001.
     */
    public static function nextNumber(): string
    {
        $year = now()->format('Y');
        $prefix = "GIN-{$year}-";

        $last = static::query()
            ->where('gin_number', 'like', $prefix.'%')
            ->orderByDesc('gin_number')
            ->value('gin_number');

        $sequence = 1;
        if (is_string($last) && preg_match('/(\d+)$/', $last, $matches) === 1) {
            $sequence = (int) $matches[1] + 1;
        }

        return sprintf('%s%04d', $prefix, $sequence);
    }

    /** @return BelongsTo<SalesOrder, $this> */
    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    /** @return BelongsTo<Warehouse, $this> */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /** @return BelongsTo<User, $this> */
    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    /** @return HasMany<GoodsIssueNoteItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(GoodsIssueNoteItem::class);
    }
}
