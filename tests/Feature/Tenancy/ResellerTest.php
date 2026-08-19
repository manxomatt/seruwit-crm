<?php

namespace Tests\Feature\Tenancy;

use App\Actions\Tenancy\CreateTenantAction;
use App\Models\CentralUser;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\PlanSeeder;
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

    /**
     * Only the pending-payment tests below need real Plan rows (for the
     * `plan` field's existence check and for looking up 'pro'/'free' by
     * key). Seeded on demand rather than for every test in this file:
     * seeding it unconditionally in setUpWithTenant() previously destabilized
     * unrelated tests that provision tenants with no plan_key at all.
     */
    private function seedPlans(): void
    {
        $this->seed(PlanSeeder::class);
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

    // -----------------------------------------------------------------------
    // Commission attribution window
    // -----------------------------------------------------------------------

    /**
     * CreateTenantAction runs real DDL (CREATE SCHEMA) via the tenancy pipeline,
     * so this belongs in a WithTenant-based suite rather than one wrapped in
     * RefreshDatabase's transaction — see WithTenant's own docblock for why
     * that combination deadlocks.
     */
    public function test_provisioning_a_tenant_for_a_reseller_stamps_the_attribution_window(): void
    {
        config()->set('reseller.attribution_months', 12);

        $reseller = $this->makeReseller();
        $tenant = $this->provisionTenantForReseller($reseller, 'Attributed Co', 'attributedco');

        $this->assertSame($reseller->global_id, $tenant->reseller_global_id);
        $this->assertNotNull($tenant->reseller_attributed_at);
        $this->assertEqualsWithDelta(
            now()->addMonths(12)->timestamp,
            $tenant->reseller_attribution_ends_at->timestamp,
            120,
        );
        $this->assertTrue($tenant->hasActiveResellerAttribution());
    }

    public function test_provisioning_a_tenant_with_no_attribution_month_limit_never_expires(): void
    {
        config()->set('reseller.attribution_months', null);

        $reseller = $this->makeReseller();
        $tenant = $this->provisionTenantForReseller($reseller, 'Lifetime Co', 'lifetimeco');

        $this->assertNull($tenant->reseller_attribution_ends_at);
        $this->assertTrue($tenant->hasActiveResellerAttribution());
    }

    public function test_a_tenant_created_without_a_reseller_has_no_attribution_window(): void
    {
        $owner = User::factory()->create();

        $tenant = app(\App\Actions\Tenancy\CreateTenantAction::class)->execute(
            companyName: 'Direct Co',
            subdomain: 'directco',
            owner: CentralUser::query()->firstWhere('global_id', $owner->global_id),
        );

        $this->assertNull($tenant->reseller_global_id);
        $this->assertNull($tenant->reseller_attributed_at);
        $this->assertFalse($tenant->hasActiveResellerAttribution());
    }

    // -----------------------------------------------------------------------
    // A reseller cannot hand out a paid plan for free — only the tenant owner
    // pays, via the normal subscription flow, and the reseller's commission
    // only exists because that payment happened.
    // -----------------------------------------------------------------------

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function createTenantPayload(array $overrides = []): array
    {
        return array_merge([
            'company_name' => 'Paid Plan Co',
            'subdomain' => 'paidplanco',
            'owner_name' => 'Owner',
            'owner_email' => 'owner@paidplanco.test',
            'owner_password' => 'password123!',
        ], $overrides);
    }

    public function test_reseller_selecting_a_paid_plan_creates_the_tenant_on_trial_instead(): void
    {
        $this->seedPlans();

        // A distinctive value proves the trial length comes from the Trial
        // plan's own column, not a number baked into the controller.
        Plan::query()->where('key', Plan::KEY_TRIAL)->update(['trial_days' => 45]);

        $reseller = $this->makeReseller();

        $this->actingAs($reseller)
            ->post(route('module.tenants.store'), $this->createTenantPayload(['plan' => 'pro']))
            ->assertRedirect();

        $tenant = Tenant::query()->where('name', 'Paid Plan Co')->firstOrFail();

        $this->assertSame(Plan::KEY_TRIAL, $tenant->plan);
        $this->assertNotNull($tenant->trial_ends_at);
        $this->assertEqualsWithDelta(now()->addDays(45)->timestamp, $tenant->trial_ends_at->timestamp, 60);
    }

    public function test_reseller_selecting_a_paid_plan_creates_a_pending_payment_order_for_it(): void
    {
        $this->seedPlans();

        $reseller = $this->makeReseller();
        $proPlan = Plan::query()->where('key', 'pro')->firstOrFail();

        $this->actingAs($reseller)
            ->post(route('module.tenants.store'), $this->createTenantPayload(['plan' => 'pro']))
            ->assertRedirect();

        $tenant = Tenant::query()->where('name', 'Paid Plan Co')->firstOrFail();

        $order = \App\Models\PaymentOrder::query()->where('tenant_id', $tenant->id)->firstOrFail();

        $this->assertSame($proPlan->id, $order->plan_id);
        $this->assertSame('activate', $order->type);
        $this->assertSame(\App\Models\PaymentOrder::STATUS_PENDING, $order->status);
        $this->assertEqualsWithDelta((float) $proPlan->price, (float) $order->amount, 0.01);
    }

    public function test_reseller_selecting_a_free_plan_is_still_granted_directly(): void
    {
        $this->seedPlans();

        $reseller = $this->makeReseller();

        $this->actingAs($reseller)
            ->post(route('module.tenants.store'), $this->createTenantPayload(['plan' => 'free']))
            ->assertRedirect();

        $tenant = Tenant::query()->where('name', 'Paid Plan Co')->firstOrFail();

        $this->assertSame('free', $tenant->plan);
        $this->assertFalse(\App\Models\PaymentOrder::query()->where('tenant_id', $tenant->id)->exists());
    }

    /**
     * The platform default ("basic") is itself a paid plan — leaving `plan`
     * blank must not be a loophole around the payment requirement.
     */
    public function test_reseller_leaving_the_plan_blank_still_goes_through_the_paid_default(): void
    {
        $this->seedPlans();

        $reseller = $this->makeReseller();

        $this->actingAs($reseller)
            ->post(route('module.tenants.store'), $this->createTenantPayload())
            ->assertRedirect();

        $tenant = Tenant::query()->where('name', 'Paid Plan Co')->firstOrFail();

        $this->assertSame(Plan::KEY_TRIAL, $tenant->plan);
        $this->assertTrue(\App\Models\PaymentOrder::query()->where('tenant_id', $tenant->id)->exists());
    }

    public function test_admin_selecting_a_paid_plan_is_still_granted_instantly(): void
    {
        $this->seedPlans();

        $admin = $this->makeSuperAdmin();

        $this->actingAs($admin)
            ->post(route('module.tenants.store'), $this->createTenantPayload(['plan' => 'pro']))
            ->assertRedirect();

        $tenant = Tenant::query()->where('name', 'Paid Plan Co')->firstOrFail();

        $this->assertSame('pro', $tenant->plan);
        $this->assertNull($tenant->trial_ends_at);
        $this->assertFalse(\App\Models\PaymentOrder::query()->where('tenant_id', $tenant->id)->exists());
    }

    /**
     * Ties the whole loop together: the payment the reseller couldn't collect
     * themselves is what actually activates the plan and pays their commission.
     */
    public function test_confirming_the_pending_order_activates_the_plan_and_pays_the_reseller(): void
    {
        $this->seedPlans();

        config()->set('reseller.default_rate', ['type' => 'percent', 'value' => 10]);

        $reseller = $this->makeReseller();
        $admin = $this->makeSuperAdmin();

        $this->actingAs($reseller)
            ->post(route('module.tenants.store'), $this->createTenantPayload(['plan' => 'pro']))
            ->assertRedirect();

        $tenant = Tenant::query()->where('name', 'Paid Plan Co')->firstOrFail();
        $order = \App\Models\PaymentOrder::query()->where('tenant_id', $tenant->id)->firstOrFail();

        app(\App\Services\PaymentOrderService::class)->confirm($order, $admin);

        $this->assertSame('pro', $tenant->fresh()->plan);

        $commission = \App\Models\ResellerCommission::query()->where('payment_order_id', $order->id)->first();

        $this->assertNotNull($commission);
        $this->assertSame($reseller->global_id, $commission->reseller_global_id);
    }
}
