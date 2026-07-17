<?php

namespace App\Models;

use App\Modules\PlanRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A subscription plan, listing the modules it entitles a tenant to install.
 *
 * Lives in the central database and is pinned to the central connection, so it
 * reads correctly from tenant context too. Prefer PlanRepository for reads all
 * the same: entitlement is checked many times per request and the repository
 * memoizes the whole (tiny) set.
 */
class Plan extends Model
{
    use HasFactory;

    /**
     * Pinned to the central connection.
     *
     * Tenancy swaps the default connection to the tenant's schema, where this
     * table does not exist — so without this, any read from tenant context (the
     * entitlement check on nearly every request) would explode. Safety by
     * construction rather than by remembering to wrap each call.
     */
    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'name',
        'description',
        'modules',
        'sort_order',
        'is_default',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'modules' => 'array',
            'sort_order' => 'integer',
            'is_default' => 'boolean',
        ];
    }

    /**
     * @param  Builder<$this>  $query
     */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('sort_order')->orderBy('key');
    }

    public function includesModule(string $moduleKey): bool
    {
        return in_array($moduleKey, $this->modules ?? [], true);
    }

    /**
     * Tenants currently on this plan, counted from their `data` JSON.
     *
     * Tenants store a plan key rather than a foreign key so that resolving a
     * tenant's plan never needs a join — which means this count is a JSON query
     * and the default plan must also sweep up tenants that carry no key at all.
     */
    public function tenantCount(): int
    {
        $query = Tenant::query()->whereJsonContains('data->plan', $this->key);

        if ($this->is_default) {
            $query->orWhereNull('data->plan');
        }

        return $query->count();
    }

    protected static function booted(): void
    {
        // Plans are memoized per request, so any write has to drop that memo or
        // the rest of the request keeps answering from the old definition.
        static::saved(fn () => app(PlanRepository::class)->flush());
        static::deleted(fn () => app(PlanRepository::class)->flush());
    }
}
