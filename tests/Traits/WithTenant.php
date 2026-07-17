<?php

namespace Tests\Traits;

use App\Actions\Tenancy\CreateTenantAction;
use App\Models\CentralUser;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;

/**
 * Shared setup for tests that provision real tenant schemas.
 *
 * DatabaseMigrations (not RefreshDatabase) on purpose: tenant provisioning
 * issues DDL (CREATE/DROP SCHEMA) that must commit, which deadlocks inside
 * the transaction RefreshDatabase wraps around each test.
 *
 * tearDown is defined here rather than as a tearDownWithTenant() hook because
 * Laravel registers those hooks *after* DatabaseMigrations' own rollback
 * callback, which would drop the central `tenants` table before we could read
 * it to clean up the schemas.
 */
trait WithTenant
{
    use DatabaseMigrations;

    /**
     * Called by Laravel after the database is migrated.
     *
     * Plans are a platform prerequisite now: without a default plan a tenant is
     * entitled to nothing, so provisioning one would produce a workspace that
     * cannot install a single module.
     */
    protected function setUpWithTenant(): void
    {
        $this->seed(PlanSeeder::class);
    }

    protected function tearDown(): void
    {
        // End tenancy first so the default connection points back at the
        // central database, then delete tenants to trigger the DeleteDatabase
        // pipeline that drops the schemas created during the test.
        tenancy()->end();
        Tenant::query()->get()->each->delete();

        parent::tearDown();
    }

    /**
     * Provision a tenant the way registration does: create the owner identity
     * in central, then run the full create → migrate → seed pipeline.
     */
    protected function provisionTenant(string $company, string $subdomain, string $ownerEmail): Tenant
    {
        User::factory()->create(['email' => $ownerEmail]);

        return app(CreateTenantAction::class)->execute(
            companyName: $company,
            subdomain: $subdomain,
            owner: CentralUser::query()->firstWhere('email', $ownerEmail),
        );
    }
}
