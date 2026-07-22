<?php

namespace Modules\Product\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Modules\Product\Database\Factories\PrincipalFactory;

class Principal extends Model
{
    /** @use HasFactory<PrincipalFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return PrincipalFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'code',
        'name',
        'contact_person',
        'phone',
        'email',
        'address',
        'status',
    ];

    /** @return HasMany<Brand, $this> */
    public function brands(): HasMany
    {
        return $this->hasMany(Brand::class);
    }

    /** @return HasManyThrough<Product, Brand, $this> */
    public function products(): HasManyThrough
    {
        return $this->hasManyThrough(Product::class, Brand::class);
    }

    public static function nextCode(): string
    {
        $lastNumber = (int) static::query()
            ->orderByDesc('id')
            ->value('id');

        return sprintf('PRC-%06d', $lastNumber + 1);
    }
}
