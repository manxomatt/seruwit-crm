<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Inventory\Database\Factories\WarehouseLocationFactory;

class WarehouseLocation extends Model
{
    /** @use HasFactory<WarehouseLocationFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'warehouse_id',
        'parent_id',
        'name',
        'code',
        'type',
        'is_default',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function newFactory(): Factory
    {
        return WarehouseLocationFactory::new();
    }

    /** @return BelongsTo<Warehouse, $this> */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /** @return BelongsTo<self, $this> */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /** @return HasMany<self, $this> */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /** @return HasMany<StockLevel, $this> */
    public function stockLevels(): HasMany
    {
        return $this->hasMany(StockLevel::class, 'location_id');
    }

    /** @return HasMany<StockMovement, $this> */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'location_id');
    }

    /**
     * @return array<int, array{name: string, code: string, type: string}>
     */
    public static function defaultLocations(): array
    {
        return [
            ['name' => 'Stock', 'code' => 'STOCK', 'type' => 'internal', 'sort_order' => 1],
            ['name' => 'Input', 'code' => 'INPUT', 'type' => 'input', 'sort_order' => 2],
            ['name' => 'Output', 'code' => 'OUTPUT', 'type' => 'output', 'sort_order' => 3],
        ];
    }

    public function fullCode(): string
    {
        $parts = [$this->code];
        $parent = $this->parent;

        while ($parent) {
            $parts[] = $parent->code;
            $parent = $parent->parent;
        }

        return implode('/', array_reverse($parts));
    }
}
