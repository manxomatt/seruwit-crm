<?php

namespace App\Actions\Tenancy;

use App\Models\CentralUser;
use App\Models\Tenant;
use App\Support\SystemMode;

class CreateTenantAction
{
    /**
     * Provision a new tenant owned by the given central user.
     *
     * Fires TenantCreated which queues the database pipeline:
     * CreateDatabase → MigrateDatabase → SeedDatabase → FinalizeTenantSetupJob.
     * The $setup array is stored in the tenant's data JSON so FinalizeTenantSetupJob
     * can assign roles, seed pages, and install modules once the schema is ready.
     *
     * Note: intentionally not wrapped in a transaction — the pipeline runs
     * DDL on a separate connection that cannot see uncommitted changes.
     *
     * @param  array<string, mixed>  $setup
     */
    public function execute(string $companyName, string $subdomain, CentralUser $owner, ?string $resellerGlobalId = null, array $setup = []): Tenant
    {
        $fullDomain = self::fullDomain($subdomain);

        $tenant = Tenant::create([
            'name' => $companyName,
            'reseller_global_id' => $resellerGlobalId,
            'can_install_demo_data' => SystemMode::isDevelopment(),
            'provision' => array_merge(['owner_global_id' => $owner->global_id], $setup),
        ]);

        // Domain first: Tenant::create can leave an orphan row if a later step
        // fails, and admin update previously could not create a missing domain.
        $tenant->domains()->firstOrCreate(['domain' => $fullDomain]);

        // Owner sync is deferred to FinalizeTenantSetupJob, which runs after the
        // schema is created (end of the pipeline). This ensures the tenant schema
        // exists when UpdateSyncedResource tries to copy the user row into it.

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
