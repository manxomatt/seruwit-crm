<?php

namespace Tests\Feature\Security;

use App\Models\CentralUser;
use App\Models\Tenant;
use App\Models\Todo;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

/**
 * Priority 1 security suite: what a workspace customer can reach on the
 * central domain.
 *
 * EnsureCentralUserCanAccessModule pushes SaaS customers back to the workspace
 * portal, but it only inspects `module/*`. routes/app.php also mounts
 * /dashboard, /todos, and /live-updates outside that prefix, and app.php is
 * included by routes/web.php under the central domain — so those paths are
 * served by the central domain against the *central* schema.
 *
 * These tests pin down where that boundary actually sits today.
 */
class CentralDomainExposureTest extends TestCase
{
    use DatabaseMigrations;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PlanSeeder::class);
    }

    protected function tearDown(): void
    {
        tenancy()->end();

        Tenant::query()->get()->each(function (Tenant $tenant): void {
            File::deleteDirectory(storage_path('tenant'.$tenant->id));
            $tenant->delete();
        });

        parent::tearDown();
    }

    private function provisionTenant(string $company, string $subdomain, string $ownerEmail): Tenant
    {
        User::factory()->create(['email' => $ownerEmail]);

        return app(\App\Actions\Tenancy\CreateTenantAction::class)->execute(
            companyName: $company,
            subdomain: $subdomain,
            owner: CentralUser::query()->firstWhere('email', $ownerEmail),
        );
    }

    private function central(string $path = ''): string
    {
        $domain = config('tenancy.tenant_base_domain')
            ?: (parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost');

        return 'http://'.$domain.$path;
    }

    /**
     * The guard that is known to work: anything under module/* bounces a
     * workspace customer to the portal.
     */
    public function test_module_area_redirects_workspace_customers(): void
    {
        $this->provisionTenant('Company A', 'company-a', 'admin@a.test');

        tenancy()->end();

        $member = User::query()->firstWhere('email', 'admin@a.test');

        $response = $this->actingAs($member)->get($this->central('/module/dashboard'));

        $this->assertTrue($response->isRedirect());
        $this->assertStringNotContainsString(
            '/module',
            (string) $response->headers->get('Location'),
        );
    }

    /**
     * /todos carries no permission gate and no module prefix, so a workspace
     * customer reaching it on the central domain would be writing rows into the
     * platform's own schema rather than their workspace.
     */
    public function test_workspace_customer_cannot_write_todos_into_the_central_schema(): void
    {
        $this->provisionTenant('Company A', 'company-a', 'admin@a.test');

        tenancy()->end();

        $member = User::query()->firstWhere('email', 'admin@a.test');

        $this->actingAs($member)
            ->post($this->central('/todos'), ['title' => 'Ditulis dari domain central']);

        // The database is the evidence: anything here landed in the platform's
        // own schema, written by a SaaS customer.
        $this->assertFalse(
            Todo::query()->where('title', 'Ditulis dari domain central')->exists(),
            'A workspace customer created a row in the central schema via /todos.',
        );
    }

    /**
     * The same boundary for the unprefixed dashboard.
     */
    public function test_workspace_customer_is_redirected_off_the_central_dashboard(): void
    {
        $this->provisionTenant('Company A', 'company-a', 'admin@a.test');

        tenancy()->end();

        $member = User::query()->firstWhere('email', 'admin@a.test');

        $response = $this->actingAs($member)->get($this->central('/dashboard'));

        $this->assertTrue(
            $response->isRedirect(),
            'The central dashboard was rendered for a workspace customer.',
        );
    }

    /**
     * And for the unprefixed live-updates module.
     */
    public function test_workspace_customer_is_redirected_off_central_live_updates(): void
    {
        $this->provisionTenant('Company A', 'company-a', 'admin@a.test');

        tenancy()->end();

        $member = User::query()->firstWhere('email', 'admin@a.test');

        $response = $this->actingAs($member)->get($this->central('/live-updates'));

        $this->assertNotEquals(
            200,
            $response->getStatusCode(),
            'A workspace customer reached central live-updates.',
        );
    }
}
