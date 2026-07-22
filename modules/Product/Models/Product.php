<?php

namespace Modules\Product\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\Warehouse;
use Modules\Product\Database\Factories\ProductFactory;

/**
 * Deliberately has no knowledge of Trip or any other consumer's cargo/stock
 * concept — Product exists so Transportation, and eventually an Inventory or
 * sales module, can reference the same catalog via `requires(): ['products']`
 * without this module depending back on any of them.
 */
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
        'brand_id',
        'product_type_id',
        'sku',
        'barcode',
        'name',
        'unit',
        'description',
        'price',
        'status',
        'category',
        'stock_unit',
        'reorder_threshold',
        'reorder_quantity',
        'warehouse_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'reorder_threshold' => 'integer',
            'reorder_quantity' => 'integer',
        ];
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

    /**
     * Generates the next sequential human-readable product code, e.g.
     * PROD-000001. Not safe against a race between two simultaneous store
     * requests, but product creation is a low-frequency, single-operator
     * action here — same trade-off as Customer::nextCode().
     */
    public static function nextCode(): string
    {
        $lastNumber = (int) static::query()
            ->orderByDesc('id')
            ->value('id');

        return sprintf('PROD-%06d', $lastNumber + 1);
    }
}
