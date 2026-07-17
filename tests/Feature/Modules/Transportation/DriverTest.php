<?php

namespace Tests\Feature\Modules\Transportation;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\TransportationManagement\Models\Driver;
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
        $this->get(route('module.transportation.drivers.index'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_drivers(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.transportation.drivers.index'))->assertForbidden();
    }

    public function test_admin_can_create_a_driver(): void
    {
        $user = $this->createAdminUser();

        $response = $this->actingAs($user)->post(route('module.transportation.drivers.store'), [
            'name' => 'Budi Santoso',
            'license_number' => 'SIM-12345678',
            'phone' => '081234567890',
            'status' => 'available',
        ]);

        $driver = Driver::firstWhere('license_number', 'SIM-12345678');
        $response->assertRedirect(route('module.transportation.drivers.show', $driver));
        $this->assertDatabaseHas('drivers', ['license_number' => 'SIM-12345678', 'name' => 'Budi Santoso']);
    }

    public function test_creating_a_driver_requires_a_unique_license_number(): void
    {
        $user = $this->createAdminUser();
        Driver::factory()->create(['license_number' => 'SIM-12345678']);

        $this->actingAs($user)->post(route('module.transportation.drivers.store'), [
            'name' => 'Another Driver',
            'license_number' => 'SIM-12345678',
            'phone' => '081234567890',
            'status' => 'available',
        ])->assertSessionHasErrors('license_number');
    }

    public function test_show_page_lists_the_drivers_trip_history(): void
    {
        $user = $this->createAdminUser();
        $driver = Driver::factory()->create();
        $trip = Trip::factory()->create(['driver_id' => $driver->id]);

        $this->actingAs($user)->get(route('module.transportation.drivers.show', $driver))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/TransportationManagement/Drivers/Show')
                ->has('driver.trips', 1)
                ->where('driver.trips.0.id', $trip->id)
            );
    }

    public function test_admin_can_delete_a_driver_without_active_trips(): void
    {
        $user = $this->createAdminUser();
        $driver = Driver::factory()->create();

        $this->actingAs($user)->delete(route('module.transportation.drivers.destroy', $driver))
            ->assertRedirect(route('module.transportation.drivers.index'));

        $this->assertDatabaseMissing('drivers', ['id' => $driver->id]);
    }

    public function test_a_driver_with_an_active_trip_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $driver = Driver::factory()->create();
        Trip::factory()->create(['driver_id' => $driver->id, 'status' => Trip::STATUS_IN_PROGRESS]);

        $this->actingAs($user)->delete(route('module.transportation.drivers.destroy', $driver))
            ->assertRedirect();

        $this->assertDatabaseHas('drivers', ['id' => $driver->id]);
    }
}
