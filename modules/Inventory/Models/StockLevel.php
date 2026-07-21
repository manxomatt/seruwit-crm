<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Product\Models\Product;

class StockLevel extends Model
{
    /** @use HasFactory<StockLevelFactory> */
    use HasFactory;

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'on_hand',
        'reserved',
    ];

    protected function casts(): array
    {
        return [
            'on_hand' => 'decimal:2',
            'reserved' => 'decimal:2',
        ];
    }

    public $timestamps = false;

    protected static function newFactory(): Factory
    {
        return \Modules\Inventory\Database\Factories\StockLevelFactory::new();
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<Warehouse, $this>
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function getAvailableAttribute(): string
    {
        return (string) ($this->on_hand - $this->reserved);
    }

    public function isLowStock(): bool
    {
        $threshold = $this->product?->reorder_threshold ?? 10;

        return $this->getAvailableAttribute() <= $threshold;
    }
}
