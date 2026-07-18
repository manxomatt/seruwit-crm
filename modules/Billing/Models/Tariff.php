<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Billing\Database\Factories\TariffFactory;
use Modules\Customer\Models\Customer;

class Tariff extends Model
{
    /** @use HasFactory<TariffFactory> */
    use HasFactory;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return TariffFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'customer_id',
        'origin',
        'destination',
        'price',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * The customer this tariff is specific to; null means it applies to every
     * customer that has no tariff of its own for the route.
     *
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * The active tariff for a route, preferring a customer-specific one over a
     * general one. Addresses are free text on delivery orders, so matching is
     * exact (case-insensitive) — a typo simply yields no match and the charge
     * is priced manually instead of being guessed wrong silently.
     */
    public static function findFor(int $customerId, string $origin, string $destination): ?self
    {
        return static::query()
            ->active()
            ->whereRaw('LOWER(origin) = ?', [mb_strtolower(trim($origin))])
            ->whereRaw('LOWER(destination) = ?', [mb_strtolower(trim($destination))])
            ->where(fn (Builder $query) => $query->where('customer_id', $customerId)->orWhereNull('customer_id'))
            ->orderByRaw('customer_id is null')
            ->first();
    }
}
