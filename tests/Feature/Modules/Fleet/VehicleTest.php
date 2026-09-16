<?php

namespace Tests\Feature\Modules\Fleet;

use App\Models\PlatformSetting;
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

    public function test_admin_can_view_vehicle_show_page(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create(['name' => 'Show Truck']);

        $this->actingAs($user)
            ->get(route('module.fleet.vehicles.show', $vehicle))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Vehicles/Show')
                ->where('vehicle.name', 'Show Truck')
                ->where('can.delete', true));
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

        $this->actingAs($user)->get(route('module.fleet.vehicles.index', ['search' => 'delivery']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('vehicles.data', 1)
                ->where('vehicles.data.0.name', 'Delivery Truck')
            );

        $this->actingAs($user)->get(route('module.fleet.vehicles.index', ['search' => 'b 1234']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('vehicles.data', 1)
                ->where('vehicles.data.0.plate_number', 'B 1234 XYZ')
            );

        $this->actingAs($user)->get(route('module.fleet.vehicles.index', ['status' => 'retired']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('vehicles.data', 1)
                ->where('vehicles.data.0.name', 'Old Van')
            );
    }

    public function test_vehicles_index_paginates_results(): void
    {
        $user = $this->createAdminUser();
        Vehicle::factory()->count(16)->create();

        $this->actingAs($user)->get(route('module.fleet.vehicles.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('vehicles.data', 15)
                ->where('vehicles.per_page', 15)
                ->where('vehicles.total', 16)
                ->where('vehicles.last_page', 2)
                ->has('vehicles.links')
            );
    }

    public function test_admin_can_open_create_vehicle_page(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.fleet.vehicles.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Vehicles/Create')
                ->has('bases')
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
            'model_year' => 2024,
            'color' => 'White',
            'rental_rate' => [
                'rate_per_period' => 500000,
            ],
        ]);

        $vehicle = Vehicle::firstWhere('plate_number', 'B 1234 XYZ');
        $this->assertNotNull($vehicle);
        $response->assertRedirect(route('module.fleet.vehicles.show', $vehicle));
        $this->assertDatabaseHas('vehicles', [
            'plate_number' => 'B 1234 XYZ',
            'name' => 'Delivery Truck',
            'model_year' => 2024,
            'color' => 'White',
        ]);
    }

    public function test_index_includes_model_year_and_color(): void
    {
        $user = $this->createAdminUser();
        Vehicle::factory()->create([
            'name' => 'Silver Van',
            'model_year' => 2022,
            'color' => 'Silver',
        ]);

        $this->actingAs($user)->get(route('module.fleet.vehicles.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Vehicles/Index')
                ->where('vehicles.data.0.name', 'Silver Van')
                ->where('vehicles.data.0.model_year', 2022)
                ->where('vehicles.data.0.color', 'Silver')
            );
    }

    public function test_vehicle_photo_url_is_persisted_and_returned_on_index(): void
    {
        $user = $this->createAdminUser();
        $photoUrl = 'https://cdn.example.com/vehicles/avanza.jpg';

        $this->actingAs($user)->post(route('module.fleet.vehicles.store'), [
            'name' => 'Avanza Photo',
            'plate_number' => 'B 5555 PHT',
            'type' => 'car',
            'fuel_type' => 'petrol',
            'status' => 'active',
            'odometer_km' => 1000,
            'photo_url' => $photoUrl,
            'rental_rate' => [
                'rate_per_period' => 350000,
            ],
        ])->assertRedirect();

        $this->assertDatabaseHas('vehicles', [
            'plate_number' => 'B 5555 PHT',
            'photo_url' => $photoUrl,
        ]);

        $this->actingAs($user)->get(route('module.fleet.vehicles.index', ['search' => 'Avanza Photo']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('vehicles.data.0.photo_url', $photoUrl)
            );
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

    public function test_admin_can_open_edit_vehicle_page(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();

        $this->actingAs($user)->get(route('module.fleet.vehicles.edit', $vehicle))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Vehicles/Edit')
                ->where('vehicle.id', $vehicle->id)
                ->has('bases')
            );
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

    public function test_admin_can_batch_update_vehicle_status(): void
    {
        $user = $this->createAdminUser();
        $first = Vehicle::factory()->create(['status' => 'active']);
        $second = Vehicle::factory()->create(['status' => 'active']);

        $this->actingAs($user)
            ->patch(route('module.fleet.vehicles.batch-status'), [
                'ids' => [$first->id, $second->id],
                'status' => 'maintenance',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('vehicles', ['id' => $first->id, 'status' => 'maintenance']);
        $this->assertDatabaseHas('vehicles', ['id' => $second->id, 'status' => 'maintenance']);
    }

    public function test_batch_status_update_requires_valid_status_and_ids(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();

        $this->actingAs($user)
            ->patch(route('module.fleet.vehicles.batch-status'), [
                'ids' => [$vehicle->id],
                'status' => 'not-a-status',
            ])
            ->assertSessionHasErrors('status');

        $this->actingAs($user)
            ->patch(route('module.fleet.vehicles.batch-status'), [
                'ids' => [],
                'status' => 'active',
            ])
            ->assertSessionHasErrors('ids');
    }

    public function test_admin_can_batch_delete_vehicles(): void
    {
        $user = $this->createAdminUser();
        $first = Vehicle::factory()->create();
        $second = Vehicle::factory()->create();

        $this->actingAs($user)
            ->post(route('module.fleet.vehicles.batch-destroy'), [
                'ids' => [$first->id, $second->id],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('vehicles', ['id' => $first->id]);
        $this->assertDatabaseMissing('vehicles', ['id' => $second->id]);
    }

    public function test_batch_delete_skips_vehicles_still_in_use(): void
    {
        $user = $this->createAdminUser();
        $free = Vehicle::factory()->create();
        $busy = Vehicle::factory()->create();
        Trip::factory()->create(['vehicle_id' => $busy->id, 'status' => Trip::STATUS_SCHEDULED]);

        $this->actingAs($user)
            ->post(route('module.fleet.vehicles.batch-destroy'), [
                'ids' => [$free->id, $busy->id],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('vehicles', ['id' => $free->id]);
        $this->assertDatabaseHas('vehicles', ['id' => $busy->id]);
    }

    public function test_user_without_update_permission_cannot_batch_update_status(): void
    {
        $user = $this->createUserWithRole();
        $vehicle = Vehicle::factory()->create(['status' => 'active']);

        $this->actingAs($user)
            ->patch(route('module.fleet.vehicles.batch-status'), [
                'ids' => [$vehicle->id],
                'status' => 'maintenance',
            ])
            ->assertForbidden();
    }

    public function test_index_passes_accurate_quota_in_per_vehicle_trial_mode(): void
    {
        PlatformSetting::setValue(PlatformSetting::KEY_CAPACITY_BUSINESS_MODEL, PlatformSetting::MODEL_PER_VEHICLE_TRIAL);
        PlatformSetting::setValue(PlatformSetting::KEY_MAX_TRIAL_VEHICLES_PER_TENANT, 5);

        $user = $this->createAdminUser();
        Vehicle::factory()->create(['status' => 'active', 'is_trial' => true]);

        $this->actingAs($user)
            ->get(route('module.fleet.vehicles.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Vehicles/Index')
                ->where('quota.current', 1)
                ->where('quota.max', 5)
                ->where('quota.total', 1)
                ->where('quota.reached', false)
            );
    }

    public function test_index_passes_null_max_quota_when_trial_is_unlimited(): void
    {
        PlatformSetting::setValue(PlatformSetting::KEY_CAPACITY_BUSINESS_MODEL, PlatformSetting::MODEL_PER_VEHICLE_TRIAL);
        PlatformSetting::setValue(PlatformSetting::KEY_MAX_TRIAL_VEHICLES_PER_TENANT, 0);

        $user = $this->createAdminUser();
        Vehicle::factory()->create(['status' => 'active', 'is_trial' => true]);

        $this->actingAs($user)
            ->get(route('module.fleet.vehicles.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Fleet/Vehicles/Index')
                ->where('quota.current', 1)
                ->where('quota.max', null)
                ->where('quota.reached', false)
            );
    }

    public function test_creating_vehicle_requires_rental_rate_when_uncovered(): void
    {
        $user = $this->createAdminUser();

        $response = $this->actingAs($user)->post(route('module.fleet.vehicles.store'), [
            'name' => 'Uncovered Car',
            'plate_number' => 'B 7777 UNC',
            'type' => 'car',
            'rental_class' => 'suv',
            'fuel_type' => 'petrol',
            'status' => 'active',
            'odometer_km' => 0,
        ]);

        $response->assertSessionHasErrors(['rental_rate.rate_per_period']);
        $this->assertDatabaseMissing('vehicles', ['plate_number' => 'B 7777 UNC']);
    }

    public function test_creating_vehicle_creates_rental_rate_when_provided(): void
    {
        $user = $this->createAdminUser();

        $response = $this->actingAs($user)->post(route('module.fleet.vehicles.store'), [
            'name' => 'Fortuner Black',
            'plate_number' => 'B 8888 FOR',
            'type' => 'car',
            'rental_class' => 'suv',
            'fuel_type' => 'diesel',
            'status' => 'active',
            'odometer_km' => 0,
            'rental_rate' => [
                'name' => 'Tarif SUV Khusus',
                'rate_per_period' => 750000,
                'deposit_amount' => 1000000,
                'scope' => 'class',
                'period_type' => 'daily',
            ],
        ]);

        $vehicle = Vehicle::firstWhere('plate_number', 'B 8888 FOR');
        $this->assertNotNull($vehicle);
        $response->assertRedirect(route('module.fleet.vehicles.show', $vehicle));

        $this->assertDatabaseHas('rental_rates', [
            'name' => 'Tarif SUV Khusus',
            'rental_class' => 'suv',
            'rate_per_period' => 750000,
            'deposit_amount' => 1000000,
            'is_active' => true,
        ]);
    }

    public function test_creating_vehicle_succeeds_without_rate_when_class_is_already_covered(): void
    {
        $user = $this->createAdminUser();

        \Modules\Rental\Models\RentalRate::create([
            'name' => 'Tarif MPV Komprehensif',
            'rental_class' => 'mpv',
            'vehicle_type' => 'car',
            'period_type' => 'daily',
            'rate_per_period' => 450000,
            'deposit_amount' => 500000,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->post(route('module.fleet.vehicles.store'), [
            'name' => 'Innova Zenix',
            'plate_number' => 'B 9999 INO',
            'type' => 'car',
            'rental_class' => 'mpv',
            'fuel_type' => 'hybrid',
            'status' => 'active',
            'odometer_km' => 0,
        ]);

        $vehicle = Vehicle::firstWhere('plate_number', 'B 9999 INO');
        $this->assertNotNull($vehicle);
        $response->assertRedirect(route('module.fleet.vehicles.show', $vehicle));
        $this->assertDatabaseHas('vehicles', [
            'plate_number' => 'B 9999 INO',
            'name' => 'Innova Zenix',
        ]);
    }
}
