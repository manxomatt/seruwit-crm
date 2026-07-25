<?php

namespace Modules\Sales\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Product\Models\Product;
use Modules\Product\Models\ProductPackaging;
use Modules\Sales\Database\Factories\SalesOrderItemFactory;

class SalesOrderItem extends Model
{
    /** @use HasFactory<SalesOrderItemFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'sales_order_id',
        'product_id',
        'product_packaging_id',
        'quantity_ordered',
        'quantity_delivered',
        'unit_price',
        'unit',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'quantity_ordered' => 'decimal:2',
            'quantity_delivered' => 'decimal:2',
            'unit_price' => 'decimal:2',
        ];
    }

    protected static function newFactory(): Factory
    {
        return SalesOrderItemFactory::new();
    }

    public function remainingQuantity(): float
    {
        return max(0, (float) $this->quantity_ordered - (float) $this->quantity_delivered);
    }

    public function lineTotal(): float
    {
        return (float) $this->quantity_ordered * (float) $this->unit_price;
    }

    /** @return BelongsTo<SalesOrder, $this> */
    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /** @return BelongsTo<ProductPackaging, $this> */
    public function packaging(): BelongsTo
    {
        return $this->belongsTo(ProductPackaging::class, 'product_packaging_id');
    }

    /** @return HasMany<GoodsIssueNoteItem, $this> */
    public function goodsIssueNoteItems(): HasMany
    {
        return $this->hasMany(GoodsIssueNoteItem::class, 'so_item_id');
    }
}
