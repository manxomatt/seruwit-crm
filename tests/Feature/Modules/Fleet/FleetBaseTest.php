<?php

namespace Tests\Feature\Modules\Fleet;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\FleetBase;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\AccessibleFleetBases;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class FleetBaseTest extends TestCase
{
    use RefreshDatabase;
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
    }

    public function test_guests_cannot_access_fleet_bases(): void
    {
        $this->get(route('module.fleet.bases.index'))->assertRedirect(route('login'));
    }

    public function test_bases_index_paginates_results(): void
    {
        $user = $this->createAdminUser();
        FleetBase::factory()->count(16)->create(['manager_id' => $user->id]);

        $this->actingAs($user)->get(route('module.fleet.bases.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Bases/Index')
                ->has('bases.data', 15)
                ->where('bases.per_page', 15)
                ->where('bases.total', 16)
            );
    }

    public function test_index_supports_case_insensitive_search_and_filters(): void
    {
        $user = $this->createAdminUser();
        FleetBase::factory()->create([
            'manager_id' => $user->id,
            'code' => 'JKT-CGK-01',
            'name' => 'Depot Cakung',
            'kind' => 'depot',
            'status' => 'active',
            'city' => 'Jakarta',
        ]);
        FleetBase::factory()->create([
            'manager_id' => $user->id,
            'code' => 'BDG-YRD-02',
            'name' => 'Yard Bandung',
            'kind' => 'yard',
            'status' => 'inactive',
            'city' => 'Bandung',
        ]);

        $this->actingAs($user)->get(route('module.fleet.bases.index', ['search' => 'cakung']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('bases.data', 1)
                ->where('bases.data.0.name', 'Depot Cakung')
            );

        $this->actingAs($user)->get(route('module.fleet.bases.index', ['status' => 'inactive']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('bases.data', 1)
                ->where('bases.data.0.name', 'Yard Bandung')
            );

        $this->actingAs($user)->get(route('module.fleet.bases.index', ['kind' => 'depot']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('bases.data', 1)
                ->where('bases.data.0.code', 'JKT-CGK-01')
            );
    }

    public function test_admin_can_batch_update_base_status(): void
    {
        $user = $this->createAdminUser();
        $first = FleetBase::factory()->create(['manager_id' => $user->id, 'status' => 'active']);
        $second = FleetBase::factory()->create(['manager_id' => $user->id, 'status' => 'active']);

        $this->actingAs($user)
            ->patch(route('module.fleet.bases.batch-status'), [
                'ids' => [$first->id, $second->id],
                'status' => 'inactive',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('fleet_bases', ['id' => $first->id, 'status' => 'inactive']);
        $this->assertDatabaseHas('fleet_bases', ['id' => $second->id, 'status' => 'inactive']);
    }

    public function test_batch_status_update_requires_valid_status_and_ids(): void
    {
        $user = $this->createAdminUser();
        $base = FleetBase::factory()->create(['manager_id' => $user->id]);

        $this->actingAs($user)
            ->patch(route('module.fleet.bases.batch-status'), [
                'ids' => [$base->id],
                'status' => 'not-a-status',
            ])
            ->assertSessionHasErrors('status');

        $this->actingAs($user)
            ->patch(route('module.fleet.bases.batch-status'), [
                'ids' => [],
                'status' => 'active',
            ])
            ->assertSessionHasErrors('ids');
    }

    public function test_admin_can_batch_delete_bases(): void
    {
        $user = $this->createAdminUser();
        $first = FleetBase::factory()->create(['manager_id' => $user->id]);
        $second = FleetBase::factory()->create(['manager_id' => $user->id]);

        $this->actingAs($user)
            ->post(route('module.fleet.bases.batch-destroy'), [
                'ids' => [$first->id, $second->id],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('fleet_bases', ['id' => $first->id]);
        $this->assertDatabaseMissing('fleet_bases', ['id' => $second->id]);
    }

    public function test_batch_delete_skips_bases_still_in_use(): void
    {
        $user = $this->createAdminUser();
        $free = FleetBase::factory()->create(['manager_id' => $user->id]);
        $busy = FleetBase::factory()->create(['manager_id' => $user->id]);
        Vehicle::factory()->create(['home_base_id' => $busy->id]);

        $this->actingAs($user)
            ->post(route('module.fleet.bases.batch-destroy'), [
                'ids' => [$free->id, $busy->id],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('fleet_bases', ['id' => $free->id]);
        $this->assertDatabaseHas('fleet_bases', ['id' => $busy->id]);
    }

    public function test_user_without_update_permission_cannot_batch_update_status(): void
    {
        $user = $this->createUserWithRole();
        $base = FleetBase::factory()->create(['manager_id' => $user->id, 'status' => 'active']);

        $this->actingAs($user)
            ->patch(route('module.fleet.bases.batch-status'), [
                'ids' => [$base->id],
                'status' => 'inactive',
            ])
            ->assertForbidden();
    }

    public function test_admin_can_open_create_fleet_base_page(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.fleet.bases.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Bases/Create')
                ->has('managers')
                ->has('kinds')
                ->has('locations')
                ->has('warehouses')
                ->has('locationLinkEnabled')
                ->has('warehouseLinkEnabled')
            );
    }

    public function test_admin_can_create_a_fleet_base(): void
    {
        $user = $this->createAdminUser();
        $staff = User::factory()->create();

        $response = $this->actingAs($user)->post(route('module.fleet.bases.store'), [
            'code' => 'JKT-CGK-01',
            'name' => 'Depot Cakung',
            'kind' => 'depot',
            'status' => 'active',
            'city' => 'Jakarta',
            'phone' => '081234567890',
            'email' => 'depot@example.com',
            'opens_at' => '08:00',
            'closes_at' => '17:00',
            'timezone' => 'Asia/Jakarta',
            'vehicle_capacity' => 40,
            'allows_overnight' => true,
            'service_radius_km' => 25.5,
            'manager_id' => $user->id,
            'staff_ids' => [$staff->id],
            'notes' => 'Primary Jakarta base',
        ]);

        $response->assertSessionHasNoErrors();

        $base = FleetBase::query()->firstWhere('code', 'JKT-CGK-01');
        $this->assertNotNull($base);
        $response->assertRedirect(route('module.fleet.bases.show', $base));
        $this->assertDatabaseHas('fleet_bases', [
            'code' => 'JKT-CGK-01',
            'name' => 'Depot Cakung',
            'manager_id' => $user->id,
            'vehicle_capacity' => 40,
        ]);
        $this->assertTrue($base->users()->whereKey([$user->id, $staff->id])->count() === 2);
    }

    public function test_creating_a_fleet_base_requires_a_unique_code(): void
    {
        $user = $this->createAdminUser();
        FleetBase::factory()->create([
            'code' => 'JKT-CGK-01',
            'manager_id' => $user->id,
        ]);

        $this->actingAs($user)->post(route('module.fleet.bases.store'), [
            'code' => 'JKT-CGK-01',
            'name' => 'Another Depot',
            'kind' => 'depot',
            'status' => 'active',
            'timezone' => 'Asia/Jakarta',
            'allows_overnight' => true,
            'manager_id' => $user->id,
        ])->assertSessionHasErrors('code');
    }

    public function test_show_page_displays_the_fleet_base(): void
    {
        $user = $this->createAdminUser();
        $base = FleetBase::factory()->create(['manager_id' => $user->id]);

        $this->actingAs($user)->get(route('module.fleet.bases.show', $base))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Bases/Show')
                ->where('base.id', $base->id)
                ->where('base.code', $base->code)
            );
    }

    public function test_admin_can_open_edit_fleet_base_page(): void
    {
        $user = $this->createAdminUser();
        $base = FleetBase::factory()->create(['manager_id' => $user->id]);

        $this->actingAs($user)->get(route('module.fleet.bases.edit', $base))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Bases/Edit')
                ->where('base.id', $base->id)
                ->has('managers')
                ->has('kinds')
                ->has('locations')
                ->has('warehouses')
                ->has('locationLinkEnabled')
                ->has('warehouseLinkEnabled')
            );
    }

    public function test_admin_can_update_a_fleet_base(): void
    {
        $user = $this->createAdminUser();
        $base = FleetBase::factory()->create([
            'manager_id' => $user->id,
            'name' => 'Old Name',
        ]);

        $this->actingAs($user)->patch(route('module.fleet.bases.update', $base), [
            'name' => 'Updated Depot',
            'kind' => 'yard',
            'status' => 'active',
            'timezone' => 'Asia/Jakarta',
            'allows_overnight' => false,
            'manager_id' => $user->id,
            'staff_ids' => [$user->id],
        ])->assertRedirect(route('module.fleet.bases.show', $base));

        $this->assertDatabaseHas('fleet_bases', [
            'id' => $base->id,
            'name' => 'Updated Depot',
            'kind' => 'yard',
            'allows_overnight' => false,
        ]);
    }

    public function test_admin_can_delete_a_fleet_base_without_vehicles(): void
    {
        $user = $this->createAdminUser();
        $base = FleetBase::factory()->create(['manager_id' => $user->id]);

        $this->actingAs($user)->delete(route('module.fleet.bases.destroy', $base))
            ->assertRedirect(route('module.fleet.bases.index'));

        $this->assertDatabaseMissing('fleet_bases', ['id' => $base->id]);
    }

    public function test_a_fleet_base_with_vehicles_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $base = FleetBase::factory()->create(['manager_id' => $user->id]);
        Vehicle::factory()->create(['home_base_id' => $base->id]);

        $this->actingAs($user)->delete(route('module.fleet.bases.destroy', $base))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('fleet_bases', ['id' => $base->id]);
    }

    public function test_vehicle_can_be_assigned_a_home_base(): void
    {
        $user = $this->createAdminUser();
        $base = FleetBase::factory()->create(['manager_id' => $user->id]);

        $response = $this->actingAs($user)->post(route('module.fleet.vehicles.store'), [
            'name' => 'Avanza',
            'plate_number' => 'B1234XYZ',
            'type' => 'car',
            'fuel_type' => 'petrol',
            'status' => 'active',
            'odometer_km' => 1000,
            'home_base_id' => $base->id,
        ]);

        $response->assertSessionHasNoErrors();

        $vehicle = Vehicle::query()->firstWhere('plate_number', 'B1234XYZ');
        $this->assertNotNull($vehicle);
        $response->assertRedirect(route('module.fleet.vehicles.show', $vehicle));
        $this->assertSame($base->id, $vehicle->home_base_id);
    }

    public function test_scoped_fleet_base_head_only_sees_assigned_bases(): void
    {
        $admin = $this->createAdminUser();
        $assigned = FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'ASSIGNED']);
        FleetBase::factory()->create(['manager_id' => $admin->id, 'code' => 'OTHER']);

        $head = $this->createScopedFleetBaseUser(AccessibleFleetBases::ROLE_HEAD, [$assigned->id]);

        $this->actingAs($head)->get(route('module.fleet.bases.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Bases/Index')
                ->where('bases.total', 1)
                ->where('bases.data.0.code', 'ASSIGNED')
            );
    }

    /**
     * @param  list<int>  $fleetBaseIds
     */
    protected function createScopedFleetBaseUser(string $roleSlug, array $fleetBaseIds): User
    {
        $user = User::factory()->create();
        $role = Role::query()->where('slug', $roleSlug)->firstOrFail();
        $user->assignRole($role);
        $user->fleetBases()->sync($fleetBaseIds);

        return $user;
    }
}
