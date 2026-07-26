<?php

namespace Modules\Sales\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Partners\Models\Partner;

class PriceList extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'name',
        'code',
        'is_active',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /** @return HasMany<PriceListItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(PriceListItem::class);
    }

    /** @return HasMany<Partner, $this> */
    public function partners(): HasMany
    {
        return $this->hasMany(Partner::class);
    }

    public static function nextCode(): string
    {
        $prefix = 'PL-';
        $last = static::query()
            ->where('code', 'like', $prefix.'%')
            ->orderByDesc('code')
            ->value('code');

        $sequence = 1;
        if (is_string($last) && preg_match('/(\d+)$/', $last, $matches) === 1) {
            $sequence = (int) $matches[1] + 1;
        }

        return sprintf('%s%04d', $prefix, $sequence);
    }
}
