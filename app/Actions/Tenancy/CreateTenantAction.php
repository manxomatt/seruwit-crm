<?php

namespace App\Actions\Tenancy;

use App\Models\CentralUser;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;

class CreateTenantAction
{
    /**
     * Provision a new tenant owned by the given central user.
     *
     * When a reseller creates the tenant, $resellerGlobalId is stored so the
     * tenant is permanently scoped to that reseller's management portal.
     *
     * Note: intentionally not wrapped in a transaction — the pipeline runs
     * DDL on a separate connection that cannot see uncommitted changes.
     */
    public function execute(string $companyName, string $subdomain, CentralUser $owner, ?string $resellerGlobalId = null): Tenant
    {
        $fullDomain = self::fullDomain($subdomain);

        $tenant = Tenant::create([
            'name' => $companyName,
            'reseller_global_id' => $resellerGlobalId,
        ]);

        // Domain first: Tenant::create can leave an orphan row if a later step
        // fails, and admin update previously could not create a missing domain.
        $tenant->domains()->firstOrCreate(['domain' => $fullDomain]);

        $owner->tenants()->syncWithoutDetaching([$tenant->getTenantKey()]);

        $tenant->run(function () use ($owner, $tenant): void {
            $user = User::query()->firstWhere('global_id', $owner->global_id);

            if ($user === null) {
                throw new \RuntimeException(
                    "Owner [{$owner->email}] was not synced into tenant [{$tenant->getTenantKey()}].",
                );
            }

            if ($user->email_verified_at === null) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }

            $user->assignRole(Role::query()->where('slug', 'admin')->firstOrFail());
        });

        return $tenant;
    }

    /**
     * Build the full domain for a subdomain, e.g. "acme" => "acme.seruwit.com".
     *
     * Uses tenancy.tenant_base_domain (TENANT_BASE_DOMAIN or APP_URL host).
     */
    public static function fullDomain(string $subdomain): string
    {
        $centralHost = (string) (config('tenancy.tenant_base_domain') ?: 'localhost');

        return $subdomain.'.'.$centralHost;
    }
}
