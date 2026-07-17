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
}
