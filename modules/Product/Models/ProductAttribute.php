<?php

namespace Modules\Product\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Product\Database\Factories\ProductAttributeFactory;

class ProductAttribute extends Model
{
    /** @use HasFactory<ProductAttributeFactory> */
    use HasFactory;

    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'type',
        'sort',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort' => 'integer',
        ];
    }

    protected static function newFactory(): Factory
    {
        return ProductAttributeFactory::new();
    }

    /** @return HasMany<ProductAttributeOption, $this> */
    public function options(): HasMany
    {
        return $this->hasMany(ProductAttributeOption::class, 'attribute_id')->orderBy('sort');
    }
}
