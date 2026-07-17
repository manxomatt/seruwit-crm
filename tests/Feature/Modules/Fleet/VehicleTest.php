<?php

namespace Tests\Feature\Modules\Fleet;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\TransportationManagement\Models\Trip;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class VehicleTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_vehicles(): void
    {
        $this->get(route('module.fleet.vehicles.index'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_vehicles(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.fleet.vehicles.index'))->assertForbidden();
    }

    public function test_read_only_user_sees_index_without_write_abilities(): void
    {
        $user = $this->createUserWithRole();
        Vehicle::factory()->create();

        $this->actingAs($user)->get(route('module.fleet.vehicles.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Vehicles/Index')
                ->where('can.create', false)
                ->where('can.update', false)
                ->where('can.delete', false)
            );
    }

    public function test_index_supports_search_and_status_filter(): void
    {
        $user = $this->createAdminUser();
        Vehicle::factory()->create(['name' => 'Delivery Truck', 'plate_number' => 'B 1234 XYZ', 'status' => 'active']);
        Vehicle::factory()->create(['name' => 'Old Van', 'plate_number' => 'B 9999 ZZZ', 'status' => 'retired']);

        $this->actingAs($user)->get(route('module.fleet.vehicles.index', ['search' => 'Delivery']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('vehicles.data', 1)
                ->where('vehicles.data.0.name', 'Delivery Truck')
            );

        $this->actingAs($user)->get(route('module.fleet.vehicles.index', ['status' => 'retired']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('vehicles.data', 1)
                ->where('vehicles.data.0.name', 'Old Van')
            );
    }

    public function test_admin_can_create_a_vehicle(): void
    {
        $user = $this->createAdminUser();

        $response = $this->actingAs($user)->post(route('module.fleet.vehicles.store'), [
            'name' => 'Delivery Truck',
            'plate_number' => 'B 1234 XYZ',
            'type' => 'truck',
            'fuel_type' => 'diesel',
            'status' => 'active',
            'odometer_km' => 0,
        ]);

        $vehicle = Vehicle::firstWhere('plate_number', 'B 1234 XYZ');
        $response->assertRedirect(route('module.fleet.vehicles.show', $vehicle));
        $this->assertDatabaseHas('vehicles', ['plate_number' => 'B 1234 XYZ', 'name' => 'Delivery Truck']);
    }

    public function test_creating_a_vehicle_validates_required_fields_and_unique_plate(): void
    {
        $user = $this->createAdminUser();
        Vehicle::factory()->create(['plate_number' => 'B 1234 XYZ']);

        $this->actingAs($user)->post(route('module.fleet.vehicles.store'), [
            'plate_number' => 'B 1234 XYZ',
            'type' => 'truck',
            'fuel_type' => 'diesel',
            'status' => 'active',
        ])->assertSessionHasErrors(['name', 'plate_number']);
    }

    public function test_admin_can_update_a_vehicle(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create(['name' => 'Old Name']);

        $this->actingAs($user)->patch(route('module.fleet.vehicles.update', $vehicle), [
            'name' => 'New Name',
            'plate_number' => $vehicle->plate_number,
            'type' => $vehicle->type,
            'fuel_type' => $vehicle->fuel_type,
            'status' => 'maintenance',
        ])->assertRedirect(route('module.fleet.vehicles.show', $vehicle));

        $this->assertDatabaseHas('vehicles', ['id' => $vehicle->id, 'name' => 'New Name', 'status' => 'maintenance']);
    }

    public function test_admin_can_delete_a_vehicle_without_active_trips(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();

        $this->actingAs($user)->delete(route('module.fleet.vehicles.destroy', $vehicle))
            ->assertRedirect(route('module.fleet.vehicles.index'));

        $this->assertDatabaseMissing('vehicles', ['id' => $vehicle->id]);
    }

    /**
     * Fleet has no knowledge of Trip, so this is enforced by the database's own
     * foreign key constraint on trips.vehicle_id (see the trips migration) —
     * Fleet's controller just turns the resulting QueryException into a
     * friendly redirect instead of a 500.
     */
    public function test_a_vehicle_referenced_by_a_trip_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        Trip::factory()->create(['vehicle_id' => $vehicle->id, 'status' => Trip::STATUS_SCHEDULED]);

        $this->actingAs($user)->delete(route('module.fleet.vehicles.destroy', $vehicle))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('vehicles', ['id' => $vehicle->id]);
    }

    public function test_maintenance_log_can_be_added_and_removed_from_a_vehicle(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();

        $this->actingAs($user)->post(route('module.fleet.vehicles.maintenance-logs.store', $vehicle), [
            'type' => 'repair',
            'description' => 'Brake pad replacement',
            'scheduled_date' => now()->toDateString(),
            'status' => 'scheduled',
        ])->assertRedirect(route('module.fleet.vehicles.show', $vehicle));

        $this->assertDatabaseHas('vehicle_maintenance_logs', ['vehicle_id' => $vehicle->id, 'description' => 'Brake pad replacement']);

        $log = $vehicle->maintenanceLogs()->first();
        $this->actingAs($user)->delete(route('module.fleet.vehicles.maintenance-logs.destroy', [$vehicle, $log]))
            ->assertRedirect(route('module.fleet.vehicles.show', $vehicle));

        $this->assertDatabaseMissing('vehicle_maintenance_logs', ['id' => $log->id]);
    }

    public function test_fuel_log_can_be_added_and_removed_from_a_vehicle(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();

        $this->actingAs($user)->post(route('module.fleet.vehicles.fuel-logs.store', $vehicle), [
            'filled_at' => now()->toDateString(),
            'liters' => 40,
            'cost' => 600000,
        ])->assertRedirect(route('module.fleet.vehicles.show', $vehicle));

        $this->assertDatabaseHas('fuel_logs', ['vehicle_id' => $vehicle->id, 'liters' => 40]);

        $log = $vehicle->fuelLogs()->first();
        $this->actingAs($user)->delete(route('module.fleet.vehicles.fuel-logs.destroy', [$vehicle, $log]))
            ->assertRedirect(route('module.fleet.vehicles.show', $vehicle));

        $this->assertDatabaseMissing('fuel_logs', ['id' => $log->id]);
    }
}
