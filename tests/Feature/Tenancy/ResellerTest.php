<?php

namespace Tests\Feature\Tenancy;

use App\Actions\Tenancy\CreateTenantAction;
use App\Models\CentralUser;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Tests\TestCase;
use Tests\Traits\WithTenant;

class ResellerTest extends TestCase
{
    use WithTenant;

    protected function setUpWithTenant(): void
    {
        $this->seed(RoleSeeder::class);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private function makeReseller(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::query()->where('slug', 'reseller')->firstOrFail());

        return $user;
    }

    private function makeSuperAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::query()->where('slug', 'admin')->firstOrFail());

        return $user;
    }

    private function provisionTenantForReseller(User $reseller, string $company, string $subdomain): Tenant
    {
        $owner = User::factory()->create();

        return app(CreateTenantAction::class)->execute(
            companyName: $company,
            subdomain: $subdomain,
            owner: CentralUser::query()->firstWhere('global_id', $owner->global_id),
            resellerGlobalId: $reseller->global_id,
        );
    }

    // -----------------------------------------------------------------------
    // Gate / Access
    // -----------------------------------------------------------------------

    public function test_unauthenticated_user_cannot_access_tenant_list(): void
    {
        $response = $this->get(route('module.tenants.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_regular_user_cannot_access_tenant_list(): void
    {
        $user = User::factory()->create();
        $user->assignRole(Role::query()->firstOrCreate(
            ['slug' => 'user'],
            ['name' => 'User', 'is_system' => true]
        ));

        $response = $this->actingAs($user)->get(route('module.tenants.index'));

        $response->assertForbidden();
    }

    public function test_reseller_can_access_tenant_list(): void
    {
        $reseller = $this->makeReseller();

        $response = $this->actingAs($reseller)->get(route('module.tenants.index'));

        $response->assertOk();
    }

    public function test_super_admin_can_access_tenant_list(): void
    {
        $admin = $this->makeSuperAdmin();

        $response = $this->actingAs($admin)->get(route('module.tenants.index'));

        $response->assertOk();
    }

    // -----------------------------------------------------------------------
    // Scoping: resellers only see their own tenants
    // -----------------------------------------------------------------------

    public function test_reseller_only_sees_their_own_tenants(): void
    {
        $reseller = $this->makeReseller();
        $otherReseller = $this->makeReseller();

        $ownTenant = $this->provisionTenantForReseller($reseller, 'My Client', 'myclient');
        $this->provisionTenantForReseller($otherReseller, 'Other Client', 'otherclient');

        $response = $this->actingAs($reseller)->get(route('module.tenants.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Module/Tenants/Index')
            ->where('tenants', fn ($tenants) => count($tenants) === 1
                && $tenants[0]['id'] === $ownTenant->id)
        );
    }

    public function test_super_admin_sees_all_tenants(): void
    {
        $admin = $this->makeSuperAdmin();
        $reseller = $this->makeReseller();

        $this->provisionTenantForReseller($reseller, 'Reseller Client', 'reselclient');
        $this->provisionTenant('Direct Company', 'direct', 'owner@direct.test');

        $response = $this->actingAs($admin)->get(route('module.tenants.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Module/Tenants/Index')
            ->where('tenants', fn ($tenants) => count($tenants) === 2)
        );
    }

    // -----------------------------------------------------------------------
    // Ownership enforcement on individual tenant routes
    // -----------------------------------------------------------------------

    public function test_reseller_can_view_their_own_tenant(): void
    {
        $reseller = $this->makeReseller();
        $tenant = $this->provisionTenantForReseller($reseller, 'My Client', 'myclient');

        $response = $this->actingAs($reseller)->get(route('module.tenants.show', $tenant));

        $response->assertOk();
    }

    public function test_reseller_cannot_view_another_resellers_tenant(): void
    {
        $reseller = $this->makeReseller();
        $otherReseller = $this->makeReseller();
        $otherTenant = $this->provisionTenantForReseller($otherReseller, 'Other Client', 'otherclient');

        $response = $this->actingAs($reseller)->get(route('module.tenants.show', $otherTenant));

        $response->assertForbidden();
    }

    public function test_reseller_cannot_view_platform_direct_tenant(): void
    {
        $reseller = $this->makeReseller();
        $directTenant = $this->provisionTenant('Direct Co', 'directco', 'owner@directco.test');

        $response = $this->actingAs($reseller)->get(route('module.tenants.show', $directTenant));

        $response->assertForbidden();
    }

    public function test_reseller_can_toggle_status_of_their_own_tenant(): void
    {
        $reseller = $this->makeReseller();
        $tenant = $this->provisionTenantForReseller($reseller, 'My Client', 'myclient');

        $response = $this->actingAs($reseller)->patch(route('module.tenants.toggle-status', $tenant));

        $response->assertRedirect();
        $this->assertSame('suspended', $tenant->fresh()->status);
    }

    public function test_reseller_cannot_toggle_status_of_another_resellers_tenant(): void
    {
        $reseller = $this->makeReseller();
        $otherReseller = $this->makeReseller();
        $otherTenant = $this->provisionTenantForReseller($otherReseller, 'Other Client', 'otherclient');

        $response = $this->actingAs($reseller)->patch(route('module.tenants.toggle-status', $otherTenant));

        $response->assertForbidden();
    }

    public function test_reseller_can_delete_their_own_tenant(): void
    {
        $reseller = $this->makeReseller();
        $tenant = $this->provisionTenantForReseller($reseller, 'My Client', 'myclient');

        $response = $this->actingAs($reseller)->delete(route('module.tenants.destroy', $tenant), [
            'confirm_name' => 'My Client',
        ]);

        $response->assertRedirect(route('module.tenants.index'));
        $this->assertNull(Tenant::find($tenant->id));
    }

    public function test_reseller_cannot_delete_another_resellers_tenant(): void
    {
        $reseller = $this->makeReseller();
        $otherReseller = $this->makeReseller();
        $otherTenant = $this->provisionTenantForReseller($otherReseller, 'Other Client', 'otherclient');

        $response = $this->actingAs($reseller)->delete(route('module.tenants.destroy', $otherTenant), [
            'confirm_name' => 'Other Client',
        ]);

        $response->assertForbidden();
    }

    // -----------------------------------------------------------------------
    // Store: reseller_global_id is set automatically on create
    // -----------------------------------------------------------------------

    public function test_tenant_created_by_reseller_has_reseller_global_id_set(): void
    {
        $reseller = $this->makeReseller();

        $this->actingAs($reseller)->post(route('module.tenants.store'), [
            'company_name' => 'New Client',
            'subdomain' => 'newclient',
            'owner_name' => 'Owner',
            'owner_email' => 'owner@newclient.test',
            'owner_password' => 'password123!',
        ]);

        $tenant = Tenant::query()->where('name', 'New Client')->firstOrFail();
        $this->assertSame($reseller->global_id, $tenant->reseller_global_id);
    }

    public function test_tenant_created_by_super_admin_has_no_reseller_global_id(): void
    {
        $admin = $this->makeSuperAdmin();

        $this->actingAs($admin)->post(route('module.tenants.store'), [
            'company_name' => 'Direct Client',
            'subdomain' => 'directclient',
            'owner_name' => 'Owner',
            'owner_email' => 'owner@directclient.test',
            'owner_password' => 'password123!',
        ]);

        $tenant = Tenant::query()->where('name', 'Direct Client')->firstOrFail();
        $this->assertNull($tenant->reseller_global_id);
    }

    // -----------------------------------------------------------------------
    // Middleware: resellers are not redirected to workspace portal
    // -----------------------------------------------------------------------

    public function test_reseller_who_belongs_to_a_tenant_is_not_redirected_to_workspace_portal(): void
    {
        $reseller = $this->makeReseller();
        $tenant = $this->provisionTenantForReseller($reseller, 'My Client', 'myclient');

        // Reseller is also a member of the tenant they own
        $centralUser = CentralUser::query()->firstWhere('global_id', $reseller->global_id);
        $centralUser?->tenants()->attach($tenant->getTenantKey());

        // Despite being a tenant member, a reseller must NOT be redirected
        $response = $this->actingAs($reseller)->get(route('module.tenants.index'));

        $response->assertOk();
    }
}
