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

    public const KEY_TRIAL = 'trial';

    /**
     * Modules a self-serve trial tenant is entitled to install.
     *
     * Defaults (content modules) plus both vertical packs' transitive deps.
     * Install still picks packs at onboarding — this only unlocks entitlement.
     *
     * @return list<string>
     */
    public static function trialModuleKeys(): array
    {
        return [
            'carousels',
            'document',
            'fleet',
            'invoicing',
            'maintenance',
            'pages',
            'posts',
            'receivables',
            'rental',
            'shuttle',
            'tracking',
        ];
    }

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
        'badge',
        'is_popular',
        'modules',
        'limits',
        'features_list',
        'sort_order',
        'is_default',
        'price',
        'original_price',
        'annual_price',
        'annual_original_price',
        'currency',
        'interval',
        'trial_days',
        'is_trial',
        'is_active',
        'pricing_model',
        'subscription_tier_id',
        'allow_payg_upgrade',
        'include_trial',
        'trial_duration_days',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_popular' => 'boolean',
            'modules' => 'array',
            'limits' => 'array',
            'features_list' => 'array',
            'sort_order' => 'integer',
            'is_default' => 'boolean',
            'price' => 'decimal:2',
            'original_price' => 'decimal:2',
            'annual_price' => 'decimal:2',
            'annual_original_price' => 'decimal:2',
            'trial_days' => 'integer',
            'is_trial' => 'boolean',
            'is_active' => 'boolean',
            'allow_payg_upgrade' => 'boolean',
            'include_trial' => 'boolean',
            'trial_duration_days' => 'integer',
        ];
    }

    /**
     * Get a specific limit value from the limits JSON array.
     */
    public function getLimit(string $key, mixed $default = null): mixed
    {
        return $this->limits[$key] ?? $default;
    }

    /**
     * Check if a specific limit key is defined in the limits JSON array.
     */
    public function hasLimit(string $key): bool
    {
        return array_key_exists($key, $this->limits ?? []);
    }

    /**
     * @param  Builder<$this>  $query
     */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('sort_order')->orderBy('key');
    }

    /**
     * Plans that may be shown to tenants and used for new transactions.
     *
     * Inactive plans stay visible in the plan manager and keep serving tenants
     * already subscribed to them — they are only hidden from selection.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    public function includesModule(string $moduleKey): bool
    {
        return in_array($moduleKey, $this->modules ?? [], true);
    }

    public function subscriptionTier()
    {
        return $this->belongsTo(SubscriptionTier::class);
    }

    public function isPayg(): bool
    {
        return $this->pricing_model === 'payg';
    }

    public function isFixed(): bool
    {
        return $this->pricing_model === 'fixed';
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
