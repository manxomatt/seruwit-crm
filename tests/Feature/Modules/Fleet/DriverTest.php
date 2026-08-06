<?php

namespace Tests\Feature\Modules\Fleet;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Driver;
use Modules\TransportationManagement\Models\Trip;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class DriverTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_drivers(): void
    {
        $this->get(route('module.fleet.drivers.index'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_drivers(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.fleet.drivers.index'))->assertForbidden();
    }

    public function test_drivers_index_paginates_results(): void
    {
        $user = $this->createAdminUser();
        Driver::factory()->count(16)->create();

        $this->actingAs($user)->get(route('module.fleet.drivers.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('drivers.data', 15)
                ->where('drivers.per_page', 15)
                ->where('drivers.total', 16)
                ->where('drivers.last_page', 2)
                ->has('drivers.links')
            );
    }

    public function test_admin_can_open_create_driver_page(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.fleet.drivers.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Drivers/Create')
            );
    }

    public function test_admin_can_create_a_driver(): void
    {
        $user = $this->createAdminUser();

        $response = $this->actingAs($user)->post(route('module.fleet.drivers.store'), [
            'name' => 'Budi Santoso',
            'license_number' => 'SIM-12345678',
            'phone' => '081234567890',
            'status' => 'available',
        ]);

        $driver = Driver::firstWhere('license_number', 'SIM-12345678');
        $response->assertRedirect(route('module.fleet.drivers.show', $driver));
        $this->assertDatabaseHas('drivers', ['license_number' => 'SIM-12345678', 'name' => 'Budi Santoso']);
    }

    public function test_admin_can_open_edit_driver_page(): void
    {
        $user = $this->createAdminUser();
        $driver = Driver::factory()->create();

        $this->actingAs($user)->get(route('module.fleet.drivers.edit', $driver))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Drivers/Edit')
                ->where('driver.id', $driver->id)
            );
    }

    public function test_creating_a_driver_requires_a_unique_license_number(): void
    {
        $user = $this->createAdminUser();
        Driver::factory()->create(['license_number' => 'SIM-12345678']);

        $this->actingAs($user)->post(route('module.fleet.drivers.store'), [
            'name' => 'Another Driver',
            'license_number' => 'SIM-12345678',
            'phone' => '081234567890',
            'status' => 'available',
        ])->assertSessionHasErrors('license_number');
    }

    public function test_show_page_displays_the_driver(): void
    {
        $user = $this->createAdminUser();
        $driver = Driver::factory()->create();

        $this->actingAs($user)->get(route('module.fleet.drivers.show', $driver))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Drivers/Show')
                ->where('driver.id', $driver->id)
                ->has('documentsEnabled')
                ->has('documentSummary')
            );
    }

    public function test_admin_can_delete_a_driver_without_active_trips(): void
    {
        $user = $this->createAdminUser();
        $driver = Driver::factory()->create();

        $this->actingAs($user)->delete(route('module.fleet.drivers.destroy', $driver))
            ->assertRedirect(route('module.fleet.drivers.index'));

        $this->assertDatabaseMissing('drivers', ['id' => $driver->id]);
    }

    /**
     * Fleet has no knowledge of Trip, so this is enforced by the database's own
     * foreign key constraint on trips.driver_id (see the trips migration) —
     * Fleet's controller just turns the resulting QueryException into a
     * friendly redirect instead of a 500.
     */
    public function test_a_driver_referenced_by_a_trip_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $driver = Driver::factory()->create();
        Trip::factory()->create(['driver_id' => $driver->id, 'status' => Trip::STATUS_IN_PROGRESS]);

        $this->actingAs($user)->delete(route('module.fleet.drivers.destroy', $driver))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('drivers', ['id' => $driver->id]);
    }

    public function test_index_supports_case_insensitive_search_and_status_filter(): void
    {
        $user = $this->createAdminUser();
        Driver::factory()->create([
            'name' => 'Budi Santoso',
            'license_number' => 'SIM-ABC-001',
            'status' => 'available',
        ]);
        Driver::factory()->create([
            'name' => 'Siti Aminah',
            'license_number' => 'SIM-XYZ-999',
            'status' => 'inactive',
        ]);

        $this->actingAs($user)->get(route('module.fleet.drivers.index', ['search' => 'budi']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('drivers.data', 1)
                ->where('drivers.data.0.name', 'Budi Santoso')
            );

        $this->actingAs($user)->get(route('module.fleet.drivers.index', ['search' => 'sim-abc']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('drivers.data', 1)
                ->where('drivers.data.0.license_number', 'SIM-ABC-001')
            );

        $this->actingAs($user)->get(route('module.fleet.drivers.index', ['status' => 'inactive']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('drivers.data', 1)
                ->where('drivers.data.0.name', 'Siti Aminah')
            );
    }

    public function test_index_includes_informative_driver_fields(): void
    {
        $user = $this->createAdminUser();
        Driver::factory()->create([
            'name' => 'Andi Wijaya',
            'license_type' => 'B2',
            'license_expires_at' => '2027-06-15',
            'email' => 'andi@example.com',
            'photo_url' => 'https://cdn.example.com/andi.jpg',
            'user_id' => null,
        ]);

        $this->actingAs($user)->get(route('module.fleet.drivers.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('drivers.data', 1)
                ->where('drivers.data.0.name', 'Andi Wijaya')
                ->where('drivers.data.0.license_type', 'B2')
                ->where('drivers.data.0.license_expires_at', '2027-06-15')
                ->where('drivers.data.0.email', 'andi@example.com')
                ->where('drivers.data.0.photo_url', 'https://cdn.example.com/andi.jpg')
                ->where('drivers.data.0.user_id', null)
            );
    }

    public function test_admin_can_batch_update_driver_status(): void
    {
        $user = $this->createAdminUser();
        $first = Driver::factory()->create(['status' => 'available']);
        $second = Driver::factory()->create(['status' => 'available']);

        $this->actingAs($user)
            ->patch(route('module.fleet.drivers.batch-status'), [
                'ids' => [$first->id, $second->id],
                'status' => 'off_duty',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('drivers', ['id' => $first->id, 'status' => 'off_duty']);
        $this->assertDatabaseHas('drivers', ['id' => $second->id, 'status' => 'off_duty']);
    }

    public function test_batch_status_update_requires_valid_status_and_ids(): void
    {
        $user = $this->createAdminUser();
        $driver = Driver::factory()->create();

        $this->actingAs($user)
            ->patch(route('module.fleet.drivers.batch-status'), [
                'ids' => [$driver->id],
                'status' => 'not-a-status',
            ])
            ->assertSessionHasErrors('status');

        $this->actingAs($user)
            ->patch(route('module.fleet.drivers.batch-status'), [
                'ids' => [],
                'status' => 'available',
            ])
            ->assertSessionHasErrors('ids');
    }

    public function test_admin_can_batch_delete_drivers(): void
    {
        $user = $this->createAdminUser();
        $first = Driver::factory()->create();
        $second = Driver::factory()->create();

        $this->actingAs($user)
            ->post(route('module.fleet.drivers.batch-destroy'), [
                'ids' => [$first->id, $second->id],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('drivers', ['id' => $first->id]);
        $this->assertDatabaseMissing('drivers', ['id' => $second->id]);
    }

    public function test_batch_delete_skips_drivers_still_in_use(): void
    {
        $user = $this->createAdminUser();
        $free = Driver::factory()->create();
        $busy = Driver::factory()->create();
        Trip::factory()->create(['driver_id' => $busy->id, 'status' => Trip::STATUS_SCHEDULED]);

        $this->actingAs($user)
            ->post(route('module.fleet.drivers.batch-destroy'), [
                'ids' => [$free->id, $busy->id],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('drivers', ['id' => $free->id]);
        $this->assertDatabaseHas('drivers', ['id' => $busy->id]);
    }

    public function test_user_without_update_permission_cannot_batch_update_status(): void
    {
        $user = $this->createUserWithRole();
        $driver = Driver::factory()->create(['status' => 'available']);

        $this->actingAs($user)
            ->patch(route('module.fleet.drivers.batch-status'), [
                'ids' => [$driver->id],
                'status' => 'off_duty',
            ])
            ->assertForbidden();
    }
}
