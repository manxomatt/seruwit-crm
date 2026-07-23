<?php

namespace Modules\Product\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductAttributeValue extends Model
{
    protected $table = 'product_attribute_values';

    public $timestamps = false;

    /** @var list<string> */
    protected $fillable = [
        'extra_price',
        'product_id',
        'attribute_id',
        'product_attribute_id',
        'attribute_option_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'extra_price' => 'decimal:4',
        ];
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /** @return BelongsTo<ProductAttribute, $this> */
    public function attribute(): BelongsTo
    {
        return $this->belongsTo(ProductAttribute::class, 'attribute_id');
    }

    /** @return BelongsTo<ProductProductAttribute, $this> */
    public function productAttribute(): BelongsTo
    {
        return $this->belongsTo(ProductProductAttribute::class, 'product_attribute_id');
    }

    /** @return BelongsTo<ProductAttributeOption, $this> */
    public function option(): BelongsTo
    {
        return $this->belongsTo(ProductAttributeOption::class, 'attribute_option_id');
    }
}
