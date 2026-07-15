<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
 */
class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    /**
     * The subscription plan this tenant is on.
     *
     * Stored as a virtual column so it rides along with the tenant record that
     * tenancy already loads on every request — resolving entitlement then costs
     * nothing. Falls back to the default plan for tenants created before plans
     * existed.
     */
    public function planKey(): string
    {
        return $this->plan ?? config('modules.default_plan');
    }

    /**
     * @return array<string, mixed>|null
     */
    public function planConfig(): ?array
    {
        return config('modules.plans.'.$this->planKey());
    }

    /**
     * Module keys this tenant's plan permits it to install.
     *
     * @return list<string>
     */
    public function entitledModuleKeys(): array
    {
        return $this->planConfig()['modules'] ?? [];
    }

    public function isEntitledTo(string $moduleKey): bool
    {
        return in_array($moduleKey, $this->entitledModuleKeys(), true);
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
        ];
    }
}
