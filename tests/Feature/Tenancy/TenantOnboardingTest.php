<?php

namespace Tests\Feature\Tenancy;

use App\Models\CentralUser;
use App\Models\Invitation;
use App\Models\Role;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use App\Notifications\TenantInvitationNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tests\Traits\WithTenant;

class TenantOnboardingTest extends TestCase
{
    use WithTenant;

    public function test_new_tenant_schema_is_seeded_with_roles_and_settings(): void
    {
        $tenant = $this->provisionTenant('Seeded Co', 'seeded-co', 'owner@seeded.test');

        $tenant->run(function (): void {
            $this->assertTrue(Role::query()->where('slug', 'admin')->exists());
            $this->assertTrue(Role::query()->where('slug', 'user')->exists());
            $this->assertGreaterThan(0, Setting::query()->count());
        });
    }

    public function test_tenant_owner_becomes_workspace_admin(): void
    {
        $tenant = $this->provisionTenant('Owned Co', 'owned-co', 'owner@owned.test');

        $isAdmin = $tenant->run(
            fn (): bool => User::query()->firstWhere('email', 'owner@owned.test')->isAdmin(),
        );

        $this->assertTrue($isAdmin);
    }

    public function test_registration_rejects_taken_or_reserved_subdomain(): void
    {
        $this->provisionTenant('First Co', 'taken-sub', 'first@example.com');

        $payload = [
            'name' => 'Second User',
            'email' => 'second@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'company_name' => 'Second Co',
        ];

        $this->post('/register', [...$payload, 'subdomain' => 'taken-sub'])
            ->assertSessionHasErrors('subdomain');

        $this->post('/register', [...$payload, 'subdomain' => 'admin'])
            ->assertSessionHasErrors('subdomain');
    }

    public function test_registration_is_not_available_on_tenant_domains(): void
    {
        $this->provisionTenant('Closed Co', 'closed-co', 'owner@closed.test');

        $this->get('http://closed-co.localhost/register')->assertNotFound();
    }

    public function test_super_admin_can_manage_tenants(): void
    {
        $admin = $this->makeCentralAdmin();

        $this->actingAs($admin)->get('/module/tenants')->assertOk();

        $response = $this->actingAs($admin)->post('/module/tenants', [
            'company_name' => 'Managed Co',
            'subdomain' => 'managed-co',
            'owner_name' => 'Managed Owner',
            'owner_email' => 'owner@managed.test',
            'owner_password' => 'password',
        ]);

        $response->assertSessionHasNoErrors();

        $tenant = Tenant::query()->firstWhere('name', 'Managed Co');
        $this->assertNotNull($tenant);

        $isAdmin = $tenant->run(
            fn (): bool => User::query()->firstWhere('email', 'owner@managed.test')->isAdmin(),
        );
        $this->assertTrue($isAdmin);
    }

    public function test_non_admin_cannot_access_tenant_management(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/module/tenants')->assertForbidden();
    }

    public function test_super_admin_can_view_and_update_tenant_detail(): void
    {
        $admin = $this->makeCentralAdmin();
        $tenant = $this->provisionTenant('Detail Co', 'detail-co', 'owner@detail.test');

        // The page's tenant record must not collide with the shared currentTenant
        // domain context (null on central) — otherwise the sidebar hides its menu.
        $this->actingAs($admin)->get('/module/tenants/'.$tenant->id)
            ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
                ->component('Module/Tenants/Show')
                ->where('currentTenant', null)
                ->where('tenant.id', $tenant->id)
            );

        $this->actingAs($admin)->patch('/module/tenants/'.$tenant->id, [
            'name' => 'Detail Co Renamed',
            'subdomain' => 'detail-co-2',
            'status' => 'suspended',
            'plan' => 'pro',
            'billing_email' => 'billing@detail.test',
            'phone' => '+62 812 0000',
            'address' => 'Jl. Contoh No. 1',
            'tax_id' => '01.234.567.8-901.000',
            'notes' => 'Pelanggan enterprise, kontak via WhatsApp.',
        ])->assertSessionHasNoErrors();

        $tenant->refresh();
        $this->assertSame('Detail Co Renamed', $tenant->name);
        $this->assertSame('suspended', $tenant->status);
        $this->assertSame('pro', $tenant->planKey());
        $this->assertSame('detail-co-2.localhost', $tenant->domains()->first()->domain);

