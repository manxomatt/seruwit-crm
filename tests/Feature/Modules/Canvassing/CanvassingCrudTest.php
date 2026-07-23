<?php

namespace Tests\Feature\Modules\Canvassing;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Canvassing\Models\CanvassingPlan;
use Modules\Canvassing\Models\CanvassingTarget;
use Modules\Canvassing\Models\CanvassingVisit;
use Modules\Canvassing\Models\Salesperson;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class CanvassingCrudTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    // ── Guests ─────────────────────────────────────────────────────────────

    public function test_guests_are_redirected_from_canvassing_dashboard(): void
    {
        $this->get(route('module.canvassing.index'))->assertRedirect(route('login'));
    }

    // ── Access control ─────────────────────────────────────────────────────

    public function test_user_without_permission_cannot_view_canvassing(): void
    {
        $this->actingAs($this->createUserWithoutRole())
            ->get(route('module.canvassing.index'))
            ->assertForbidden();
    }

    public function test_user_with_view_permission_sees_canvassing_dashboard(): void
    {
        $this->actingAs($this->createUserWithRole())
            ->get(route('module.canvassing.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Canvassing/Index'));
    }

    // ── Salesperson CRUD ───────────────────────────────────────────────────

    public function test_can_create_salesperson(): void
    {
        $this->actingAs($this->createAdminUser())
            ->post(route('module.canvassing.salespeople.store'), [
                'name' => 'Budi Santoso',
                'employee_code' => 'SP-001',
                'area' => 'Jakarta Selatan',
                'phone' => '08123456789',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('salespeople', ['name' => 'Budi Santoso', 'area' => 'Jakarta Selatan']);
    }

    public function test_salesperson_employee_code_must_be_unique(): void
    {
        Salesperson::factory()->create(['employee_code' => 'SP-001']);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.canvassing.salespeople.store'), [
                'name' => 'Other Person',
                'employee_code' => 'SP-001',
            ])
            ->assertSessionHasErrors('employee_code');
    }

    public function test_can_view_salesperson_show(): void
    {
        $salesperson = Salesperson::factory()->create();

        $this->actingAs($this->createUserWithRole())
            ->get(route('module.canvassing.salespeople.show', $salesperson))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Canvassing/Salespeople/Show'));
    }

    public function test_can_update_salesperson(): void
    {
        $salesperson = Salesperson::factory()->create(['name' => 'Old Name']);

        $this->actingAs($this->createAdminUser())
            ->patch(route('module.canvassing.salespeople.update', $salesperson), [
                'name' => 'New Name',
                'area' => 'Bandung',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('salespeople', ['id' => $salesperson->id, 'name' => 'New Name', 'area' => 'Bandung']);
    }

    public function test_can_delete_salesperson(): void
    {
        $salesperson = Salesperson::factory()->create();

        $this->actingAs($this->createAdminUser())
            ->delete(route('module.canvassing.salespeople.destroy', $salesperson))
            ->assertRedirect();

        $this->assertDatabaseMissing('salespeople', ['id' => $salesperson->id]);
    }

    // ── Portal access control ──────────────────────────────────────────────

    public function test_user_without_checkin_permission_cannot_access_portal(): void
    {
        // Regular 'user' role has view but not checkin
        $this->actingAs($this->createUserWithRole())
            ->get(route('module.canvassing.portal.today'))
            ->assertForbidden();
    }

    public function test_user_with_checkin_permission_but_no_salesperson_link_gets_403(): void
    {
        $user = $this->createUserWithCheckinPermission();

        $this->actingAs($user)
            ->get(route('module.canvassing.portal.today'))
            ->assertForbidden();
    }

    public function test_linked_salesperson_can_access_portal_today(): void
    {
        [$user, $salesperson] = $this->createLinkedSalesperson();

        $this->actingAs($user)
            ->get(route('module.canvassing.portal.today'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Canvassing/Portal/Today'));
    }

    // ── Portal check-in / check-out ────────────────────────────────────────

    public function test_salesperson_can_check_in_at_a_partner(): void
    {
        [$user, $salesperson] = $this->createLinkedSalesperson();
        $partner = Partner::factory()->create();

        $this->actingAs($user)
            ->post(route('module.canvassing.portal.checkin.store'), [
                'partner_id' => $partner->id,
                'latitude' => '-6.2088',
                'longitude' => '106.8456',
            ])
            ->assertRedirect();

        $visit = CanvassingVisit::first();
        $this->assertNotNull($visit);
        $this->assertSame($salesperson->id, $visit->salesperson_id);
        $this->assertSame($partner->id, $visit->partner_id);
        $this->assertNotNull($visit->checked_in_at);
        $this->assertNull($visit->checked_out_at);
        $this->assertSame(CanvassingVisit::OUTCOME_PENDING, $visit->outcome);
    }

    public function test_salesperson_cannot_double_check_in(): void
    {
        [$user, $salesperson] = $this->createLinkedSalesperson();
        $partner = Partner::factory()->create();

        // First check-in
        CanvassingVisit::factory()->open()->create(['salesperson_id' => $salesperson->id, 'partner_id' => $partner->id]);

        // Second attempt
        $this->actingAs($user)
            ->post(route('module.canvassing.portal.checkin.store'), [
                'partner_id' => $partner->id,
            ])
            ->assertStatus(422);
    }

    public function test_salesperson_can_check_out_with_outcome(): void
    {
        [$user, $salesperson] = $this->createLinkedSalesperson();
        $visit = CanvassingVisit::factory()->open()->create(['salesperson_id' => $salesperson->id]);

        $this->actingAs($user)
            ->post(route('module.canvassing.portal.visits.checkout', $visit), [
                'outcome' => 'interested',
                'notes' => 'Very promising lead.',
            ])
            ->assertRedirect(route('module.canvassing.portal.today'));

        $visit->refresh();
        $this->assertNotNull($visit->checked_out_at);
        $this->assertSame('interested', $visit->outcome);
        $this->assertSame('Very promising lead.', $visit->notes);
    }

    public function test_salesperson_cannot_checkout_another_salespersons_visit(): void
    {
        [$user] = $this->createLinkedSalesperson();
        $otherSalesperson = Salesperson::factory()->create();
        $visit = CanvassingVisit::factory()->open()->create(['salesperson_id' => $otherSalesperson->id]);

        $this->actingAs($user)
            ->post(route('module.canvassing.portal.visits.checkout', $visit), [
                'outcome' => 'contacted',
            ])
            ->assertForbidden();
    }

    public function test_cannot_checkout_already_checked_out_visit(): void
    {
        [$user, $salesperson] = $this->createLinkedSalesperson();
        $visit = CanvassingVisit::factory()->completed()->create(['salesperson_id' => $salesperson->id]);

        $this->actingAs($user)
            ->post(route('module.canvassing.portal.visits.checkout', $visit), [
                'outcome' => 'contacted',
            ])
            ->assertStatus(422);
    }

    // ── Plans ──────────────────────────────────────────────────────────────

    public function test_admin_can_create_a_plan(): void
    {
        $salesperson = Salesperson::factory()->create();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.canvassing.plans.store'), [
                'salesperson_id' => $salesperson->id,
                'plan_date' => '2027-08-01',
                'notes' => 'Focus on the north district.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('canvassing_plans', [
            'salesperson_id' => $salesperson->id,
            'plan_date' => '2027-08-01',
        ]);
    }

    // ── Targets ────────────────────────────────────────────────────────────

    public function test_admin_can_set_monthly_target(): void
    {
        $salesperson = Salesperson::factory()->create();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.canvassing.targets.store'), [
                'salesperson_id' => $salesperson->id,
                'year' => 2027,
                'month' => 8,
                'target_visits' => 40,
                'target_new_partners' => 10,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('canvassing_targets', [
            'salesperson_id' => $salesperson->id,
            'year' => 2027,
            'month' => 8,
            'target_visits' => 40,
        ]);
    }

    public function test_setting_target_again_upserts_existing(): void
    {
        $salesperson = Salesperson::factory()->create();
        CanvassingTarget::factory()->create([
            'salesperson_id' => $salesperson->id,
            'year' => 2027,
            'month' => 8,
            'target_visits' => 30,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.canvassing.targets.store'), [
                'salesperson_id' => $salesperson->id,
                'year' => 2027,
                'month' => 8,
                'target_visits' => 50,
                'target_new_partners' => 12,
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('canvassing_targets', 1);
        $this->assertDatabaseHas('canvassing_targets', ['target_visits' => 50]);
    }

    // ── Model helpers ──────────────────────────────────────────────────────

    public function test_salesperson_for_user_returns_null_when_not_linked(): void
    {
        $user = User::factory()->create();
        $this->assertNull(Salesperson::forUser($user));
    }

    public function test_salesperson_for_user_returns_null_when_inactive(): void
    {
        $user = User::factory()->create();
        Salesperson::factory()->inactive()->create(['user_id' => $user->id]);

        $this->assertNull(Salesperson::forUser($user));
    }

    public function test_salesperson_for_user_resolves_active_record(): void
    {
        $user = User::factory()->create();
        $salesperson = Salesperson::factory()->create(['user_id' => $user->id]);

        $found = Salesperson::forUser($user);
        $this->assertNotNull($found);
        $this->assertSame($salesperson->id, $found->id);
    }

    public function test_visit_is_open_when_no_checkout(): void
    {
        $visit = CanvassingVisit::factory()->open()->create();
        $this->assertTrue($visit->is_open);
    }

    public function test_visit_is_not_open_after_checkout(): void
    {
        $visit = CanvassingVisit::factory()->completed()->create();
        $this->assertFalse($visit->is_open);
    }

    // ── Cascade deletion ────────────────────────────────────────────────────

    public function test_deleting_salesperson_cascades_to_visits_and_plans(): void
    {
        $salesperson = Salesperson::factory()->create();
        $partner = Partner::factory()->create();
        CanvassingVisit::factory()->create(['salesperson_id' => $salesperson->id, 'partner_id' => $partner->id]);
        CanvassingPlan::factory()->create(['salesperson_id' => $salesperson->id]);

        $this->actingAs($this->createAdminUser())
            ->delete(route('module.canvassing.salespeople.destroy', $salesperson))
            ->assertRedirect();

        $this->assertDatabaseMissing('canvassing_visits', ['salesperson_id' => $salesperson->id]);
        $this->assertDatabaseMissing('canvassing_plans', ['salesperson_id' => $salesperson->id]);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private function createUserWithCheckinPermission(): User
    {
        $user = User::factory()->create();
        $user->roles()->attach(Role::where('slug', 'salesperson')->firstOrFail());

        return $user;
    }

    /** @return array{0: User, 1: Salesperson} */
    private function createLinkedSalesperson(): array
    {
        $user = $this->createUserWithCheckinPermission();
        $salesperson = Salesperson::factory()->create(['user_id' => $user->id]);

        return [$user, $salesperson];
    }
}
