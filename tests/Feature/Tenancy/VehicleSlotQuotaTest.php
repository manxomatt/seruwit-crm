<?php

namespace Tests\Feature\Tenancy;

use App\Models\Tenant;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class VehicleSlotQuotaTest extends TestCase
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
        $this->seed(PlanSeeder::class);
        $this->setUpRoles();
    }

    private function createTenantOnPlan(string $planKey): Tenant
    {
        return Tenant::query()->create([
            'name' => 'Quota Test Tenant',
            'data' => [
                'plan' => $planKey,
            ],
        ]);
    }

    public function test_creating_active_or_maintenance_vehicles_consumes_quota_and_blocks_when_full(): void
    {
        $tenant = $this->createTenantOnPlan('free'); // max_vehicles = 2
        $admin = $this->createAdminUser();

        tenancy()->initialize($tenant);

        // 1. Create 1 active vehicle (1/2)
        $response1 = $this->actingAs($admin)->post(route('module.fleet.vehicles.store'), [
            'name' => 'Active Vehicle 1',
            'plate_number' => 'B 1001 ABC',
            'type' => 'car',
            'fuel_type' => 'petrol',
            'status' => 'active',
        ]);
        $response1->assertSessionHasNoErrors();
        $this->assertSame(1, Vehicle::billable()->count());

        // 2. Create 1 maintenance vehicle (2/2)
        $response2 = $this->actingAs($admin)->post(route('module.fleet.vehicles.store'), [
            'name' => 'Maintenance Vehicle 2',
            'plate_number' => 'B 1002 ABC',
            'type' => 'car',
            'fuel_type' => 'petrol',
            'status' => 'maintenance',
        ]);
        $response2->assertSessionHasNoErrors();
        $this->assertSame(2, Vehicle::billable()->count());

        // 3. Attempt to create a 3rd active vehicle -> should be blocked by quota
        $response3 = $this->actingAs($admin)->post(route('module.fleet.vehicles.store'), [
            'name' => 'Active Vehicle 3',
            'plate_number' => 'B 1003 ABC',
            'type' => 'car',
            'fuel_type' => 'petrol',
            'status' => 'active',
        ]);
        $response3->assertSessionHasErrors('name');
        $this->assertSame(2, Vehicle::billable()->count());

        tenancy()->end();
    }

    public function test_creating_non_billable_vehicles_is_allowed_even_when_quota_is_full(): void
    {
        $tenant = $this->createTenantOnPlan('free'); // max_vehicles = 2
        $admin = $this->createAdminUser();

        tenancy()->initialize($tenant);

        // Fill the 2 billable slots
        Vehicle::factory()->count(2)->create(['status' => 'active']);
        $this->assertSame(2, Vehicle::billable()->count());

        // Creating an inactive/retired vehicle should SUCCEED even though billable quota is full
        $response = $this->actingAs($admin)->post(route('module.fleet.vehicles.store'), [
            'name' => 'Retired Vehicle History',
            'plate_number' => 'B 9999 RET',
            'type' => 'truck',
            'fuel_type' => 'diesel',
            'status' => 'retired',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame(3, Vehicle::count());
        $this->assertSame(2, Vehicle::billable()->count());
        $this->assertSame(1, Vehicle::nonBillable()->count());

        tenancy()->end();
    }

    public function test_setting_active_vehicle_to_inactive_frees_quota_slot(): void
    {
        $tenant = $this->createTenantOnPlan('free'); // max_vehicles = 2
        $admin = $this->createAdminUser();

        tenancy()->initialize($tenant);

        // 2 active vehicles created
        $vehicle1 = Vehicle::factory()->create(['status' => 'active']);
        $vehicle2 = Vehicle::factory()->create(['status' => 'active']);
        $this->assertSame(2, Vehicle::billable()->count());

        // Attempting to create another active vehicle fails
        $responseFail = $this->actingAs($admin)->post(route('module.fleet.vehicles.store'), [
            'name' => 'Vehicle Blocked',
            'plate_number' => 'B 1111 BLK',
            'type' => 'car',
            'fuel_type' => 'petrol',
            'status' => 'active',
        ]);
        $responseFail->assertSessionHasErrors('name');

        // Now update vehicle1 status to 'retired'
        $updateResponse = $this->actingAs($admin)->put(route('module.fleet.vehicles.update', $vehicle1), [
            'name' => $vehicle1->name,
            'plate_number' => $vehicle1->plate_number,
            'type' => $vehicle1->type,
            'fuel_type' => $vehicle1->fuel_type,
            'status' => 'retired',
        ]);
        $updateResponse->assertSessionHasNoErrors();

        // Billable count is now 1 of 2
        $this->assertSame(1, Vehicle::billable()->count());

        // Creating a new active vehicle now succeeds!
        $responseSuccess = $this->actingAs($admin)->post(route('module.fleet.vehicles.store'), [
            'name' => 'New Active Vehicle',
            'plate_number' => 'B 2222 NEW',
            'type' => 'car',
            'fuel_type' => 'petrol',
            'status' => 'active',
        ]);
        $responseSuccess->assertSessionHasNoErrors();
        $this->assertSame(2, Vehicle::billable()->count());

        tenancy()->end();
    }

    public function test_updating_status_from_inactive_to_active_is_validated_against_quota(): void
    {
        $tenant = $this->createTenantOnPlan('free'); // max_vehicles = 2
        $admin = $this->createAdminUser();

        tenancy()->initialize($tenant);

        // 2 active vehicles + 1 retired vehicle
        Vehicle::factory()->count(2)->create(['status' => 'active']);
        $retiredVehicle = Vehicle::factory()->create(['status' => 'retired']);

        $this->assertSame(2, Vehicle::billable()->count());
        $this->assertSame(3, Vehicle::count());

        // Attempting to reactivate the retired vehicle must fail because quota (2) is full
        $response = $this->actingAs($admin)->put(route('module.fleet.vehicles.update', $retiredVehicle), [
            'name' => $retiredVehicle->name,
            'plate_number' => $retiredVehicle->plate_number,
            'type' => $retiredVehicle->type,
            'fuel_type' => $retiredVehicle->fuel_type,
            'status' => 'active',
        ]);

        $response->assertSessionHasErrors('status');
        $this->assertSame('retired', $retiredVehicle->fresh()->status);

        tenancy()->end();
    }

    public function test_batch_updating_vehicle_status_is_validated_against_quota(): void
    {
        $tenant = $this->createTenantOnPlan('free'); // max_vehicles = 2
        $admin = $this->createAdminUser();

        tenancy()->initialize($tenant);

        // 1 active vehicle + 2 retired vehicles
        $activeVehicle = Vehicle::factory()->create(['status' => 'active']);
        $retired1 = Vehicle::factory()->create(['status' => 'retired']);
        $retired2 = Vehicle::factory()->create(['status' => 'retired']);

        // Current billable = 1, available = 1
        // Attempting to batch-reactivate BOTH retired vehicles (adding 2) would reach 3, exceeding limit of 2
        $response = $this->actingAs($admin)->post(route('module.fleet.vehicles.batch_status'), [
            'ids' => [$retired1->id, $retired2->id],
            'status' => 'active',
        ]);

        $response->assertSessionHasErrors('status');
        $this->assertSame(1, Vehicle::billable()->count());

        // Reactivating just 1 retired vehicle (1 + 1 = 2) should SUCCEED
        $responseSuccess = $this->actingAs($admin)->post(route('module.fleet.vehicles.batch_status'), [
            'ids' => [$retired1->id],
            'status' => 'active',
        ]);

        $responseSuccess->assertSessionHasNoErrors();
        $this->assertSame(2, Vehicle::billable()->count());

        tenancy()->end();
    }
}
