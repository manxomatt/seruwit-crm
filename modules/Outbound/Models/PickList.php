<?php

namespace Modules\Outbound\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Inventory\Models\Warehouse;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Outbound\Database\Factories\PickListFactory;

class PickList extends Model
{
    /** @use HasFactory<PickListFactory> */
    use HasFactory;

    public const STATUS_OPEN = 'open';

    public const STATUS_PICKING = 'picking';

    public const STATUS_PICKED = 'picked';

    public const STATUS_PACKING = 'packing';

    public const STATUS_PACKED = 'packed';

    public const STATUS_DISPATCHED = 'dispatched';

    public const STATUS_CANCELLED = 'cancelled';

    protected static function newFactory(): Factory
    {
        return PickListFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'delivery_order_id',
        'warehouse_id',
        'status',
        'generated_by',
        'generated_at',
        'picked_at',
        'packed_at',
        'dispatched_at',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'generated_at' => 'datetime',
            'picked_at' => 'datetime',
            'packed_at' => 'datetime',
            'dispatched_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<DeliveryOrder, $this>
     */
    public function deliveryOrder(): BelongsTo
    {
        return $this->belongsTo(DeliveryOrder::class);
    }

    /**
     * @return BelongsTo<Warehouse, $this>
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * @return HasMany<PickListItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PickListItem::class)->orderBy('id');
    }

    /**
     * @return HasMany<Pack, $this>
     */
    public function packs(): HasMany
    {
        return $this->hasMany(Pack::class)->orderBy('id');
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function generator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'generated_by');
    }

    public function isCancellable(): bool
    {
        return in_array($this->status, [
            self::STATUS_OPEN,
            self::STATUS_PICKING,
            self::STATUS_PICKED,
            self::STATUS_PACKING,
            self::STATUS_PACKED,
        ], true);
    }

    public static function nextCode(): string
    {
        $year = now()->format('Y');
        $prefix = "PL-{$year}-";

        $last = static::query()
            ->where('code', 'like', $prefix.'%')
            ->orderByDesc('code')
            ->value('code');

        $seq = $last ? ((int) substr((string) $last, -4)) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
