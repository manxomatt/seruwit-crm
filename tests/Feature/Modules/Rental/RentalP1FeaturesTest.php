<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Location;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Models\RentalInsurancePackage;
use Modules\Rental\Models\RentalVehicleSwap;
use Modules\Rental\Support\RentalAddonCatalog;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalP1FeaturesTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_create_rental_hydrates_location_branch_and_one_way_fee(): void
    {
        Setting::query()->updateOrCreate(
            ['key' => 'rental.default_one_way_fee'],
            [
                'group' => 'rental',
                'value' => '175000',
                'type' => 'number',
                'label' => 'Default One-Way Fee',
                'is_public' => false,
                'sort_order' => 1,
            ],
        );

        $pickup = Location::factory()->create([
            'name' => 'Pool Sudirman',
            'address' => 'Jl. Sudirman 1',
            'city' => 'Jakarta',
        ]);
        $return = Location::factory()->create([
            'name' => 'Pool BSD',
            'address' => 'Jl. BSD 2',
            'city' => 'Tangerang',
        ]);
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $partner = Partner::factory()->create(['status' => 'active']);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.store'), [
                'vehicle_id' => $vehicle->id,
                'partner_id' => $partner->id,
                'start_date' => '2027-03-01',
                'end_date' => '2027-03-03',
                'period_type' => 'daily',
                'rate_per_period' => 400000,
                'deposit_amount' => 0,
                'pickup_location_id' => $pickup->id,
                'return_location_id' => $return->id,
            ])
            ->assertRedirect();

        $rental = Rental::query()->latest('id')->first();
        $this->assertNotNull($rental);
        $this->assertSame($pickup->id, $rental->pickup_location_id);
        $this->assertSame($return->id, $rental->return_location_id);
        $this->assertStringContainsString('Sudirman', (string) $rental->pickup_location);
        $this->assertStringContainsString('BSD', (string) $rental->return_location);
        $this->assertEquals(175000, (float) $rental->one_way_fee_amount);
    }

    public function test_confirm_creates_one_way_and_insurance_addon_charges(): void
    {
        $package = RentalInsurancePackage::query()->updateOrCreate(
            ['code' => 'cdw'],
            [
                'name' => 'CDW — Collision Damage Waiver',
                'period_type' => 'daily',
                'amount' => 75000,
                'deductible_amount' => 500000,
                'coverage_limit' => 50000000,
                'description' => 'Collision Damage Waiver',
                'is_active' => true,
                'sort_order' => 1,
            ],
        );

        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_DRAFT,
            'period_type' => 'daily',
            'start_date' => '2027-03-01',
            'end_date' => '2027-03-03',
            'total_periods' => 3,
            'rate_per_period' => 400000,
            'base_amount' => 1200000,
            'total_amount' => 1200000,
            'deposit_amount' => 0,
            'one_way_fee_amount' => 150000,
            'insurance_package_id' => $package->id,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.confirm', $rental), ['deposit_collected' => true, 'payment_method' => 'cash'])
            ->assertRedirect();

        $this->assertDatabaseHas('rental_charges', [
            'rental_id' => $rental->id,
            'kind' => RentalCharge::KIND_ADDON,
            'addon_code' => RentalAddonCatalog::ONE_WAY,
            'amount' => 150000,
        ]);

        $this->assertDatabaseHas('rental_charges', [
            'rental_id' => $rental->id,
            'kind' => RentalCharge::KIND_ADDON,
            'addon_code' => 'insurance_cdw',
            'amount' => 225000,
        ]);

        $rental->refresh();
        $this->assertEquals(1575000, (float) $rental->total_amount);
    }

    public function test_extend_blocked_when_vehicle_overlaps_another_booking(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        $active = Rental::factory()->active()->create([
            'vehicle_id' => $vehicle->id,
            'start_date' => '2027-04-01',
            'end_date' => '2027-04-05',
            'period_type' => 'daily',
            'rate_per_period' => 400000,
            'total_periods' => 5,
            'base_amount' => 2000000,
            'total_amount' => 2000000,
        ]);

        Rental::factory()->confirmed()->create([
            'vehicle_id' => $vehicle->id,
            'start_date' => '2027-04-08',
            'end_date' => '2027-04-10',
        ]);

        $this->actingAs($this->createAdminUser())
            ->from(route('module.rental.show', $active))
            ->post(route('module.rental.extend', $active), ['new_end_date' => '2027-04-09'])
            ->assertRedirect(route('module.rental.show', $active))
            ->assertSessionHasErrors('new_end_date');

        $this->assertSame('2027-04-05', $active->fresh()->end_date->toDateString());
    }

    public function test_can_swap_vehicle_on_active_rental(): void
    {
        $from = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE, 'name' => 'Unit A']);
        $to = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE, 'name' => 'Unit B']);

        $rental = Rental::factory()->active()->create([
            'vehicle_id' => $from->id,
            'start_date' => '2027-05-01',
            'end_date' => '2027-05-07',
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.swap', $rental), [
                'to_vehicle_id' => $to->id,
                'odometer_km' => 12000,
                'notes' => 'Customer requested larger unit',
            ])
            ->assertRedirect();

        $this->assertSame($to->id, $rental->fresh()->vehicle_id);
        $this->assertDatabaseHas('rental_vehicle_swaps', [
            'rental_id' => $rental->id,
            'from_vehicle_id' => $from->id,
            'to_vehicle_id' => $to->id,
            'odometer_km' => 12000,
        ]);
        $this->assertSame(1, RentalVehicleSwap::query()->where('rental_id', $rental->id)->count());
    }

    public function test_swap_blocked_when_replacement_vehicle_is_booked(): void
    {
        $from = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $to = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        $rental = Rental::factory()->active()->create([
            'vehicle_id' => $from->id,
            'start_date' => '2027-06-01',
            'end_date' => '2027-06-05',
        ]);

        Rental::factory()->confirmed()->create([
            'vehicle_id' => $to->id,
            'start_date' => '2027-06-03',
            'end_date' => '2027-06-04',
        ]);

        $this->actingAs($this->createAdminUser())
            ->from(route('module.rental.show', $rental))
            ->post(route('module.rental.swap', $rental), ['to_vehicle_id' => $to->id])
            ->assertRedirect(route('module.rental.show', $rental))
            ->assertSessionHasErrors('to_vehicle_id');

        $this->assertSame($from->id, $rental->fresh()->vehicle_id);
        $this->assertSame(0, RentalVehicleSwap::query()->count());
    }

    public function test_create_form_includes_locations_and_insurance_packages(): void
    {
        Location::factory()->create();
        RentalInsurancePackage::query()->firstOrCreate(
            ['code' => 'tpl'],
            [
                'name' => 'TPL — Third Party Liability',
                'period_type' => 'daily',
                'amount' => 50000,
                'deductible_amount' => 0,
                'is_active' => true,
                'sort_order' => 2,
            ],
        );

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Create')
                ->has('locations')
                ->has('insurancePackages')
                ->has('defaultOneWayFee'));
    }
}
