<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Role;
use App\Models\User;
use App\Support\SystemRolePermissions;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\FleetBase;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\AccessibleFleetBases;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\RentalAvailabilityBoard;
use Tests\Support\WithRentalHandoverEvidence;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalBaseHeadAccessTest extends TestCase
{
    use RefreshDatabase;
    use WithRentalHandoverEvidence;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->withoutMiddleware([
            ValidateCsrfToken::class,
            VerifyCsrfToken::class,
        ]);
        $this->setUpRoles();
        SystemRolePermissions::seedRolesForModule('fleet');
        SystemRolePermissions::seedRolesForModule('rental');
        SystemRolePermissions::syncAllSystemRoles();
    }

    public function test_fleet_base_head_has_operational_rental_permissions_without_rates_and_settings(): void
    {
        $headRole = Role::query()->where('slug', AccessibleFleetBases::ROLE_HEAD)->firstOrFail();
        $permissionSlugs = $headRole->permissions()->pluck('slug')->all();

        $this->assertContains('rental.view', $permissionSlugs);
        $this->assertContains('rental.bookings', $permissionSlugs);
        $this->assertContains('rental.dispatch', $permissionSlugs);
        $this->assertContains('rental.damages', $permissionSlugs);
        $this->assertContains('rental.finance', $permissionSlugs);
        $this->assertNotContains('rental.rates', $permissionSlugs);
        $this->assertNotContains('rental.settings', $permissionSlugs);
    }

    public function test_fleet_base_head_cannot_access_rates_or_settings(): void
    {
        $admin = $this->createAdminUser();
        $baseA = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-A']);
        $head = $this->createHeadUser([$baseA->id]);

        $this->actingAs($head)
            ->get(route('module.rental.rates.index'))
            ->assertForbidden();

        $this->actingAs($head)
            ->get(route('module.rental.settings.index'))
            ->assertForbidden();

        $this->actingAs($head)
            ->patch(route('module.rental.settings.general.update'), [
                'default_one_way_fee' => 200000,
            ])
            ->assertForbidden();
    }

    public function test_fleet_base_head_only_sees_rentals_for_own_base_in_index(): void
    {
        $admin = $this->createAdminUser();
        $baseA = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-A']);
        $baseB = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-B']);

        $vehicleA = Vehicle::factory()->create(['home_base_id' => $baseA->id]);
        $vehicleB = Vehicle::factory()->create(['home_base_id' => $baseB->id]);

        $rentalA = Rental::factory()->create([
            'vehicle_id' => $vehicleA->id,
            'code' => 'RENT-BASE-A-01',
        ]);
        $rentalB = Rental::factory()->create([
            'vehicle_id' => $vehicleB->id,
            'code' => 'RENT-BASE-B-01',
        ]);

        $head = $this->createHeadUser([$baseA->id]);

        $this->actingAs($head)
            ->get(route('module.rental.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Index')
                ->where('rentals.total', 1)
                ->where('rentals.data.0.id', $rentalA->id)
            );
    }

    public function test_fleet_base_head_cannot_view_rental_from_another_base(): void
    {
        $admin = $this->createAdminUser();
        $baseA = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-A']);
        $baseB = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-B']);

        $vehicleB = Vehicle::factory()->create(['home_base_id' => $baseB->id]);
        $rentalB = Rental::factory()->create(['vehicle_id' => $vehicleB->id]);

        $head = $this->createHeadUser([$baseA->id]);

        $this->actingAs($head)
            ->get(route('module.rental.show', $rentalB))
            ->assertForbidden();
    }

    public function test_fleet_base_head_can_view_rental_from_own_base(): void
    {
        $admin = $this->createAdminUser();
        $baseA = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-A']);

        $vehicleA = Vehicle::factory()->create(['home_base_id' => $baseA->id]);
        $rentalA = Rental::factory()->create(['vehicle_id' => $vehicleA->id]);

        $head = $this->createHeadUser([$baseA->id]);

        $this->actingAs($head)
            ->get(route('module.rental.show', $rentalA))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Show')
                ->where('rental.id', $rentalA->id)
            );
    }

    public function test_fleet_base_head_cannot_access_checkout_or_return_page_for_other_base(): void
    {
        $admin = $this->createAdminUser();
        $baseA = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-A']);
        $baseB = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-B']);

        $vehicleB = Vehicle::factory()->create(['home_base_id' => $baseB->id]);
        $rentalConfirmed = Rental::factory()->confirmed()->create(['vehicle_id' => $vehicleB->id]);
        $rentalActive = Rental::factory()->active()->create(['vehicle_id' => $vehicleB->id]);

        $head = $this->createHeadUser([$baseA->id]);

        $this->actingAs($head)
            ->get(route('module.rental.checkout_page', $rentalConfirmed))
            ->assertForbidden();

        $this->actingAs($head)
            ->get(route('module.rental.return_page', $rentalActive))
            ->assertForbidden();
    }

    public function test_fleet_base_head_cannot_execute_actions_on_other_base_rental(): void
    {
        $admin = $this->createAdminUser();
        $baseA = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-A']);
        $baseB = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-B']);

        $vehicleB = Vehicle::factory()->create(['home_base_id' => $baseB->id]);
        $rentalDraft = Rental::factory()->create([
            'vehicle_id' => $vehicleB->id,
            'status' => Rental::STATUS_DRAFT,
            'deposit_amount' => 500_000,
        ]);

        $head = $this->createHeadUser([$baseA->id]);

        $this->actingAs($head)
            ->post(route('module.rental.confirm', $rentalDraft), [
                'deposit_collected' => true,
                'payment_method' => 'cash',
            ])
            ->assertForbidden();
    }

    public function test_fleet_base_head_cannot_delete_rental_even_for_own_base(): void
    {
        $admin = $this->createAdminUser();
        $baseA = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-A']);

        $vehicleA = Vehicle::factory()->create(['home_base_id' => $baseA->id]);
        $rentalDraft = Rental::factory()->create([
            'vehicle_id' => $vehicleA->id,
            'status' => Rental::STATUS_DRAFT,
        ]);

        $head = $this->createHeadUser([$baseA->id]);

        $this->actingAs($head)
            ->delete(route('module.rental.destroy', $rentalDraft))
            ->assertForbidden();

        $this->assertDatabaseHas('rentals', ['id' => $rentalDraft->id]);
    }

    public function test_fleet_base_head_cannot_create_rental_for_other_base_vehicle(): void
    {
        $admin = $this->createAdminUser();
        $baseA = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-A']);
        $baseB = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-B']);

        $vehicleB = Vehicle::factory()->create([
            'home_base_id' => $baseB->id,
            'status' => Vehicle::STATUS_ACTIVE,
        ]);
        $partner = Partner::factory()->create();

        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicleB->id,
            'vehicle_type' => null,
            'rental_class' => null,
            'rate_per_period' => 400000,
            'deposit_amount' => 800000,
            'is_active' => true,
        ]);

        $head = $this->createHeadUser([$baseA->id]);

        $this->actingAs($head)
            ->post(route('module.rental.store'), [
                'vehicle_id' => $vehicleB->id,
                'partner_id' => $partner->id,
                'start_date' => '2027-03-01',
                'end_date' => '2027-03-05',
                'period_type' => 'daily',
                'rate_per_period' => 400000,
            ])
            ->assertSessionHasErrors('vehicle_id');
    }

    public function test_fleet_base_head_can_create_and_manage_rental_for_own_base(): void
    {
        $admin = $this->createAdminUser();
        $baseA = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-A']);

        $vehicleA = Vehicle::factory()->create([
            'home_base_id' => $baseA->id,
            'status' => Vehicle::STATUS_ACTIVE,
        ]);
        $partner = Partner::factory()->create();

        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicleA->id,
            'vehicle_type' => null,
            'rental_class' => null,
            'rate_per_period' => 500000,
            'deposit_amount' => 1000000,
            'is_active' => true,
        ]);

        $head = $this->createHeadUser([$baseA->id]);

        $this->actingAs($head)
            ->post(route('module.rental.store'), [
                'vehicle_id' => $vehicleA->id,
                'partner_id' => $partner->id,
                'start_date' => '2027-04-01',
                'end_date' => '2027-04-03',
                'period_type' => 'daily',
                'rate_per_period' => 500000,
            ])
            ->assertRedirect();

        $rental = Rental::query()->where('vehicle_id', $vehicleA->id)->firstOrFail();
        $this->assertSame(Rental::STATUS_DRAFT, $rental->status);

        // Can confirm
        $this->actingAs($head)
            ->post(route('module.rental.confirm', $rental), [
                'deposit_collected' => true,
                'payment_method' => 'cash',
            ])
            ->assertRedirect();

        $rental->refresh();
        $this->assertSame(Rental::STATUS_CONFIRMED, $rental->status);

        // Can access checkout page
        $this->actingAs($head)
            ->get(route('module.rental.checkout_page', $rental))
            ->assertOk();

        // Can checkout
        $this->actingAs($head)
            ->post(route('module.rental.checkout', $rental), $this->rentalCheckoutPayload([
                'start_odometer' => 15000,
                'start_fuel_level' => 'full',
            ]))
            ->assertRedirect();

        $rental->refresh();
        $this->assertSame(Rental::STATUS_ACTIVE, $rental->status);

        // Can access return page
        $this->actingAs($head)
            ->get(route('module.rental.return_page', $rental))
            ->assertOk();
    }

    public function test_fleet_base_head_availability_board_only_includes_own_base_vehicles(): void
    {
        $admin = $this->createAdminUser();
        $baseA = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-A']);
        $baseB = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'BASE-B']);

        $vehicleA = Vehicle::factory()->create([
            'home_base_id' => $baseA->id,
            'name' => 'Car Alpha Base A',
        ]);
        $vehicleB = Vehicle::factory()->create([
            'home_base_id' => $baseB->id,
            'name' => 'Car Beta Base B',
        ]);

        $head = $this->createHeadUser([$baseA->id]);

        $this->actingAs($head);

        /** @var RentalAvailabilityBoard $board */
        $board = app(RentalAvailabilityBoard::class);
        $result = $board->build('2027-05-01', '2027-05-07');

        $vehicleNames = collect($result['vehicles'])->pluck('name')->all();
        $this->assertContains('Car Alpha Base A', $vehicleNames);
        $this->assertNotContains('Car Beta Base B', $vehicleNames);
    }

    /**
     * @param  list<int>  $fleetBaseIds
     */
    protected function createHeadUser(array $fleetBaseIds): User
    {
        $user = User::factory()->create();
        $role = Role::query()->where('slug', AccessibleFleetBases::ROLE_HEAD)->firstOrFail();
        $user->assignRole($role);
        $user->fleetBases()->sync($fleetBaseIds);

        return $user;
    }
}
