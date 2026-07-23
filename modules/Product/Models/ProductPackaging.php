<?php

namespace Modules\Product\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Product\Database\Factories\ProductPackagingFactory;

class ProductPackaging extends Model
{
    /** @use HasFactory<ProductPackagingFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return ProductPackagingFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'product_id',
        'name',
        'barcode',
        'qty',
        'sort',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'qty' => 'decimal:4',
            'sort' => 'integer',
        ];
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
