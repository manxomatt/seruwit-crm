<?php

namespace Modules\Purchasing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\WarehouseLocation;

class PurchaseReturnItem extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'purchase_return_id',
        'po_item_id',
        'grn_item_id',
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

    /** @return BelongsTo<PurchaseReturn, $this> */
    public function purchaseReturn(): BelongsTo
    {
        return $this->belongsTo(PurchaseReturn::class);
    }

    /** @return BelongsTo<PurchaseOrderItem, $this> */
    public function purchaseOrderItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderItem::class, 'po_item_id');
    }

    /** @return BelongsTo<GoodReceiptNoteItem, $this> */
    public function grnItem(): BelongsTo
    {
        return $this->belongsTo(GoodReceiptNoteItem::class, 'grn_item_id');
    }

    /** @return BelongsTo<WarehouseLocation, $this> */
    public function location(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'location_id');
    }
}
