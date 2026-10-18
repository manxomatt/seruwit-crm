<?php

namespace Modules\Rental\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RentalAddon extends Model
{
    use HasFactory;

    protected $table = 'rental_addons';

    protected $fillable = [
        'code',
        'name',
        'category',
        'description',
        'icon',
        'price_type',
        'price',
        'max_quantity',
        'is_active',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'float',
            'max_quantity' => 'integer',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @param  Builder<RentalAddon>  $query
     * @return Builder<RentalAddon>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @param  Builder<RentalAddon>  $query
     * @return Builder<RentalAddon>
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('id');
    }
}
