<?php

namespace Modules\Shuttle\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShuttleCity extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'code',
        'name',
        'province',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<ShuttlePool, $this>
     */
    public function pools(): HasMany
    {
        return $this->hasMany(ShuttlePool::class, 'city_id');
    }
}
