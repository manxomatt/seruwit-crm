<?php

namespace Modules\Product\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Inventory\Models\Warehouse;
use Modules\Product\Database\Factories\ProductFactory;

class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return ProductFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'parent_id',
        'brand_id',
        'product_type_id',
        'sku',
        'barcode',
        'name',
        'unit',
        'description',
        'description_sale',
        'description_purchase',
        'price',
        'cost',
        'weight',
        'volume',
        'status',
        'category',
        'stock_unit',
        'reorder_threshold',
        'reorder_quantity',
        'warehouse_id',
        'is_favorite',
        'is_storable',
        'images',
        'tracking',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'cost' => 'decimal:4',
            'weight' => 'decimal:4',
            'volume' => 'decimal:4',
            'reorder_threshold' => 'integer',
            'reorder_quantity' => 'integer',
            'is_favorite' => 'boolean',
            'is_storable' => 'boolean',
            'images' => 'array',
        ];
    }

    /** @return BelongsTo<self, $this> */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /** @return HasMany<self, $this> */
    public function variants(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /** @return BelongsTo<Brand, $this> */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /** @return BelongsTo<ProductType, $this> */
    public function productType(): BelongsTo
    {
        return $this->belongsTo(ProductType::class);
    }

    /** @return BelongsTo<Warehouse, $this> */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /** @return BelongsToMany<ProductTag, $this> */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(ProductTag::class, 'product_product_tag', 'product_id', 'tag_id');
    }

    /** @return HasMany<ProductPackaging, $this> */
    public function packagings(): HasMany
    {
        return $this->hasMany(ProductPackaging::class)->orderBy('sort');
    }

    /** @return HasMany<ProductProductAttribute, $this> */
    public function productAttributes(): HasMany
    {
        return $this->hasMany(ProductProductAttribute::class)->orderBy('sort');
    }

    /** @return HasMany<ProductAttributeValue, $this> */
    public function attributeValues(): HasMany
    {
        return $this->hasMany(ProductAttributeValue::class);
    }

    /** @return HasMany<ProductCombination, $this> */
    public function combinations(): HasMany
    {
        return $this->hasMany(ProductCombination::class);
    }

    public function isService(): bool
    {
        return $this->category === 'service';
    }

    public static function nextCode(): string
    {
        $lastNumber = (int) static::query()
            ->orderByDesc('id')
            ->value('id');

        return sprintf('PROD-%06d', $lastNumber + 1);
    }
}
