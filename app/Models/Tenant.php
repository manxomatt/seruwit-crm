<?php

namespace App\Models;

use App\Modules\PlanRepository;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Database\Models\TenantPivot;

/**
 * Platform-level tenant profile & contact fields are stored as virtual columns
 * in the `data` JSON column (no migration needed). In-app branding/config lives
 * in each tenant's own Settings, not here.
 *
 * @property string|null $billing_email
 * @property string|null $phone
 * @property string|null $address
 * @property string|null $tax_id
 * @property string|null $notes
 * @property string|null $plan
 * @property bool|null $can_install_demo_data
 * @property string|null $reseller_global_id
 * @property \Illuminate\Support\Carbon|null $reseller_attributed_at
 * @property \Illuminate\Support\Carbon|null $reseller_attribution_ends_at
 */
class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
            'is_trial_expired' => 'boolean',
            'can_install_demo_data' => 'boolean',
            'max_vehicles_allowed' => 'integer',
            'unit_capacity_credits' => 'integer',
            'reseller_attributed_at' => 'datetime',
            'reseller_attribution_ends_at' => 'datetime',
        ];
    }

    /**
     * The subscription plan this tenant is on.
     *
     * The key is a virtual column, so it rides along with the tenant record that
     * tenancy already loads — no join to resolve a tenant's plan. Falls back to
     * the default plan, which is what every tenant created before plans existed
     * lands on.
     */
    public function planKey(): ?string
    {
        return $this->plan ?? app(PlanRepository::class)->defaultKey();
    }

    /**
     * Whether this workspace may install demo datasets from the modules catalog.
     * Controlled by central admins (virtual column on tenant data JSON).
     */
    public function canInstallDemoData(): bool
    {
        return filter_var($this->can_install_demo_data ?? false, FILTER_VALIDATE_BOOLEAN);
    }

    public function planModel(): ?Plan
    {
        $key = $this->planKey();

        return $key ? app(PlanRepository::class)->find($key) : null;
    }

    /**
     * Module keys this tenant's plan permits it to install.
     *
     * @return list<string>
     */
    public function entitledModuleKeys(): array
    {
        return $this->planModel()?->modules ?? [];
    }

    public function isEntitledTo(string $moduleKey): bool
    {
        return in_array($moduleKey, $this->entitledModuleKeys(), true);
    }

    public function planLimit(string $key, mixed $default = null): mixed
    {
        if ($key === 'max_vehicles') {
            return app(\App\Services\SubscriptionService::class)->getMaxVehiclesAllowed($this);
        }

        $plan = $this->planModel();
        if (! $plan) {
            return $default;
        }

        if ($key === 'max_branches' || $key === 'max_bases') {
            return $plan->getLimit('max_branches', $plan->getLimit('max_bases', $default));
        }

        return $plan->getLimit($key, $default);
    }

    /**
     * Check if a specific limit key has a finite threshold (>= 0).
     */
    public function hasFiniteLimit(string $key): bool
    {
        $limit = $this->planLimit($key);

        return $limit !== null && (int) $limit >= 0;
    }

    /**
     * Check if the tenant has reached or exceeded the quota for a given limit key.
     */
    public function hasReachedLimit(string $key, int $currentCount): bool
    {
        $limit = $this->planLimit($key);

        if ($limit === null) {
            return false;
        }

        return $currentCount >= (int) $limit;
    }

    /**
     * The reseller who owns this tenant (null = directly owned by platform).
     *
     * @return BelongsTo<CentralUser, $this>
     */
    public function reseller(): BelongsTo
    {
        return $this->belongsTo(CentralUser::class, 'reseller_global_id', 'global_id');
    }

    /**
     * Whether this tenant's payments still earn its reseller a commission.
     *
     * The end date is stamped on the tenant when it is attributed, so shortening
     * or lifting the platform-wide attribution window never changes what an
     * already-attributed tenant is worth.
     */
    public function hasActiveResellerAttribution(): bool
    {
        if ($this->reseller_global_id === null) {
            return false;
        }

        return $this->reseller_attribution_ends_at === null
            || $this->reseller_attribution_ends_at->isFuture();
    }

    /**
     * @return HasMany<ResellerCommission, $this>
     */
    public function resellerCommissions(): HasMany
    {
        return $this->hasMany(ResellerCommission::class);
    }

    /**
     * The central user identities that are members of this tenant.
     *
     * @return BelongsToMany<CentralUser, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(CentralUser::class, 'tenant_users', 'tenant_id', 'global_user_id', 'id', 'global_id')
            ->using(TenantPivot::class)
            ->withTimestamps();
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    /**
     * @return HasMany<TenantCapacityTransaction, $this>
     */
    public function capacityTransactions(): HasMany
    {
        return $this->hasMany(TenantCapacityTransaction::class)->orderByDesc('created_at');
    }

    public function getIsOnTrialAttribute(): bool
    {
        $isExpired = filter_var($this->is_trial_expired ?? false, FILTER_VALIDATE_BOOLEAN)
            || filter_var(data_get($this->data, 'is_trial_expired', false), FILTER_VALIDATE_BOOLEAN)
            || ($this->status === 'trial_expired');

        if ($isExpired) {
            return false;
        }

        $plan = $this->planModel();
        if ($plan && ! $plan->is_trial && $plan->key !== 'trial' && ((float) $plan->price <= 0 || (int) ($plan->trial_days ?? 0) <= 0)) {
            return false;
        }

        if ($this->trial_ends_at === null) {
            return false;
        }

        $trialEndsAt = $this->trial_ends_at instanceof \Carbon\CarbonInterface
            ? $this->trial_ends_at
            : \Illuminate\Support\Carbon::parse($this->trial_ends_at);

        return $trialEndsAt->isFuture();
    }

    public function scopeOnTrial($query)
    {
        return $query->where('trial_ends_at', '>', now());
    }

    public function scopeTrialExpired($query)
    {
        return $query->where('trial_ends_at', '<=', now())
            ->where('is_trial_expired', false);
    }

    /**
     * Attributes stored as real columns; everything else goes into the data JSON column.
     *
     * @return array<int, string>
     */
    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'status',
            'subscription_type',
            'max_vehicles_allowed',
            'unit_capacity_credits',
            'subscription_id',
            'reseller_global_id',
            'reseller_attributed_at',
            'reseller_attribution_ends_at',
            'trial_ends_at',
            'is_trial_expired',
        ];
    }
}
