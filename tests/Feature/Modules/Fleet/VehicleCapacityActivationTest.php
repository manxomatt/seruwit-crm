<?php

namespace Tests\Feature\Modules\Fleet;

use App\Models\Tenant;
use App\Models\TenantCapacityTransaction;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\VehicleCapacityService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class VehicleCapacityActivationTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    private User $user;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $this->seed(PlanSeeder::class);
        $this->setUpRoles();
        $this->user = $this->createAdminUser();

        $this->tenant = Tenant::withoutEvents(function (): Tenant {
            return Tenant::create([
                'id' => fake()->uuid(),
                'name' => 'Trans Express',
                'status' => 'active',
                'plan' => 'starter',
                'unit_capacity_credits' => 3,
                'provision' => ['owner_global_id' => fake()->uuid()],
            ]);
        });
        $this->tenant->domains()->create(['domain' => 'transexpress.seruwit.test']);

        // Bind tenant to container
        app()->instance('tenant', $this->tenant);
    }

    public function test_service_can_activate_vehicle_consuming_credit(): void
    {
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_INACTIVE,
            'activated_at' => null,
            'active_until' => null,
        ]);

        $service = app(VehicleCapacityService::class);
        $result = $service->activate($vehicle);

        $this->assertTrue($result['success']);
        $this->assertSame(2, $result['new_balance']);

        $vehicle->refresh();
        $this->assertSame(Vehicle::STATUS_ACTIVE, $vehicle->status);
        $this->assertNotNull($vehicle->activated_at);
        $this->assertNotNull($vehicle->active_until);

        $this->tenant->refresh();
        $this->assertSame(2, $this->tenant->unit_capacity_credits);

        $this->assertDatabaseHas('tenant_capacity_transactions', [
            'tenant_id' => $this->tenant->id,
            'amount' => -1,
            'balance_after' => 2,
            'type' => TenantCapacityTransaction::TYPE_ACTIVATION,
        ]);
    }

    public function test_service_can_renew_vehicle_active_until_in_future(): void
    {
        $now = Carbon::now();
        $initialExpiry = $now->copy()->addDays(10);

        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'activated_at' => $now->copy()->subDays(20),
            'active_until' => $initialExpiry,
        ]);

        $service = app(VehicleCapacityService::class);
        $result = $service->renew($vehicle);

        $this->assertTrue($result['success']);
        $this->assertSame(2, $result['new_balance']);

        $vehicle->refresh();
        // Should extend by 30 days from previous future expiration (10 + 30 = 40 days)
        $this->assertSame($initialExpiry->copy()->addDays(30)->toDateString(), $vehicle->active_until->toDateString());
    }

    public function test_cannot_activate_when_balance_is_zero(): void
    {
        $this->tenant->update(['unit_capacity_credits' => 0]);

        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_INACTIVE,
        ]);

        $service = app(VehicleCapacityService::class);

        $this->expectException(\RuntimeException::class);
        $service->activate($vehicle);
    }

    public function test_controller_activate_route_consumes_credit(): void
    {
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_INACTIVE,
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('module.fleet.vehicles.activate', $vehicle->id));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $vehicle->refresh();
        $this->assertSame(Vehicle::STATUS_ACTIVE, $vehicle->status);
        $this->assertNotNull($vehicle->active_until);

        $this->tenant->refresh();
        $this->assertSame(2, $this->tenant->unit_capacity_credits);
    }

    public function test_controller_toggle_auto_renew(): void
    {
        $vehicle = Vehicle::factory()->create([
            'auto_renew' => true,
        ]);

        $response = $this->actingAs($this->user)
            ->patch(route('module.fleet.vehicles.auto-renew', $vehicle->id), [
                'auto_renew' => false,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $vehicle->refresh();
        $this->assertFalse($vehicle->auto_renew);
    }

    public function test_registration_in_per_vehicle_trial_mode_starts_trial_without_consuming_credit(): void
    {
        \App\Models\PlatformSetting::setValue(\App\Models\PlatformSetting::KEY_CAPACITY_BUSINESS_MODEL, \App\Models\PlatformSetting::MODEL_PER_VEHICLE_TRIAL);
        \App\Models\PlatformSetting::setValue(\App\Models\PlatformSetting::KEY_VEHICLE_TRIAL_DURATION_DAYS, 30);

        $initialCredits = $this->tenant->unit_capacity_credits;

        $response = $this->actingAs($this->user)->post(route('module.fleet.vehicles.store'), [
            'name' => 'Toyota Avanza 1.5 G',
            'plate_number' => 'B 1234 TR',
            'type' => 'car',
            'fuel_type' => 'petrol',
            'status' => Vehicle::STATUS_ACTIVE,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $vehicle = Vehicle::where('plate_number', 'B 1234 TR')->first();
        $this->assertNotNull($vehicle);
        $this->assertSame(Vehicle::STATUS_ACTIVE, $vehicle->status);
        $this->assertTrue($vehicle->is_trial);
        $this->assertNotNull($vehicle->active_until);
        $this->assertNotNull($vehicle->trial_ends_at);

        // Tenant credits should remain untouched
        $this->tenant->refresh();
        $this->assertSame($initialCredits, $this->tenant->unit_capacity_credits);
    }

    public function test_renewal_converts_trial_vehicle_to_paid_and_consumes_credit(): void
    {
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'is_trial' => true,
            'trial_ends_at' => Carbon::now()->addDays(5),
            'active_until' => Carbon::now()->addDays(5),
        ]);

        $service = app(VehicleCapacityService::class);
        $result = $service->renew($vehicle);

        $this->assertTrue($result['success']);
        $vehicle->refresh();

        $this->assertSame(Vehicle::STATUS_ACTIVE, $vehicle->status);
        $this->assertFalse($vehicle->is_trial);
        $this->assertSame(2, $result['new_balance']);
    }

    public function test_anti_abuse_prevents_duplicate_plate_from_getting_second_trial(): void
    {
        \App\Models\PlatformSetting::setValue(\App\Models\PlatformSetting::KEY_CAPACITY_BUSINESS_MODEL, \App\Models\PlatformSetting::MODEL_PER_VEHICLE_TRIAL);
        \App\Models\PlatformSetting::setValue(\App\Models\PlatformSetting::KEY_PREVENT_DUPLICATE_PLATE_TRIAL, '1');

        $service = app(VehicleCapacityService::class);
        $this->assertTrue($service->canClaimTrial('B 9999 XYZ'));

        $service->recordTrialFingerprint('B 9999 XYZ');

        $this->assertFalse($service->canClaimTrial('b-9999-xyz'));
        $this->assertFalse($service->canClaimTrial('B9999XYZ'));
    }
}
