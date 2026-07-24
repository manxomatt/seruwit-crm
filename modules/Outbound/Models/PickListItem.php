<?php

namespace Modules\Outbound\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Orders\Models\DeliveryOrderItem;
use Modules\Product\Models\Product;

class PickListItem extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_PICKED = 'picked';

    public const STATUS_SHORT = 'short';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'pick_list_id',
        'delivery_order_item_id',
        'product_id',
        'quantity_requested',
        'quantity_picked',
        'suggested_location_id',
        'suggested_batch_number',
        'suggested_expiry_date',
        'location_id',
        'batch_number',
        'expiry_date',
        'status',
        'picked_by',
        'picked_at',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity_requested' => 'decimal:2',
            'quantity_picked' => 'decimal:2',
            'suggested_expiry_date' => 'date',
            'expiry_date' => 'date',
            'picked_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<PickList, $this>
     */
    public function pickList(): BelongsTo
    {
        return $this->belongsTo(PickList::class);
    }

    /**
     * @return BelongsTo<DeliveryOrderItem, $this>
     */
    public function deliveryOrderItem(): BelongsTo
    {
        return $this->belongsTo(DeliveryOrderItem::class);
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<WarehouseLocation, $this>
     */
    public function suggestedLocation(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'suggested_location_id');
    }

    /**
     * @return BelongsTo<WarehouseLocation, $this>
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'location_id');
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function picker(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'picked_by');
    }

    public function isFullyPicked(): bool
    {
        return (float) $this->quantity_picked + 0.009 >= (float) $this->quantity_requested;
    }
}
