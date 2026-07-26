<?php

namespace Modules\Sales\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Product\Models\Product;

class PriceListItem extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'price_list_id',
        'product_id',
        'unit_price',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<PriceList, $this> */
    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
