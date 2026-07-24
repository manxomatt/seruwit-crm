<?php

namespace App\Models;

use App\Modules\PlanRepository;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
 * @property string|null $reseller_global_id
 */
class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

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
            'reseller_global_id',
        ];
    }
}
