<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalDamage;
use Modules\Rental\Models\RentalExtension;
use Modules\Rental\Models\RentalRate;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalCrudTest extends TestCase
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

    public function test_guests_are_redirected_from_rental_index(): void
    {
        $this->get(route('module.rental.index'))->assertRedirect(route('login'));
    }

    // ── Access control ─────────────────────────────────────────────────────

    public function test_user_without_permission_cannot_view_rentals(): void
    {
        $this->actingAs($this->createUserWithoutRole())
            ->get(route('module.rental.index'))
            ->assertForbidden();
    }

    public function test_user_with_view_permission_sees_rental_index(): void
    {
        $this->actingAs($this->createUserWithRole())
            ->get(route('module.rental.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Rental/Index'));
    }

    // ── Rates CRUD ─────────────────────────────────────────────────────────

    public function test_can_create_rental_rate(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->post(route('module.rental.rates.store'), [
                'name' => 'Daily SUV',
                'period_type' => 'daily',
                'rate_per_period' => 500000,
                'deposit_amount' => 1000000,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('rental_rates', ['name' => 'Daily SUV', 'period_type' => 'daily']);
    }

    public function test_can_update_rental_rate(): void
    {
        $rate = RentalRate::factory()->create(['name' => 'Old Name']);

        $this->actingAs($this->createAdminUser())
            ->patch(route('module.rental.rates.update', $rate), [
                'name' => 'New Name',
                'period_type' => 'weekly',
                'rate_per_period' => 2000000,
                'deposit_amount' => 1000000,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('rental_rates', ['id' => $rate->id, 'name' => 'New Name']);
    }

    public function test_can_delete_rental_rate(): void
    {
        $rate = RentalRate::factory()->create();

        $this->actingAs($this->createAdminUser())
            ->delete(route('module.rental.rates.destroy', $rate))
            ->assertRedirect();

        $this->assertDatabaseMissing('rental_rates', ['id' => $rate->id]);
    }

    // ── Rental CRUD ────────────────────────────────────────────────────────

    public function test_can_create_rental_in_draft(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $partner = Partner::factory()->create();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.store'), [
                'vehicle_id' => $vehicle->id,
                'partner_id' => $partner->id,
                'start_date' => '2027-01-10',
                'end_date' => '2027-01-14',
                'period_type' => 'daily',
                'rate_per_period' => 400000,
                'deposit_amount' => 800000,
            ])
            ->assertRedirect();

        $rental = Rental::first();
        $this->assertNotNull($rental);
        $this->assertSame(Rental::STATUS_DRAFT, $rental->status);
        $this->assertSame(5, $rental->total_periods);
        $this->assertEquals(2000000, (float) $rental->base_amount);
        $this->assertEquals(2000000, (float) $rental->total_amount);
        $this->assertStringStartsWith('RENT-', $rental->code);
    }

    public function test_rental_create_validates_end_date_before_start(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $partner = Partner::factory()->create();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.store'), [
                'vehicle_id' => $vehicle->id,
                'partner_id' => $partner->id,
                'start_date' => '2027-01-14',
                'end_date' => '2027-01-10',
                'period_type' => 'daily',
                'rate_per_period' => 400000,
            ])
            ->assertSessionHasErrors('end_date');
    }

    public function test_rental_blocks_overlapping_vehicle_booking(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $partner = Partner::factory()->create();

        // Existing confirmed rental occupies Jan 10–15
        Rental::factory()->confirmed()->create([
            'vehicle_id' => $vehicle->id,
            'start_date' => '2027-01-10',
            'end_date' => '2027-01-15',
        ]);

        // Attempt overlapping booking Jan 13–20
        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.store'), [
                'vehicle_id' => $vehicle->id,
                'partner_id' => $partner->id,
                'start_date' => '2027-01-13',
                'end_date' => '2027-01-20',
                'period_type' => 'daily',
                'rate_per_period' => 400000,
            ])
            ->assertSessionHasErrors('vehicle_id');
    }

    public function test_can_view_rental_show(): void
    {
        $rental = Rental::factory()->create();

        $this->actingAs($this->createUserWithRole())
            ->get(route('module.rental.show', $rental))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Rental/Show'));
    }

    public function test_can_update_draft_rental(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_DRAFT]);
        $newVehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $partner = Partner::factory()->create();

        $this->actingAs($this->createAdminUser())
            ->patch(route('module.rental.update', $rental), [
                'vehicle_id' => $newVehicle->id,
                'partner_id' => $partner->id,
                'start_date' => '2027-02-01',
                'end_date' => '2027-02-07',
                'period_type' => 'daily',
                'rate_per_period' => 600000,
                'deposit_amount' => 1200000,
            ])
            ->assertRedirect();

        $rental->refresh();
        $this->assertEquals(7, $rental->total_periods);
        $this->assertEquals(4200000, (float) $rental->base_amount);
    }

    public function test_cannot_update_active_rental(): void
    {
        $rental = Rental::factory()->active()->create();

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.edit', $rental))
            ->assertForbidden();
    }

    public function test_can_delete_draft_rental(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_DRAFT]);

        $this->actingAs($this->createAdminUser())
            ->delete(route('module.rental.destroy', $rental))
            ->assertRedirect(route('module.rental.index'));

        $this->assertDatabaseMissing('rentals', ['id' => $rental->id]);
    }

    public function test_cannot_delete_confirmed_rental(): void
    {
        $rental = Rental::factory()->confirmed()->create();

        $this->actingAs($this->createAdminUser())
            ->delete(route('module.rental.destroy', $rental))
            ->assertForbidden();
    }

    // ── Lifecycle ──────────────────────────────────────────────────────────

    public function test_confirm_transitions_draft_to_confirmed(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_DRAFT]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.confirm', $rental))
            ->assertRedirect();

        $rental->refresh();
        $this->assertSame(Rental::STATUS_CONFIRMED, $rental->status);
        $this->assertNotNull($rental->confirmed_at);
        $this->assertNotNull($rental->confirmed_by);
    }

    public function test_cannot_confirm_non_draft_rental(): void
    {
        $rental = Rental::factory()->confirmed()->create();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.confirm', $rental))
            ->assertStatus(422);
    }

    public function test_checkout_transitions_confirmed_to_active(): void
    {
        $rental = Rental::factory()->confirmed()->create();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.checkout', $rental), ['start_odometer' => 50000])
            ->assertRedirect();

        $rental->refresh();
        $this->assertSame(Rental::STATUS_ACTIVE, $rental->status);
        $this->assertNotNull($rental->checked_out_at);
        $this->assertEquals(50000, $rental->start_odometer);
    }

    public function test_return_transitions_active_to_returned_with_excess_km(): void
    {
        $rental = Rental::factory()->active()->create([
            'start_odometer' => 50000,
            'km_limit_per_period' => 100,
            'total_periods' => 3,
            'excess_km_rate' => 5000,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.return', $rental), [
                'actual_return_date' => '2027-01-15',
                'end_odometer' => 50400, // 400 km driven, limit = 300 → 100 excess
                'deposit_returned' => true,
            ])
            ->assertRedirect();

        $rental->refresh();
        $this->assertSame(Rental::STATUS_RETURNED, $rental->status);
        $this->assertEquals(100, $rental->excess_km);
        $this->assertEquals(500000, (float) $rental->excess_amount); // 100 * 5000
        $this->assertTrue($rental->deposit_returned);
    }

    public function test_complete_transitions_returned_to_completed(): void
    {
        $rental = Rental::factory()->returned()->create();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.complete', $rental))
            ->assertRedirect();

        $rental->refresh();
        $this->assertSame(Rental::STATUS_COMPLETED, $rental->status);
        $this->assertNotNull($rental->completed_at);
    }

    public function test_cancel_requires_reason(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_DRAFT]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.cancel', $rental), [])
            ->assertSessionHasErrors('cancelled_reason');
    }

    public function test_cancel_transitions_draft_to_cancelled(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_DRAFT]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.cancel', $rental), ['cancelled_reason' => 'Customer changed their mind.'])
            ->assertRedirect();

        $rental->refresh();
        $this->assertSame(Rental::STATUS_CANCELLED, $rental->status);
        $this->assertSame('Customer changed their mind.', $rental->cancelled_reason);
    }

    public function test_cannot_cancel_active_rental(): void
    {
        $rental = Rental::factory()->active()->create();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.cancel', $rental), ['cancelled_reason' => 'Test'])
            ->assertStatus(422);
    }

    // ── Extension ──────────────────────────────────────────────────────────

    public function test_can_extend_active_rental(): void
    {
        $rental = Rental::factory()->active()->create([
            'end_date' => '2027-01-20',
            'period_type' => 'daily',
            'rate_per_period' => 400000,
            'total_periods' => 5,
            'base_amount' => 2000000,
            'total_amount' => 2000000,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.extend', $rental), ['new_end_date' => '2027-01-23'])
            ->assertRedirect();

        $rental->refresh();
        $this->assertSame('2027-01-23', $rental->end_date->toDateString());
        $this->assertEquals(8, $rental->total_periods);
        $this->assertEquals(3200000, (float) $rental->total_amount);

        $this->assertDatabaseHas('rental_extensions', [
            'rental_id' => $rental->id,
            'extended_periods' => 3,
        ]);
    }

    // ── Damages ────────────────────────────────────────────────────────────

    public function test_can_record_damage_on_returned_rental(): void
    {
        $rental = Rental::factory()->returned()->create();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.damages.store', $rental), [
                'description' => 'Cracked windshield',
                'amount' => 2500000,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('rental_damages', [
            'rental_id' => $rental->id,
            'description' => 'Cracked windshield',
        ]);
    }

    public function test_can_delete_damage_record(): void
    {
        $rental = Rental::factory()->returned()->create();
        $damage = RentalDamage::factory()->create(['rental_id' => $rental->id]);

        $this->actingAs($this->createAdminUser())
            ->delete(route('module.rental.damages.destroy', [$rental, $damage]))
            ->assertRedirect();

        $this->assertDatabaseMissing('rental_damages', ['id' => $damage->id]);
    }

    // ── Model helpers ──────────────────────────────────────────────────────

    public function test_compute_periods_daily(): void
    {
        $this->assertSame(5, Rental::computePeriods('2027-01-10', '2027-01-14', 'daily'));
        $this->assertSame(1, Rental::computePeriods('2027-01-10', '2027-01-10', 'daily'));
    }

    public function test_compute_periods_weekly(): void
    {
        $this->assertSame(1, Rental::computePeriods('2027-01-10', '2027-01-16', 'weekly'));
        $this->assertSame(2, Rental::computePeriods('2027-01-10', '2027-01-20', 'weekly'));
    }

    public function test_is_overdue_only_when_active_and_past_end(): void
    {
        $rental = Rental::factory()->active()->create([
            'end_date' => now()->subDays(2)->toDateString(),
        ]);

        $this->assertTrue($rental->is_overdue);

        $rental->end_date = now()->addDay()->toDateString();
        $rental->save();

        $this->assertFalse($rental->fresh()->is_overdue);
    }

    public function test_completed_rental_is_never_overdue(): void
    {
        $rental = Rental::factory()->completed()->create([
            'end_date' => now()->subDays(5)->toDateString(),
        ]);

        $this->assertFalse($rental->is_overdue);
    }

    public function test_has_overlap_for_detects_confirmed_rental(): void
    {
        $vehicle = Vehicle::factory()->create();

        Rental::factory()->confirmed()->create([
            'vehicle_id' => $vehicle->id,
            'start_date' => '2027-03-01',
            'end_date' => '2027-03-10',
        ]);

        $this->assertTrue(Rental::hasOverlapFor($vehicle->id, '2027-03-05', '2027-03-15'));
        $this->assertFalse(Rental::hasOverlapFor($vehicle->id, '2027-03-11', '2027-03-20'));
    }

    // ── Cascade deletion ────────────────────────────────────────────────────

    public function test_deleting_rental_cascades_to_extensions_and_damages(): void
    {
        $rental = Rental::factory()->returned()->create();
        $extension = RentalExtension::factory()->create(['rental_id' => $rental->id]);
        $damage = RentalDamage::factory()->create(['rental_id' => $rental->id]);

        // Force-delete by setting to draft status first
        $rental->update(['status' => Rental::STATUS_DRAFT]);

        $this->actingAs($this->createAdminUser())
            ->delete(route('module.rental.destroy', $rental))
            ->assertRedirect();

        $this->assertDatabaseMissing('rental_extensions', ['id' => $extension->id]);
        $this->assertDatabaseMissing('rental_damages', ['id' => $damage->id]);
    }
}
