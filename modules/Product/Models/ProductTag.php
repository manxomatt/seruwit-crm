<?php

namespace Modules\Product\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Product\Database\Factories\ProductTagFactory;

class ProductTag extends Model
{
    /** @use HasFactory<ProductTagFactory> */
    use HasFactory;

    use SoftDeletes;

    protected static function newFactory(): Factory
    {
        return ProductTagFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'name',
        'color',
    ];

    /** @return BelongsToMany<Product, $this> */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_product_tag', 'tag_id', 'product_id');
    }
}
