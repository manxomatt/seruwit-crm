<?php

namespace Tests\Feature\Security;

use App\Models\CentralUser;
use App\Models\Media;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

/**
 * Priority 1 security suite: tenant isolation under adversarial conditions.
 *
 * Where TenantIsolationTest proves the happy path keeps workspaces apart, this
 * suite drives the boundary from the attacker's side — replayed sessions,
 * spoofed hosts, guessed identifiers, and roles that mean one thing inside a
 * workspace and something far more powerful outside it.
 *
 * DatabaseMigrations (not RefreshDatabase) on purpose: tenant provisioning
 * issues DDL (CREATE/DROP SCHEMA) that must commit, which deadlocks inside the
 * transaction RefreshDatabase wraps around each test.
 */
class TenantIsolationAdversarialTest extends TestCase
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

        $tenant = app(\App\Actions\Tenancy\CreateTenantAction::class)->execute(
            companyName: $company,
            subdomain: $subdomain,
            owner: CentralUser::query()->firstWhere('email', $ownerEmail),
        );

        $this->ensureMembership($tenant, $ownerEmail);

        return $tenant;
    }

    /**
     * Guarantee the owner exists inside the tenant schema, which is what
     * populates the central membership pivot via resource syncing.
     *
     * Without this the owner reads as a half-finished signup, and
     * RedirectUnfinishedSignup bounces every central request to /onboarding
     * before the authorization gate under test ever runs — turning a real 403
     * into a meaningless 302.
     */
    private function ensureMembership(Tenant $tenant, string $email): void
    {
        $tenant->run(function () use ($email): void {
            if (! User::query()->where('email', $email)->exists()) {
                User::factory()->create(['email' => $email]);
            }
        });

        tenancy()->end();
    }

    private function tenantUser(Tenant $tenant, string $email): User
    {
        $user = $tenant->run(fn (): ?User => User::query()->firstWhere('email', $email));

        tenancy()->end();

        return $user;
    }

    private function domainOf(Tenant $tenant): string
    {
        return $tenant->run(fn (): string => 'http://'.$tenant->domains->first()->domain);
    }

    /**
     * Resolved the same way routes/web.php binds the central route group. Never
     * hardcode this: the repository ships a cached config, so the test process
     * reads APP_URL from bootstrap/cache/config.php rather than phpunit.xml.
     */
    private function central(string $path = ''): string
    {
        $domain = config('tenancy.tenant_base_domain')
            ?: (parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost');

        return 'http://'.$domain.$path;
    }

    /*
    |--------------------------------------------------------------------------
    | MT-01 — cross-tenant identifier probing
    |--------------------------------------------------------------------------
    */

    /**
     * Per-schema sequences hand every workspace the same low integer ids, so a
     * user id that is valid in one tenant is almost always valid in the other.
     * Requesting tenant A's user id from tenant B must resolve inside B's schema
     * only — never reach across.
     */
    public function test_colliding_user_ids_do_not_leak_across_tenants(): void
    {
        $tenantA = $this->provisionTenant('Company A', 'company-a', 'admin@a.test');
        $tenantB = $this->provisionTenant('Company B', 'company-b', 'admin@b.test');

        $victimId = $tenantA->run(function (): int {
            return User::factory()->create([
                'email' => 'victim@a.test',
                'name' => 'Rahasia Karyawan A',
            ])->id;
        });

        tenancy()->end();

        $adminB = $this->tenantUser($tenantB, 'admin@b.test');

        $response = $this->actingAs($adminB)
            ->get($this->domainOf($tenantB)."/module/users/{$victimId}");

        // Either the id does not exist in B's schema (404) or it resolves to B's
        // own row — under no circumstance may A's user be rendered.
        $response->assertDontSee('Rahasia Karyawan A');
        $response->assertDontSee('victim@a.test');
    }

    /**
     * The same probe against the media library, which serves file paths that
     * point into per-tenant storage directories.
     */
    public function test_media_ids_from_another_tenant_are_not_resolvable(): void
    {
        $tenantA = $this->provisionTenant('Company A', 'company-a', 'admin@a.test');
        $tenantB = $this->provisionTenant('Company B', 'company-b', 'admin@b.test');

        $mediaId = $tenantA->run(function (): int {
            $uploader = User::query()->firstWhere('email', 'admin@a.test');

            return Media::query()->create([
                'name' => 'kontrak-rahasia-a',
                'original_name' => 'kontrak-rahasia-a.pdf',
                'path' => 'media/kontrak-rahasia-a.pdf',
                'mime_type' => 'application/pdf',
                'size' => 1024,
                'type' => 'document',
                'user_id' => $uploader->id,
            ])->id;
        });

        tenancy()->end();

        $adminB = $this->tenantUser($tenantB, 'admin@b.test');

        $this->actingAs($adminB)
            ->get($this->domainOf($tenantB)."/module/media/{$mediaId}")
            ->assertDontSee('kontrak-rahasia-a');
    }

    /*
    |--------------------------------------------------------------------------
    | MT-01 — session replay across workspace boundaries
    |--------------------------------------------------------------------------
    */

    /**
     * The control that actually stops a workspace session from being replayed
     * on a sibling workspace is cookie scoping: with session.domain left null
     * the cookie is host-only, so a browser holding company-a's cookie never
     * offers it to company-b.
     *
     * Setting SESSION_DOMAIN to a leading-dot wildcard (".seruwit.com") would
     * silently share one session cookie across every workspace subdomain and
     * turn tenant separation into a single shared login.
     *
     * Note this is asserted at the configuration level on purpose. A functional
     * replay test cannot be written with actingAs(), which injects the user
     * straight into the guard and never exercises session resolution at all.
     */
    public function test_session_cookie_is_not_shared_across_workspace_subdomains(): void
    {
        $domain = config('session.domain');

        // null means host-only, which is what keeps workspaces apart.
        if ($domain !== null) {
            $this->assertStringStartsNotWith(
                '.',
                (string) $domain,
                'session.domain is a wildcard, so one session cookie is shared by every workspace subdomain.',
            );
        }

        $this->assertTrue(
            config('session.http_only'),
            'Session cookies are readable by JavaScript.',
        );

        $this->assertSame(
            'lax',
            strtolower((string) config('session.same_site')),
            'Session cookie SameSite is weaker than lax.',
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MT-04 — host header spoofing
    |--------------------------------------------------------------------------
    */

    /**
     * An unregistered host must not resolve to any tenant. Falling back to the
     * "first" or "last" tenant would hand an attacker a whole workspace by
     * setting a header.
     */
    public function test_unregistered_host_does_not_resolve_to_any_tenant(): void
    {
        $this->provisionTenant('Company A', 'company-a', 'admin@a.test');

        tenancy()->end();

        // A plausible-looking sibling subdomain of the real base domain — the
        // shape an attacker would actually try, not an obviously foreign host.
        $base = config('tenancy.tenant_base_domain')
            ?: (parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost');

        $response = $this->get("http://tidak-terdaftar.{$base}/module/dashboard");

        $this->assertContains(
            $response->getStatusCode(),
            [404, 500],
            'An unknown host resolved to a tenant instead of failing closed.',
        );
        $this->assertFalse(tenancy()->initialized, 'Tenancy was initialized for an unregistered host.');
    }

    /**
     * Tenant routes are registered domain-less and shared with the central
     * domain, so PreventAccessFromCentralDomains is the only thing stopping a
     * tenant-scoped URL from being served by the central domain.
     */
    public function test_tenant_impersonation_route_is_not_served_by_the_central_domain(): void
    {
        $this->provisionTenant('Company A', 'company-a', 'admin@a.test');

        tenancy()->end();

        $response = $this->get($this->central('/impersonate/token-palsu'));

        $this->assertNotEquals(200, $response->getStatusCode());
    }

    /*
    |--------------------------------------------------------------------------
    | MT-02 — tenant role must not become a platform role
    |--------------------------------------------------------------------------
    */

    /**
     * The most dangerous confusion in this codebase: `manage-tenants` resolves
     * through `User::isAdmin()`, which is a per-schema role lookup. Every
     * workspace mints its own `admin` role, so if that role is ever readable
     * from the central connection the workspace owner becomes a platform
     * super admin — able to list, edit, and delete every other tenant.
     */
    public function test_workspace_admin_cannot_reach_central_tenant_administration(): void
    {
        $tenant = $this->provisionTenant('Company A', 'company-a', 'admin@a.test');

        tenancy()->end();

        $centralIdentity = User::query()->firstWhere('email', 'admin@a.test');

        $this->assertNotNull($centralIdentity, 'Owner identity missing from the central schema.');
        $this->assertFalse(
            $centralIdentity->isAdmin(),
            'A workspace admin is reported as admin on the central connection.',
        );

        // The workspace guard bounces them to the portal before the gate is
        // even consulted, so the observable outcome is a redirect rather than a
        // 403. Either is acceptable; being served the page is not.
        $index = $this->actingAs($centralIdentity)->get($this->central('/module/tenants'));
        $this->assertNotEquals(200, $index->getStatusCode());

        $destroy = $this->actingAs($centralIdentity)
            ->delete($this->central("/module/tenants/{$tenant->id}"));
        $this->assertNotEquals(200, $destroy->getStatusCode());

        $this->assertDatabaseHas('tenants', ['id' => $tenant->id]);
    }

    /**
     * The same boundary for the remaining platform gates.
     */
    public function test_workspace_admin_cannot_reach_platform_only_gates(): void
    {
        $this->provisionTenant('Company A', 'company-a', 'admin@a.test');

        tenancy()->end();

        $centralIdentity = User::query()->firstWhere('email', 'admin@a.test');

        foreach (['/module/plans', '/module/registry', '/module/settings/create'] as $path) {
            $response = $this->actingAs($centralIdentity)->get($this->central($path));

            $this->assertNotEquals(
                200,
                $response->getStatusCode(),
                "A workspace admin was served {$path}.",
            );
        }
    }

    /**
     * A workspace admin must not be able to award themselves the platform
     * `admin` role by writing to the central role pivot through any tenant-side
     * request.
     */
    public function test_tenant_role_assignment_does_not_write_to_the_central_role_pivot(): void
    {
        $tenant = $this->provisionTenant('Company A', 'company-a', 'admin@a.test');

        $tenant->run(function (): void {
            $user = User::query()->firstWhere('email', 'admin@a.test');
            $adminRole = Role::query()->firstWhere('slug', 'admin');

            if ($adminRole !== null) {
                $user->roles()->syncWithoutDetaching([$adminRole->id]);
            }
        });

        tenancy()->end();

        $centralIdentity = User::query()->firstWhere('email', 'admin@a.test');

        $this->assertFalse(
            $centralIdentity->isAdmin(),
            'A role granted inside a workspace bled into the central schema.',
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MT-03 — workspace entry
    |--------------------------------------------------------------------------
    */

    /**
     * Entering a workspace mints an impersonation token, so the membership
     * check on this route is the last gate before a full session in someone
     * else's tenant.
     */
    public function test_non_member_cannot_enter_another_workspace(): void
    {
        $this->provisionTenant('Company A', 'company-a', 'admin@a.test');
        $tenantB = $this->provisionTenant('Company B', 'company-b', 'admin@b.test');

        tenancy()->end();

        $outsider = User::query()->firstWhere('email', 'admin@a.test');

        $this->actingAs($outsider)
            ->get($this->central("/workspaces/{$tenantB->id}/enter"))
            ->assertForbidden();
    }

    /**
     * The workspace list is built from the caller's own membership pivot; it
     * must never enumerate workspaces the caller does not belong to.
     */
    public function test_workspace_list_only_shows_own_memberships(): void
    {
        $this->provisionTenant('Company A', 'company-a', 'admin@a.test');
        $this->provisionTenant('Rahasia Company B', 'company-b', 'admin@b.test');

        tenancy()->end();

        $userA = User::query()->firstWhere('email', 'admin@a.test');

        $this->actingAs($userA)
            ->get($this->central('/workspaces'))
            ->assertOk()
            ->assertDontSee('Rahasia Company B');
    }

    /*
    |--------------------------------------------------------------------------
    | AUTHZ-06 — suspended and cancelled tenants
    |--------------------------------------------------------------------------
    */

    /**
     * A suspended workspace must be sealed for everything except the
     * subscription screens that let the customer pay to reactivate.
     */
    public function test_suspended_tenant_blocks_application_access(): void
    {
        $tenant = $this->provisionTenant('Company A', 'company-a', 'admin@a.test');
        $tenant->update(['status' => 'suspended']);

        $admin = $this->tenantUser($tenant, 'admin@a.test');

        $response = $this->actingAs($admin)
            ->get($this->domainOf($tenant).'/module/dashboard');

        $this->assertNotEquals(
            200,
            $response->getStatusCode(),
            'A suspended workspace still served the dashboard.',
        );
    }

    /**
     * EnsureTenantIsActive whitelists routes whose name starts with
     * `module.subscription.`. That prefix must not be reachable through any
     * route that performs non-subscription work.
     */
    public function test_suspended_tenant_blocks_user_administration(): void
    {
        $tenant = $this->provisionTenant('Company A', 'company-a', 'admin@a.test');
        $tenant->update(['status' => 'suspended']);

        $admin = $this->tenantUser($tenant, 'admin@a.test');

        $response = $this->actingAs($admin)
            ->post($this->domainOf($tenant).'/module/users', [
                'name' => 'Penyusup',
                'email' => 'penyusup@a.test',
                'password' => 'RahasiaKuat123',
                'password_confirmation' => 'RahasiaKuat123',
            ]);

        $this->assertNotEquals(
            302,
            $response->getStatusCode(),
            'A suspended workspace still accepted a user-creation request.',
        );

        $exists = $tenant->run(
            fn (): bool => User::query()->where('email', 'penyusup@a.test')->exists(),
        );

        $this->assertFalse($exists, 'A user was created inside a suspended workspace.');
    }

    /*
    |--------------------------------------------------------------------------
    | MT-01 — central-connection models reached from tenant routes
    |--------------------------------------------------------------------------
    |
    | PaymentOrder, Subscription, and Plan resolve against the central
    | connection while their routes live inside the tenant application. Schema
    | separation buys nothing here: route-model binding will happily load any
    | tenant's order by id, so the ownership check in the controller is the only
    | thing standing between workspaces.
    |
    */

    private function orderFor(Tenant $tenant): \App\Models\PaymentOrder
    {
        $plan = \App\Models\Plan::on('central')->where('is_trial', false)->firstOrFail();

        return $tenant->run(
            fn (): \App\Models\PaymentOrder => app(\App\Services\PaymentOrderService::class)
                ->createOrder($tenant, $plan, 'activate', 'month'),
        );
    }

    public function test_tenant_cannot_view_another_tenants_payment_order(): void
    {
        $tenantA = $this->provisionTenant('Company A', 'company-a', 'admin@a.test');
        $tenantB = $this->provisionTenant('Company B', 'company-b', 'admin@b.test');

        $orderA = $this->orderFor($tenantA);

        tenancy()->end();

        $adminB = $this->tenantUser($tenantB, 'admin@b.test');

        $this->actingAs($adminB)
            ->get($this->domainOf($tenantB)."/module/subscription/payment/{$orderA->id}")
            ->assertForbidden();
    }

    public function test_tenant_cannot_upload_proof_to_another_tenants_payment_order(): void
    {
        $tenantA = $this->provisionTenant('Company A', 'company-a', 'admin@a.test');
        $tenantB = $this->provisionTenant('Company B', 'company-b', 'admin@b.test');

        $orderA = $this->orderFor($tenantA);

        tenancy()->end();

        $adminB = $this->tenantUser($tenantB, 'admin@b.test');

        $this->actingAs($adminB)
            ->post($this->domainOf($tenantB)."/module/subscription/payment/{$orderA->id}/proof", [
                'proof' => \Illuminate\Http\UploadedFile::fake()->create('bukti.pdf', 16, 'application/pdf'),
            ])
            ->assertForbidden();

        $orderA->refresh();
        $this->assertNull(
            $orderA->transfer_proof_path,
            "Another workspace attached a transfer proof to this tenant's order.",
        );
    }

    public function test_tenant_cannot_cancel_another_tenants_payment_order(): void
    {
        $tenantA = $this->provisionTenant('Company A', 'company-a', 'admin@a.test');
        $tenantB = $this->provisionTenant('Company B', 'company-b', 'admin@b.test');

        $orderA = $this->orderFor($tenantA);

        tenancy()->end();

        $adminB = $this->tenantUser($tenantB, 'admin@b.test');

        $this->actingAs($adminB)
            ->post($this->domainOf($tenantB)."/module/subscription/payment/{$orderA->id}/cancel")
            ->assertForbidden();

        $orderA->refresh();
        $this->assertNotSame(
            'cancelled',
            $orderA->status,
            "Another workspace cancelled this tenant's payment order.",
        );
    }

    /**
     * A cancelled workspace is a stronger state than suspended and must be at
     * least as closed.
     */
    public function test_cancelled_tenant_blocks_application_access(): void
    {
        $tenant = $this->provisionTenant('Company A', 'company-a', 'admin@a.test');
        $tenant->update(['status' => 'cancelled']);

        $admin = $this->tenantUser($tenant, 'admin@a.test');

        $response = $this->actingAs($admin)
            ->get($this->domainOf($tenant).'/module/dashboard');

        $this->assertNotEquals(200, $response->getStatusCode());
    }

    /*
    |--------------------------------------------------------------------------
    | MT-02 — central domain must not become a tenant data window
    |--------------------------------------------------------------------------
    */

    /**
     * With CENTRAL_SERVES_APP=true the whole CRM is mounted on the central
     * domain as well. A workspace customer landing there must be pushed to the
     * workspace portal rather than shown a central CRM populated from the
     * central schema.
     */
    public function test_workspace_member_is_redirected_off_the_central_module_area(): void
    {
        $this->provisionTenant('Company A', 'company-a', 'admin@a.test');

        tenancy()->end();

        $member = User::query()->firstWhere('email', 'admin@a.test');

        $response = $this->actingAs($member)->get($this->central('/module/dashboard'));

        // The destination varies (workspace portal, or onboarding while the
        // signup is unfinished); what matters is that the central module area
        // is never rendered for a workspace customer.
        $this->assertTrue(
            $response->isRedirect(),
            'The central module area was served to a workspace customer.',
        );

        $this->assertStringNotContainsString(
            '/module',
            (string) $response->headers->get('Location'),
        );
    }

    /**
     * Global search runs against whatever connection is active. On the central
     * domain it must not surface rows that live in a tenant schema.
     */
    public function test_central_global_search_does_not_surface_tenant_rows(): void
    {
        $tenantA = $this->provisionTenant('Company A', 'company-a', 'admin@a.test');

        $tenantA->run(function (): void {
            User::factory()->create([
                'email' => 'target@a.test',
                'name' => 'PenandaRahasiaA',
            ]);
        });

        tenancy()->end();

        $platformAdmin = User::factory()->create(['email' => 'platform@seruwit.test']);
        $adminRole = Role::query()->firstWhere('slug', 'admin');

        if ($adminRole !== null) {
            $platformAdmin->roles()->syncWithoutDetaching([$adminRole->id]);
        }

        $this->actingAs($platformAdmin)
            ->get($this->central('/module/search?q=PenandaRahasiaA'))
            ->assertDontSee('target@a.test');
    }

    /*
    |--------------------------------------------------------------------------
    | Storage isolation under traversal
    |--------------------------------------------------------------------------
    */

    /**
     * The tenancy asset route serves files out of the active tenant's storage
     * directory. A traversal payload must not climb into a sibling tenant's
     * directory or the central one.
     */
    public function test_tenancy_asset_route_rejects_path_traversal(): void
    {
        $tenantA = $this->provisionTenant('Company A', 'company-a', 'admin@a.test');
        $tenantB = $this->provisionTenant('Company B', 'company-b', 'admin@b.test');

        $tenantB->run(function (): void {
            \Illuminate\Support\Facades\Storage::disk('public')->put('rahasia-b.txt', 'MILIK B');
        });

        tenancy()->end();

        $traversal = '../../tenant'.$tenantB->id.'/app/public/rahasia-b.txt';

        $response = $this->get($this->domainOf($tenantA).'/tenancy/assets/'.$traversal);

        $this->assertNotEquals(
            200,
            $response->getStatusCode(),
            'Path traversal reached another tenant\'s storage directory.',
        );
    }
}