        // Profile/contact fields persist as virtual columns in the data JSON.
        $this->assertSame('billing@detail.test', $tenant->billing_email);
        $this->assertSame('+62 812 0000', $tenant->phone);
        $this->assertSame('01.234.567.8-901.000', $tenant->tax_id);
        $this->assertSame('Pelanggan enterprise, kontak via WhatsApp.', $tenant->notes);
    }

    public function test_super_admin_can_delete_a_tenant(): void
    {
        $admin = $this->makeCentralAdmin();
        $tenant = $this->provisionTenant('Doomed Co', 'doomed-co', 'owner@doomed.test');
        $tenantId = $tenant->id;

        // Wrong confirmation name is rejected.
        $this->actingAs($admin)->delete('/module/tenants/'.$tenantId, [
            'confirm_name' => 'Wrong Name',
        ])->assertSessionHasErrors('confirm_name');

        $this->assertNotNull(Tenant::query()->find($tenantId));

        // Correct confirmation deletes the tenant and drops its schema.
        $this->actingAs($admin)->delete('/module/tenants/'.$tenantId, [
            'confirm_name' => 'Doomed Co',
        ])->assertRedirect(route('module.tenants.index', absolute: false));

        $this->assertNull(Tenant::query()->find($tenantId));
        $this->assertDatabaseMissing('domains', ['tenant_id' => $tenantId]);
    }

    public function test_saas_customer_is_redirected_from_central_module_to_workspaces(): void
    {
        $this->provisionTenant('Portal Co', 'portal-co', 'member@portal.test');

        // The owner belongs to a tenant but has no role in the central schema,
        // so on the central domain they belong in the workspace portal, not the CRM.
        $member = User::query()->firstWhere('email', 'member@portal.test');

        $this->actingAs($member)
            ->get('/module/dashboard')
            ->assertRedirect(route('central.workspaces.index', absolute: false));
    }

    public function test_suspended_tenant_is_blocked_on_its_domain(): void
    {
        $tenant = $this->provisionTenant('Paused Co', 'paused-co', 'owner@paused.test');

        $this->get('http://paused-co.localhost/')->assertOk();

        $tenant->update(['status' => 'suspended']);

        // End tenancy so the next request re-initializes with a fresh tenant
        // instance instead of the cached one from the previous request.
        tenancy()->end();

        $this->get('http://paused-co.localhost/')->assertForbidden();
    }

    public function test_workspace_admin_can_send_an_invitation(): void
    {
        Notification::fake();

        $tenant = $this->provisionTenant('Invite Co', 'invite-co', 'owner@invite.test');

        // Fetch the owner from inside the tenant so the instance is pinned to
        // the tenant connection — its role checks must hit the tenant schema.
        $owner = $tenant->run(fn (): User => User::query()->firstWhere('email', 'owner@invite.test'));

        $response = $this->actingAs($owner)->post('http://invite-co.localhost/module/users/invite', [
            'email' => 'teammate@example.com',
            'role_slug' => 'user',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertStatus(302);

        $invitation = Invitation::query()->firstWhere('email', 'teammate@example.com');
        $this->assertNotNull($invitation);
        $this->assertSame($tenant->id, $invitation->tenant_id);
        $this->assertTrue($invitation->isPending());

        Notification::assertSentOnDemand(TenantInvitationNotification::class);
    }

    public function test_new_user_can_accept_invitation_and_join_workspace(): void
    {
        $tenant = $this->provisionTenant('Join Co', 'join-co', 'owner@join.test');

        $invitation = Invitation::create([
            'tenant_id' => $tenant->id,
            'email' => 'newbie@example.com',
            'role_slug' => 'user',
            'token' => Str::random(64),
            'expires_at' => now()->addDays(7),
        ]);

        $this->get('/invitations/'.$invitation->token)->assertOk();

        $response = $this->post('/invitations/'.$invitation->token, [
            'name' => 'New Member',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect(route('central.workspaces.enter', $tenant, absolute: false));
        $this->assertAuthenticated();

        $centralUser = CentralUser::query()->firstWhere('email', 'newbie@example.com');
        $this->assertNotNull($centralUser);
        $this->assertTrue($centralUser->tenants()->whereKey($tenant->id)->exists());

        $hasUserRole = $tenant->run(
            fn (): bool => User::query()->firstWhere('email', 'newbie@example.com')->hasRole('user'),
        );
        $this->assertTrue($hasUserRole);

        $this->assertNotNull($invitation->fresh()->accepted_at);
    }

    public function test_existing_user_can_accept_invitation_into_a_second_workspace(): void
    {
        $tenantA = $this->provisionTenant('Home Co', 'home-co', 'multi@example.com');
        $tenantB = $this->provisionTenant('Second Co', 'second-co', 'owner@second.test');

        $invitation = Invitation::create([
            'tenant_id' => $tenantB->id,
            'email' => 'multi@example.com',
            'role_slug' => 'user',
            'token' => Str::random(64),
            'expires_at' => now()->addDays(7),
        ]);

        $user = User::query()->firstWhere('email', 'multi@example.com');

        $this->actingAs($user)->post('/invitations/'.$invitation->token)
            ->assertRedirect(route('central.workspaces.enter', $tenantB, absolute: false));

        $centralUser = CentralUser::query()->firstWhere('email', 'multi@example.com');
        $this->assertSame(2, $centralUser->tenants()->count());

        $isAdminInA = $tenantA->run(fn (): bool => User::query()->firstWhere('email', 'multi@example.com')->isAdmin());
        $isAdminInB = $tenantB->run(fn (): bool => User::query()->firstWhere('email', 'multi@example.com')->isAdmin());

        $this->assertTrue($isAdminInA);
        $this->assertFalse($isAdminInB);
    }

    public function test_expired_invitation_cannot_be_accepted(): void
    {
        $tenant = $this->provisionTenant('Late Co', 'late-co', 'owner@late.test');

        $invitation = Invitation::create([
            'tenant_id' => $tenant->id,
            'email' => 'late@example.com',
            'role_slug' => 'user',
            'token' => Str::random(64),
            'expires_at' => now()->subDay(),
        ]);

        $this->get('/invitations/'.$invitation->token)->assertNotFound();
        $this->post('/invitations/'.$invitation->token, [
            'name' => 'Too Late',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertNotFound();
    }

    private function makeCentralAdmin(): User
    {
        $admin = User::factory()->create(['email' => 'super@platform.test']);

        $role = Role::query()->firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Administrator', 'description' => 'Platform admin', 'is_system' => true, 'dashboard_path' => '/module/dashboard'],
        );

        $admin->assignRole($role);

        return $admin;
    }
}
