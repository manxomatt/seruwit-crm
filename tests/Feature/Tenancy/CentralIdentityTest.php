<?php

namespace Tests\Feature\Tenancy;

use App\Models\CentralUser;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class CentralIdentityTest extends TestCase
{
    /**
     * DatabaseMigrations (not RefreshDatabase) on purpose: tenant provisioning
     * issues DDL (CREATE/DROP SCHEMA) that must commit, which deadlocks inside
     * the transaction RefreshDatabase wraps around each test.
     */
    use DatabaseMigrations;

    protected function tearDown(): void
    {
        tenancy()->end();
        Tenant::query()->get()->each->delete();

        parent::tearDown();
    }

    private function makeTenant(string $name, ?string $domain = null): Tenant
    {
        $tenant = Tenant::create(['name' => $name]);

        if ($domain !== null) {
            $tenant->domains()->create(['domain' => $domain]);
        }

        return $tenant;
    }

    public function test_user_created_in_tenant_is_synced_to_central_with_pivot(): void
    {
        $tenant = $this->makeTenant('Company A');

        $tenant->run(function (): void {
            User::factory()->create(['email' => 'staff@example.com', 'name' => 'Staff One']);
        });

        $centralUser = CentralUser::query()->where('email', 'staff@example.com')->first();

        $this->assertNotNull($centralUser);
        $this->assertSame('Staff One', $centralUser->name);
        $this->assertTrue($centralUser->tenants()->whereKey($tenant->id)->exists());
    }

    public function test_one_identity_can_belong_to_multiple_tenants_with_different_roles(): void
    {
        $tenantA = $this->makeTenant('Company A');
        $tenantB = $this->makeTenant('Company B');

        $tenantA->run(function (): void {
            $this->seed(RoleSeeder::class);
            $user = User::factory()->create(['email' => 'multi@example.com']);
            $user->assignRole(Role::query()->where('slug', 'admin')->firstOrFail());
        });

        $globalId = CentralUser::query()->where('email', 'multi@example.com')->firstOrFail()->global_id;

        $tenantB->run(function () use ($globalId): void {
            $this->seed(RoleSeeder::class);
            $user = User::factory()->create(['email' => 'multi@example.com', 'global_id' => $globalId]);
            $user->assignRole(Role::query()->where('slug', 'user')->firstOrFail());
        });

        $centralUser = CentralUser::query()->where('email', 'multi@example.com')->firstOrFail();
        $this->assertSame(2, $centralUser->tenants()->count());
        $this->assertSame(1, CentralUser::query()->where('email', 'multi@example.com')->count());

        $isAdminInA = $tenantA->run(fn (): bool => User::query()->firstWhere('global_id', $globalId)->hasRole('admin'));
        $isAdminInB = $tenantB->run(fn (): bool => User::query()->firstWhere('global_id', $globalId)->hasRole('admin'));
        $isUserInB = $tenantB->run(fn (): bool => User::query()->firstWhere('global_id', $globalId)->hasRole('user'));

        $this->assertTrue($isAdminInA);
        $this->assertFalse($isAdminInB);
        $this->assertTrue($isUserInB);
    }

    public function test_synced_attribute_update_propagates_to_central_and_other_tenants(): void
    {
        $tenantA = $this->makeTenant('Company A');
        $tenantB = $this->makeTenant('Company B');

        $tenantA->run(function (): void {
            User::factory()->create(['email' => 'renamed@example.com', 'name' => 'Old Name']);
        });

        $globalId = CentralUser::query()->where('email', 'renamed@example.com')->firstOrFail()->global_id;

        $tenantB->run(function () use ($globalId): void {
            User::factory()->create(['email' => 'renamed@example.com', 'global_id' => $globalId]);
        });

        $tenantA->run(function () use ($globalId): void {
            User::query()->firstWhere('global_id', $globalId)->update(['name' => 'New Name']);
        });

        $this->assertSame('New Name', CentralUser::query()->firstWhere('global_id', $globalId)->name);

        $nameInB = $tenantB->run(fn (): string => User::query()->firstWhere('global_id', $globalId)->name);
        $this->assertSame('New Name', $nameInB);
    }

    public function test_attaching_central_user_to_tenant_creates_the_tenant_copy(): void
    {
        $tenant = $this->makeTenant('Company A');

        User::factory()->create(['email' => 'invited@example.com']);

        // Attaching the pivot triggers resource syncing, which copies the
        // central identity into the tenant schema.
        CentralUser::query()->firstWhere('email', 'invited@example.com')
            ->tenants()
            ->attach($tenant->id);

        $existsInTenant = $tenant->run(
            fn (): bool => User::query()->where('email', 'invited@example.com')->exists(),
        );

        $this->assertTrue($existsInTenant);
    }

    public function test_workspaces_page_lists_the_users_tenants(): void
    {
        $tenant = $this->makeTenant('Company A', 'company-a.localhost');

        $user = User::factory()->create(['email' => 'portal@example.com']);
        CentralUser::query()->firstWhere('email', 'portal@example.com')->tenants()->attach($tenant->id);

        $response = $this->actingAs($user)->get('/workspaces');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Central/Workspaces')
            ->has('workspaces', 1)
            ->where('workspaces.0.name', 'Company A')
            ->where('workspaces.0.domain', 'company-a.localhost'));
    }

    public function test_entering_a_workspace_redirects_to_tenant_domain_and_logs_in(): void
    {
        $tenant = $this->makeTenant('Company A', 'company-a.localhost');

        $user = User::factory()->create(['email' => 'sso@example.com']);
        CentralUser::query()->firstWhere('email', 'sso@example.com')->tenants()->attach($tenant->id);

        $response = $this->actingAs($user)->get("/workspaces/{$tenant->id}/enter");

        $response->assertRedirect();
        $impersonationUrl = $response->headers->get('Location');
        $this->assertStringContainsString('company-a.localhost/impersonate/', $impersonationUrl);

        $tenantResponse = $this->get($impersonationUrl);

        $tenantResponse->assertRedirect('/module/dashboard');
        $this->assertAuthenticated();
    }

    public function test_user_cannot_enter_a_workspace_they_do_not_belong_to(): void
    {
        $tenant = $this->makeTenant('Company A', 'company-a.localhost');

        $outsider = User::factory()->create(['email' => 'outsider@example.com']);

        $response = $this->actingAs($outsider)->get("/workspaces/{$tenant->id}/enter");

        $response->assertForbidden();
    }

    public function test_suspended_workspace_cannot_be_entered(): void
    {
        $tenant = $this->makeTenant('Company A', 'company-a.localhost');
        $tenant->update(['status' => 'suspended']);

        $user = User::factory()->create(['email' => 'suspended@example.com']);
        CentralUser::query()->firstWhere('email', 'suspended@example.com')->tenants()->attach($tenant->id);

        $response = $this->actingAs($user)->get("/workspaces/{$tenant->id}/enter");

        $response->assertForbidden();
    }
}
