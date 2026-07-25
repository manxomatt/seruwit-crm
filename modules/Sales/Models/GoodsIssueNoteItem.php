<?php

namespace Modules\Sales\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Sales\Database\Factories\GoodsIssueNoteItemFactory;

class GoodsIssueNoteItem extends Model
{
    /** @use HasFactory<GoodsIssueNoteItemFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'goods_issue_note_id',
        'so_item_id',
        'location_id',
        'quantity_issued',
        'batch_number',
        'expiry_date',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'quantity_issued' => 'decimal:2',
            'expiry_date' => 'date',
        ];
    }

    protected static function newFactory(): Factory
    {
        return GoodsIssueNoteItemFactory::new();
    }

    /** @return BelongsTo<GoodsIssueNote, $this> */
    public function goodsIssueNote(): BelongsTo
    {
        return $this->belongsTo(GoodsIssueNote::class);
    }

    /** @return BelongsTo<SalesOrderItem, $this> */
    public function salesOrderItem(): BelongsTo
    {
        return $this->belongsTo(SalesOrderItem::class, 'so_item_id');
    }

    /** @return BelongsTo<WarehouseLocation, $this> */
    public function location(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'location_id');
    }
}
