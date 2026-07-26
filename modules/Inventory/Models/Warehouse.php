<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Inventory\Support\WarehouseKind;

class Warehouse extends Model
{
    /** @use HasFactory<\Modules\Inventory\Database\Factories\WarehouseFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'location',
        'kind',
        'latitude',
        'longitude',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'kind' => WarehouseKind::class,
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    protected static function newFactory(): Factory
    {
        return \Modules\Inventory\Database\Factories\WarehouseFactory::new();
    }

    /**
     * @return HasMany<WarehouseLocation, $this>
     */
    public function locations(): HasMany
    {
        return $this->hasMany(WarehouseLocation::class);
    }

    /**
     * @return HasMany<StockLevel, $this>
     */
    public function stockLevels(): HasMany
    {
        return $this->hasMany(StockLevel::class);
    }

    /**
     * @return HasMany<StockMovement, $this>
     */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function acceptsPurchaseInbound(): bool
    {
        return ($this->kind ?? WarehouseKind::default())->acceptsPurchaseInbound();
    }

    public function acceptsSalesOutbound(): bool
    {
        return ($this->kind ?? WarehouseKind::default())->acceptsSalesOutbound();
    }

    /**
     * @param  Builder<Warehouse>  $query
     * @return Builder<Warehouse>
     */
    public function scopeOfKind(Builder $query, WarehouseKind|string $kind): Builder
    {
        $value = $kind instanceof WarehouseKind ? $kind->value : $kind;

        return $query->where('kind', $value);
    }

    /**
     * @param  Builder<Warehouse>  $query
     * @return Builder<Warehouse>
     */
    public function scopePurchaseInbound(Builder $query): Builder
    {
        return $query->where('kind', '!=', WarehouseKind::Showroom->value);
    }

    /**
     * @param  Builder<Warehouse>  $query
     * @return Builder<Warehouse>
     */
    public function scopeSalesOutbound(Builder $query): Builder
    {
        return $query->where('kind', '!=', WarehouseKind::Showroom->value);
    }

    public function createDefaultLocations(): void
    {
        foreach (WarehouseLocation::defaultLocations() as $loc) {
            $this->locations()->firstOrCreate(
                ['code' => $loc['code']],
                array_merge($loc, ['is_default' => true]),
            );
        }
    }

    /**
     * Users assigned to this site (warehouse_head / warehouse_manager).
     *
     * @return BelongsToMany<\App\Models\User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(\App\Models\User::class)->withTimestamps();
    }
}
