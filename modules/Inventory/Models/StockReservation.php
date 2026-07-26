<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;
use Modules\Product\Models\Product;

class StockReservation extends Model
{
    public const STATUS_OPEN = 'open';

    public const STATUS_CLOSED = 'closed';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'delivery_order_id',
        'delivery_order_item_id',
        'sales_order_id',
        'sales_order_item_id',
        'product_id',
        'warehouse_id',
        'location_id',
        'batch_number',
        'expiry_date',
        'quantity',
        'consumed_quantity',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expiry_date' => 'date:Y-m-d',
            'quantity' => 'decimal:2',
            'consumed_quantity' => 'decimal:2',
        ];
    }

    public function remaining(): float
    {
        return max(0, round((float) $this->quantity - (float) $this->consumed_quantity, 2));
    }

    /**
     * @return BelongsTo<DeliveryOrder, $this>
     */
    public function deliveryOrder(): BelongsTo
    {
        return $this->belongsTo(DeliveryOrder::class);
    }

    /**
     * @return BelongsTo<DeliveryOrderItem, $this>
     */
    public function deliveryOrderItem(): BelongsTo
    {
        return $this->belongsTo(DeliveryOrderItem::class);
    }

    /**
     * @return BelongsTo<\Modules\Sales\Models\SalesOrder, $this>
     */
    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(\Modules\Sales\Models\SalesOrder::class);
    }

    /**
     * @return BelongsTo<\Modules\Sales\Models\SalesOrderItem, $this>
     */
    public function salesOrderItem(): BelongsTo
    {
        return $this->belongsTo(\Modules\Sales\Models\SalesOrderItem::class);
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<Warehouse, $this>
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * @return BelongsTo<WarehouseLocation, $this>
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'location_id');
    }
}
