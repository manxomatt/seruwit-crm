<?php

namespace Tests\Feature;

use App\Models\CentralUser;
use App\Models\Invitation;
use App\Models\Tenant;
use App\Notifications\TenantInvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class InvitationManagementTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpRoles();
    }

    public function test_tenant_admin_can_view_pending_invitations_in_users_index(): void
    {
        $admin = $this->createAdminUser();
        $tenantId = 'test-tenant-1';
        Tenant::withoutEvents(fn () => Tenant::create(['id' => $tenantId, 'name' => 'Test Tenant']));

        // Initialize tenant context for the test
        tenancy()->initialize(Tenant::find($tenantId));

        $invitation = Invitation::create([
            'tenant_id' => $tenantId,
            'email' => 'pending.user@example.com',
            'role_slug' => 'user',
            'token' => Str::random(64),
            'invited_by_global_id' => $admin->global_id,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($admin)
            ->get(route('module.users.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Users/Index')
            ->has('pendingInvitations', 1)
            ->where('pendingInvitations.0.email', 'pending.user@example.com')
        );

        tenancy()->end();
    }

    public function test_tenant_admin_can_resend_pending_invitation(): void
    {
        Notification::fake();
        $admin = $this->createAdminUser();
        $tenantId = 'test-tenant-2';
        Tenant::withoutEvents(fn () => Tenant::create(['id' => $tenantId, 'name' => 'Test Tenant']));

        tenancy()->initialize(Tenant::find($tenantId));

        $invitation = Invitation::create([
            'tenant_id' => $tenantId,
            'email' => 'pending.user@example.com',
            'role_slug' => 'user',
            'token' => 'old-token-value',
            'invited_by_global_id' => $admin->global_id,
            'expires_at' => now()->addDays(2),
        ]);

        $response = $this->actingAs($admin)
            ->post(route('module.users.invitations.resend', $invitation));

        $response->assertSessionHas('success');

        $invitation->refresh();
        $this->assertNotEquals('old-token-value', $invitation->token);
        $this->assertTrue($invitation->expires_at->gt(now()->addDays(6)));

        Notification::assertSentOnDemand(TenantInvitationNotification::class);

        tenancy()->end();
    }

    public function test_tenant_admin_can_revoke_pending_invitation(): void
    {
        $admin = $this->createAdminUser();
        $tenantId = 'test-tenant-3';
        Tenant::withoutEvents(fn () => Tenant::create(['id' => $tenantId, 'name' => 'Test Tenant']));

        tenancy()->initialize(Tenant::find($tenantId));

        $invitation = Invitation::create([
            'tenant_id' => $tenantId,
            'email' => 'pending.user@example.com',
            'role_slug' => 'user',
            'token' => Str::random(64),
            'invited_by_global_id' => $admin->global_id,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($admin)
            ->delete(route('module.users.invitations.destroy', $invitation));

        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('invitations', [
            'id' => $invitation->id,
        ]);

        tenancy()->end();
    }

    public function test_central_user_can_view_and_decline_incoming_invitations(): void
    {
        $user = CentralUser::create([
            'name' => 'John Doe',
            'email' => 'john.doe@example.com',
            'password' => bcrypt('secret123'),
        ]);

        $tenantId = 'acme-corp';
        Tenant::withoutEvents(fn () => Tenant::create(['id' => $tenantId, 'name' => 'Acme Corp']));

        $invitation = Invitation::create([
            'tenant_id' => $tenantId,
            'email' => $user->email,
            'role_slug' => 'user',
            'token' => 'test-invitation-token-123',
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($user)
            ->get(route('central.workspaces.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Central/Workspaces')
            ->has('invitations', 1)
            ->where('invitations.0.token', 'test-invitation-token-123')
            ->where('invitations.0.tenant_name', 'Acme Corp')
        );

        // Test decline
        $declineResponse = $this->actingAs($user)
            ->post(route('central.invitations.decline', $invitation->token));

        $declineResponse->assertRedirect(route('central.workspaces.index'));
        $this->assertDatabaseMissing('invitations', [
            'id' => $invitation->id,
        ]);
    }
}
