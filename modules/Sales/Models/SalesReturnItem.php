<?php

namespace Modules\Sales\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\WarehouseLocation;

class SalesReturnItem extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'sales_return_id',
        'so_item_id',
        'gin_item_id',
        'location_id',
        'quantity_returned',
        'batch_number',
        'expiry_date',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'quantity_returned' => 'decimal:2',
            'expiry_date' => 'date:Y-m-d',
        ];
    }

    /** @return BelongsTo<SalesReturn, $this> */
    public function salesReturn(): BelongsTo
    {
        return $this->belongsTo(SalesReturn::class);
    }

    /** @return BelongsTo<SalesOrderItem, $this> */
    public function salesOrderItem(): BelongsTo
    {
        return $this->belongsTo(SalesOrderItem::class, 'so_item_id');
    }

    /** @return BelongsTo<GoodsIssueNoteItem, $this> */
    public function ginItem(): BelongsTo
    {
        return $this->belongsTo(GoodsIssueNoteItem::class, 'gin_item_id');
    }

    /** @return BelongsTo<WarehouseLocation, $this> */
    public function location(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'location_id');
    }
}
