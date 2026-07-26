<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Product\Models\Product;

class StockOpnameItem extends Model
{
    /** @use HasFactory<StockOpnameItemFactory> */
    use HasFactory;

    protected $fillable = [
        'opname_id',
        'product_id',
        'location_id',
        'batch_number',
        'expiry_date',
        'system_qty',
        'actual_qty',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'system_qty' => 'decimal:2',
            'actual_qty' => 'decimal:2',
            'expiry_date' => 'date:Y-m-d',
        ];
    }

    protected static function newFactory(): Factory
    {
        return \Modules\Inventory\Database\Factories\StockOpnameItemFactory::new();
    }

    /**
     * @return BelongsTo<StockOpname, $this>
     */
    public function opname(): BelongsTo
    {
        return $this->belongsTo(StockOpname::class, 'opname_id');
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<WarehouseLocation, $this>
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'location_id');
    }

    public function getVarianceAttribute(): string
    {
        if ($this->actual_qty === null || $this->system_qty === null) {
            return '—';
        }

        return (string) ($this->actual_qty - $this->system_qty);
    }
}
