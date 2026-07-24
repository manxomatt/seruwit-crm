<?php

namespace Modules\Purchasing\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Purchasing\Database\Factories\GoodReceiptNoteItemFactory;

class GoodReceiptNoteItem extends Model
{
    /** @use HasFactory<GoodReceiptNoteItemFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'good_receipt_note_id',
        'po_item_id',
        'location_id',
        'quantity_received',
        'batch_number',
        'expiry_date',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'quantity_received' => 'decimal:2',
            'expiry_date' => 'date',
        ];
    }

    protected static function newFactory(): Factory
    {
        return GoodReceiptNoteItemFactory::new();
    }

    /** @return BelongsTo<GoodReceiptNote, $this> */
    public function goodReceiptNote(): BelongsTo
    {
        return $this->belongsTo(GoodReceiptNote::class);
    }

    /** @return BelongsTo<PurchaseOrderItem, $this> */
    public function purchaseOrderItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderItem::class, 'po_item_id');
    }

    /** @return BelongsTo<WarehouseLocation, $this> */
    public function location(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'location_id');
    }
}
