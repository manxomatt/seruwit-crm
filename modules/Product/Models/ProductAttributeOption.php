<?php

namespace Modules\Product\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Product\Database\Factories\ProductAttributeOptionFactory;

class ProductAttributeOption extends Model
{
    /** @use HasFactory<ProductAttributeOptionFactory> */
    use HasFactory;

    protected $table = 'product_attribute_options';

    protected static function newFactory(): Factory
    {
        return ProductAttributeOptionFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'attribute_id',
        'name',
        'color',
        'extra_price',
        'sort',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'extra_price' => 'decimal:4',
            'sort' => 'integer',
        ];
    }

    /** @return BelongsTo<ProductAttribute, $this> */
    public function attribute(): BelongsTo
    {
        return $this->belongsTo(ProductAttribute::class, 'attribute_id');
    }
}
