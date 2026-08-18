<?php

namespace Tests\Feature\Reseller;

use App\Models\ResellerProfile;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithResellerCommissions;

/**
 * Who may see the programme, and whose numbers they see.
 */
class ResellerPortalTest extends TestCase
{
    use RefreshDatabase, WithResellerCommissions;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        config()->set('reseller.default_rate', ['type' => 'percent', 'value' => 10]);
    }

    private function makeResellerUser(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::query()->where('slug', 'reseller')->firstOrFail());

        return $user;
    }

    private function makeAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::query()->where('slug', 'admin')->firstOrFail());

        return $user;
    }

    public function test_guests_are_sent_to_login(): void
    {
        $this->get(route('module.reseller.dashboard'))->assertRedirect(route('login'));
    }

    public function test_plain_user_cannot_open_the_portal(): void
    {
        $user = User::factory()->create();
        $user->assignRole(Role::query()->where('slug', 'user')->firstOrFail());

        $this->actingAs($user)->get(route('module.reseller.dashboard'))->assertForbidden();
    }

    public function test_reseller_can_open_the_portal(): void
    {
        $reseller = $this->makeResellerUser();

        $this->actingAs($reseller)
            ->get(route('module.reseller.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Module/Reseller/Dashboard'));
    }

    /**
     * Enrolment is implicit: holding the role is enough, and the profile is
     * created the first time anything needs it.
     */
    public function test_opening_the_portal_provisions_a_referral_code(): void
    {
        $reseller = $this->makeResellerUser();

        $this->assertNull(ResellerProfile::query()->where('reseller_global_id', $reseller->global_id)->first());

        $this->actingAs($reseller)->get(route('module.reseller.dashboard'))->assertOk();

        $profile = ResellerProfile::query()->where('reseller_global_id', $reseller->global_id)->first();

        $this->assertNotNull($profile);
        $this->assertStringStartsWith('SRW-', $profile->referral_code);
    }

    public function test_portal_summary_counts_only_the_signed_in_reseller(): void
    {
        $reseller = $this->makeResellerUser();
        $other = $this->makeResellerUser();
        $plan = $this->makePlan(1_000_000);

        $this->confirmOrder($this->makeOrder($this->makeTenant($reseller->global_id), $plan));
        $this->confirmOrder($this->makeOrder($this->makeTenant($other->global_id), $plan));
        $this->confirmOrder($this->makeOrder($this->makeTenant($other->global_id), $plan));

        $this->actingAs($reseller)
            ->get(route('module.reseller.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                // Cast rather than compare identically: JSON collapses 100000.0 to an int.
                ->where('summary.pending', fn ($value): bool => (float) $value === 100_000.0)
                ->where('summary.tenants', 1)
                ->count('recent', 1));
    }

    public function test_commission_list_never_leaks_another_resellers_rows(): void
    {
        $reseller = $this->makeResellerUser();
        $other = $this->makeResellerUser();
        $plan = $this->makePlan(1_000_000);

        $mine = $this->makeTenant($reseller->global_id, ['name' => 'My Client']);
        $theirs = $this->makeTenant($other->global_id, ['name' => 'Their Client']);

        $this->confirmOrder($this->makeOrder($mine, $plan));
        $this->confirmOrder($this->makeOrder($theirs, $plan));

        $this->actingAs($reseller)
            ->get(route('module.reseller.commissions'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/Reseller/Commissions')
                ->count('commissions.data', 1)
                ->where('commissions.data.0.tenant_name', 'My Client'));
    }

    public function test_reseller_cannot_reach_the_admin_screens(): void
    {
        $reseller = $this->makeResellerUser();

        $this->actingAs($reseller)->get(route('module.resellers.index'))->assertForbidden();
        $this->actingAs($reseller)->get(route('module.resellers.show', $reseller->global_id))->assertForbidden();
        $this->actingAs($reseller)->get(route('module.reseller-commissions.index'))->assertForbidden();
        $this->actingAs($reseller)->post(route('module.reseller-rules.store'), [])->assertForbidden();
    }

    public function test_admin_can_reach_the_admin_screens(): void
    {
        $admin = $this->makeAdmin();
        $reseller = $this->makeResellerUser();

        $this->actingAs($admin)
            ->get(route('module.resellers.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/Resellers/Index')
                ->count('resellers', 1));

        $this->actingAs($admin)
            ->get(route('module.resellers.show', $reseller->global_id))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Module/Resellers/Show'));
    }
}
