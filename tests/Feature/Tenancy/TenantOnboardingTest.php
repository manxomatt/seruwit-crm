<?php

namespace Tests\Feature\Tenancy;

use App\Actions\Tenancy\CreateTenantAction;
use App\Models\CentralUser;
use App\Models\Invitation;
use App\Models\Role;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use App\Notifications\TenantInvitationNotification;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class TenantOnboardingTest extends TestCase
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

    private function provisionTenant(string $company, string $subdomain, string $ownerEmail): Tenant
    {
        User::factory()->create(['email' => $ownerEmail]);

        return app(CreateTenantAction::class)->execute(
            companyName: $company,
            subdomain: $subdomain,
            owner: CentralUser::query()->firstWhere('email', $ownerEmail),
        );
    }

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

        $this->actingAs($admin)->get('/admin/tenants')->assertOk();

        $response = $this->actingAs($admin)->post('/admin/tenants', [
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

        $this->actingAs($user)->get('/admin/tenants')->assertForbidden();
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
