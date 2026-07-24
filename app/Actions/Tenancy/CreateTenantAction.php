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
        $tenant = Tenant::create([
            'name' => $companyName,
            'reseller_global_id' => $resellerGlobalId,
        ]);

        $tenant->domains()->create(['domain' => self::fullDomain($subdomain)]);

        $owner->tenants()->attach($tenant->getTenantKey());

        $tenant->run(function () use ($owner): void {
            User::query()
                ->firstWhere('global_id', $owner->global_id)
                ->assignRole(Role::query()->where('slug', 'admin')->firstOrFail());
        });

        return $tenant;
    }

    /**
     * Build the full domain for a subdomain, e.g. "acme" => "acme.localhost".
     */
    public static function fullDomain(string $subdomain): string
    {
        $centralHost = parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost';

        return $subdomain.'.'.$centralHost;
    }
}
