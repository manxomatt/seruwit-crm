<?php

namespace Modules\Partners\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Partners\Database\Factories\LocationFactory;

class Location extends Model
{
    /** @use HasFactory<LocationFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return LocationFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'name',
        'address',
        'city',
        'province',
        'zip',
        'latitude',
        'longitude',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function displayAddress(): string
    {
        $parts = array_filter([
            $this->address,
            $this->city,
            $this->province,
            $this->zip,
        ], fn ($part) => filled($part));

        return implode(', ', $parts) ?: $this->name;
    }

    /**
     * Match a free-text label (warehouse site, typed address, city name) to a
     * master location. Exact, case-insensitive — deliberately strict so a typo
     * does not silently attach the wrong coordinates or tariff.
     */
    public static function findMatching(?string $needle): ?self
    {
        if (! filled($needle)) {
            return null;
        }

        $normalized = mb_strtolower(trim($needle));

        return static::query()
            ->active()
            ->where(function (Builder $query) use ($normalized): void {
                $query->whereRaw('LOWER(code) = ?', [$normalized])
                    ->orWhereRaw('LOWER(name) = ?', [$normalized])
                    ->orWhereRaw('LOWER(address) = ?', [$normalized]);
            })
            ->first();
    }

    public static function nextCode(string $prefix = 'LOC'): string
    {
        $lastNumber = (int) static::query()->orderByDesc('id')->value('id');

        do {
            $lastNumber++;
            $code = sprintf('%s-%04d', $prefix, $lastNumber);
        } while (static::query()->where('code', $code)->exists());

        return $code;
    }
}
