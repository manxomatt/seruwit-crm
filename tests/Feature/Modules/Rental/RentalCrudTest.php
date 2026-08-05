<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Location;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalDamage;
use Modules\Rental\Models\RentalExtension;
use Modules\Rental\Models\RentalRate;
use Modules\Tracking\Models\GpsDevice;
use Tests\Support\WithRentalHandoverEvidence;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalCrudTest extends TestCase
{
    use RefreshDatabase;
    use WithRentalHandoverEvidence;
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

    public function test_rental_index_paginates_results(): void
    {
        foreach (range(1, 16) as $i) {
            Rental::factory()->create(['code' => sprintf('RENT-PAGE-%03d', $i)]);
        }

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Index')
                ->where('rentals.per_page', 15)
                ->where('rentals.total', 16)
                ->where('rentals.last_page', 2)
                ->has('rentals.data', 15)
                ->has('rentals.links')
                ->has('filters'));

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.index', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('rentals.data', 1));
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
            ->assertRedirect(route('module.rental.show', Rental::query()->first()));

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

    public function test_walk_in_customer_can_be_quick_created_from_rental_form(): void
    {
        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.walk_in_customers.store'), [
                'name' => 'Budi Walk-in',
                'phone' => '081234567890',
                'email' => 'budi@example.test',
                'id_number' => '3175010101010001',
            ])
            ->assertRedirect(route('module.rental.create', [
                'partner_id' => Partner::query()->where('name', 'Budi Walk-in')->value('id'),
            ]))
            ->assertSessionHas('success');

        $partner = Partner::query()->where('name', 'Budi Walk-in')->first();
        $this->assertNotNull($partner);
        $this->assertSame('individual', $partner->account_type);
        $this->assertSame('customer', $partner->sub_type);
        $this->assertSame(1, $partner->customer_rank);
        $this->assertSame('active', $partner->status);
        $this->assertSame('6281234567890', $partner->phone);
        $this->assertSame('budi@example.test', $partner->email);
        $this->assertSame('3175010101010001', $partner->id_number);
    }

    public function test_walk_in_customer_reuses_existing_partner_by_phone(): void
    {
        $existing = Partner::factory()->individual()->create([
            'name' => 'Existing Customer',
            'phone' => '6281234567890',
            'mobile' => '6281234567890',
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.walk_in_customers.store'), [
                'name' => 'Someone Else',
                'phone' => '081234567890',
            ])
            ->assertRedirect(route('module.rental.create', ['partner_id' => $existing->id]))
            ->assertSessionHas('success');

        $this->assertSame(1, Partner::query()->where('phone', '6281234567890')->orWhere('mobile', '6281234567890')->count());
        $this->assertSame('Existing Customer', $existing->fresh()->name);
    }

    public function test_walk_in_customer_requires_name_and_phone(): void
    {
        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.walk_in_customers.store'), [
                'name' => '',
                'phone' => '',
            ])
            ->assertSessionHasErrors(['name', 'phone']);
    }

    public function test_rental_create_preselects_partner_from_query(): void
    {
        $partner = Partner::factory()->create();

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.create', ['partner_id' => $partner->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Create')
                ->where('selectedPartnerId', $partner->id));
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
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Show')
                ->has('addonCharges')
                ->has('addonCodes')
                ->has('trackingEnabled')
                ->has('hasGpsDevice')
                ->where('livePosition', null)
                ->has('gpsSummary')
                ->has('payment')
                ->has('invoicingEnabled')
                ->has('checklistItems')
                ->has('fuelLevels')
            );
    }

    public function test_rental_show_keeps_location_text_columns_as_strings(): void
    {
        $pickup = Location::factory()->create([
            'name' => 'Bandara Soekarno-Hatta',
            'address' => 'Terminal 3',
            'city' => 'Tangerang',
        ]);
        $return = Location::factory()->create([
            'name' => 'Hotel Mulia',
            'address' => 'Jl. Asia Afrika',
            'city' => 'Jakarta',
        ]);

        $rental = Rental::factory()->create([
            'pickup_location_id' => $pickup->id,
            'return_location_id' => $return->id,
            'pickup_location' => 'Terminal 3, Tangerang',
            'return_location' => 'Jl. Asia Afrika, Jakarta',
        ]);

        $this->actingAs($this->createUserWithRole())
            ->get(route('module.rental.show', $rental))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Show')
                ->where('rental.pickup_location', 'Terminal 3, Tangerang')
                ->where('rental.return_location', 'Jl. Asia Afrika, Jakarta')
                ->where('rental.pickup_location_id', $pickup->id)
                ->where('rental.return_location_id', $return->id)
            );
    }

    public function test_rental_show_includes_live_vehicle_position_when_tracker_has_a_fix(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_ACTIVE]);
        GpsDevice::factory()->pairedTo($rental->vehicle)->at(-6.2, 106.8)->create([
            'last_speed_kph' => 42,
            'last_recorded_at' => now(),
        ]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.show', $rental))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Show')
                ->where('trackingEnabled', true)
                ->where('hasGpsDevice', true)
                ->where('livePosition.latitude', '-6.2000000')
                ->where('livePosition.longitude', '106.8000000')
                ->where('livePosition.speed_kph', '42.00')
                ->has('gpsSummary.distance_km')
                ->has('gpsSummary.points')
            );
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
            ->post(route('module.rental.confirm', $rental), ['deposit_collected' => true, 'payment_method' => 'cash'])
            ->assertRedirect();

        $rental->refresh();
        $this->assertSame(Rental::STATUS_CONFIRMED, $rental->status);
        $this->assertNotNull($rental->confirmed_at);
        $this->assertNotNull($rental->confirmed_by);
    }

    public function test_confirm_succeeds_when_gateway_charges_table_is_missing(): void
    {
        Schema::dropIfExists('gateway_charges');

        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_DRAFT,
            'deposit_amount' => 500_000,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.confirm', $rental), ['deposit_collected' => true, 'payment_method' => 'cash'])
            ->assertRedirect();

        $this->assertSame(Rental::STATUS_CONFIRMED, $rental->fresh()->status);
    }

    public function test_cannot_confirm_non_draft_rental(): void
    {
        $rental = Rental::factory()->confirmed()->create();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.confirm', $rental), ['deposit_collected' => true, 'payment_method' => 'cash'])
            ->assertStatus(422);
    }

    public function test_checkout_transitions_confirmed_to_active(): void
    {
        $rental = Rental::factory()->confirmed()->create();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.checkout', $rental), $this->rentalCheckoutPayload([
                'start_odometer' => 50000,
                'start_fuel_level' => '3/4',
                'checkout_checklist' => [
                    'exterior_body' => true,
                    'tires_wheels' => true,
                    'lights' => false,
                    'interior' => true,
                    'documents' => true,
                    'spare_tools' => true,
                    'ac' => true,
                    'keys' => true,
                ],
                'checkout_notes' => 'Left rear light dim',
            ]))
            ->assertRedirect();

        $rental->refresh();
        $this->assertSame(Rental::STATUS_ACTIVE, $rental->status);
        $this->assertNotNull($rental->checked_out_at);
        $this->assertEquals(50000, $rental->start_odometer);
        $this->assertSame('3/4', $rental->start_fuel_level);
        $this->assertFalse($rental->checkout_checklist['lights']);
        $this->assertSame('Left rear light dim', $rental->checkout_notes);
        $this->assertNotEmpty($rental->checkout_photos);
        $this->assertNotNull($rental->checkout_signature_path);
    }

    public function test_checkout_requires_deposit_to_be_received(): void
    {
        $rental = Rental::factory()->confirmed()->create([
            'deposit_amount' => 1_000_000,
            'deposit_received_at' => null,
            'deposit_payment_method' => null,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.checkout', $rental), $this->rentalCheckoutPayload())
            ->assertSessionHasErrors('deposit');

        $this->assertSame(Rental::STATUS_CONFIRMED, $rental->fresh()->status);
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
            ->post(route('module.rental.return', $rental), $this->rentalReturnPayload([
                'actual_return_date' => '2027-01-15',
                'end_odometer' => 50400, // 400 km driven, limit = 300 → 100 excess
                'deposit_returned' => true,
            ]))
            ->assertRedirect();

        $rental->refresh();
        $this->assertSame(Rental::STATUS_RETURNED, $rental->status);
        $this->assertEquals(100, $rental->excess_km);
        $this->assertEquals(500000, (float) $rental->excess_amount); // 100 * 5000
        $this->assertTrue($rental->deposit_returned);
        $this->assertNotEmpty($rental->return_photos);
        $this->assertNotNull($rental->return_signature_path);
    }

    public function test_cannot_confirm_blacklisted_partner(): void
    {
        $partner = Partner::factory()->create([
            'status' => 'active',
            'is_blacklisted' => true,
            'blacklist_reason' => 'Unpaid damage',
        ]);
        $rental = Rental::factory()->create([
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_DRAFT,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.confirm', $rental), ['deposit_collected' => true, 'payment_method' => 'cash'])
            ->assertSessionHasErrors('partner_id');

        $this->assertSame(Rental::STATUS_DRAFT, $rental->fresh()->status);
    }

    public function test_checkout_requires_photo_and_signature(): void
    {
        $rental = Rental::factory()->confirmed()->create();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.checkout', $rental), [
                'start_odometer' => 1000,
            ])
            ->assertSessionHasErrors(['checkout_photos', 'checkout_signature']);
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

    public function test_can_record_damage_with_photo_path(): void
    {
        $rental = Rental::factory()->returned()->create(['deposit_amount' => 0]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.damages.store', $rental), [
                'description' => 'Dent on door',
                'amount' => 750000,
                'photo_path' => 'https://cdn.example.test/damage.jpg',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('rental_damages', [
            'rental_id' => $rental->id,
            'description' => 'Dent on door',
            'photo_path' => 'https://cdn.example.test/damage.jpg',
        ]);
    }

    public function test_compute_overdue_days(): void
    {
        $this->assertSame(0, Rental::computeOverdueDays('2027-01-10', '2027-01-10'));
        $this->assertSame(0, Rental::computeOverdueDays('2027-01-10', '2027-01-09'));
        $this->assertSame(3, Rental::computeOverdueDays('2027-01-10', '2027-01-13'));
    }

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
