<?php

namespace Modules\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Product\Models\Product;
use Modules\Product\Models\ProductPackaging;

class PosSaleItem extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'pos_sale_id',
        'product_id',
        'product_packaging_id',
        'quantity',
        'qty_base',
        'unit_price',
        'line_discount',
        'tax_amount',
        'line_total',
        'unit',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'qty_base' => 'decimal:3',
            'unit_price' => 'decimal:2',
            'line_discount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'line_total' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<PosSale, $this>
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(PosSale::class, 'pos_sale_id');
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<ProductPackaging, $this>
     */
    public function packaging(): BelongsTo
    {
        return $this->belongsTo(ProductPackaging::class, 'product_packaging_id');
    }
}
