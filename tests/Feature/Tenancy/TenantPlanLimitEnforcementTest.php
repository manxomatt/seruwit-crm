<?php

namespace Tests\Feature\Tenancy;

use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\FleetBase;
use Modules\Fleet\Models\Vehicle;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TenantPlanLimitEnforcementTest extends TestCase
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
            'name' => 'Limit Test Tenant',
            'data' => [
                'plan' => $planKey,
            ],
        ]);
    }

    public function test_tenant_cannot_create_bases_exceeding_plan_limit(): void
    {
        $tenant = $this->createTenantOnPlan('free'); // free has max_branches = 1
        $admin = $this->createAdminUser();

        tenancy()->initialize($tenant);

        // First base should succeed
        FleetBase::factory()->create([
            'manager_id' => $admin->id,
            'code' => 'BASE-01',
            'name' => 'First Base',
        ]);

        $this->assertSame(1, FleetBase::count());

        // Attempting to create a second base must fail validation
        $response = $this->actingAs($admin)->post(route('module.fleet.bases.store'), [
            'code' => 'BASE-02',
            'name' => 'Second Base',
            'kind' => 'depot',
            'status' => 'active',
            'manager_id' => $admin->id,
            'timezone' => 'Asia/Jakarta',
            'allows_overnight' => true,
        ]);

        $response->assertSessionHasErrors('name');
        $this->assertSame(1, FleetBase::count());

        // Create page should redirect back with error when limit reached
        $createResponse = $this->actingAs($admin)->get(route('module.fleet.bases.create'));
        $createResponse->assertRedirect(route('module.fleet.bases.index'));
        $createResponse->assertSessionHas('error');

        tenancy()->end();
    }

    public function test_tenant_cannot_create_vehicles_exceeding_plan_limit(): void
    {
        $tenant = $this->createTenantOnPlan('free'); // free has max_vehicles = 2
        $admin = $this->createAdminUser();

        tenancy()->initialize($tenant);

        // Create 2 vehicles (allowed)
        Vehicle::factory()->count(2)->create();
        $this->assertSame(2, Vehicle::count());

        // Attempting to create a 3rd vehicle must fail validation
        $response = $this->actingAs($admin)->post(route('module.fleet.vehicles.store'), [
            'name' => 'Third Vehicle',
            'plate_number' => 'B 1234 XYZ',
            'type' => 'car',
            'fuel_type' => 'petrol',
            'status' => 'active',
        ]);

        $response->assertSessionHasErrors('name');
        $this->assertSame(2, Vehicle::count());

        // Create page should redirect back with error when limit reached
        $createResponse = $this->actingAs($admin)->get(route('module.fleet.vehicles.create'));
        $createResponse->assertRedirect(route('module.fleet.vehicles.index'));
        $createResponse->assertSessionHas('error');

        tenancy()->end();
    }

    public function test_tenant_cannot_create_or_invite_users_exceeding_plan_limit(): void
    {
        $tenant = $this->createTenantOnPlan('free'); // free has max_users = 1
        $admin = $this->createAdminUser();

        tenancy()->initialize($tenant);

        // 1 user already exists ($admin)
        $this->assertSame(1, User::count());

        // Attempting to create a second user must fail validation
        $response = $this->actingAs($admin)->post(route('module.users.store'), [
            'name' => 'Second User',
            'email' => 'second@example.com',
            'password' => 'password123!',
            'password_confirmation' => 'password123!',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertSame(1, User::count());

        // Attempting to invite a second user must also fail
        $inviteResponse = $this->actingAs($admin)->post(route('module.user-invitations.store'), [
            'email' => 'invite@example.com',
            'role_slug' => 'user',
        ]);

        $inviteResponse->assertSessionHasErrors('email');

        // Create page should redirect back with error when limit reached
        $createResponse = $this->actingAs($admin)->get(route('module.users.create'));
        $createResponse->assertRedirect(route('module.users.index'));
        $createResponse->assertSessionHas('error');

        tenancy()->end();
    }

    public function test_tenant_with_higher_plan_can_create_within_limits(): void
    {
        $tenant = $this->createTenantOnPlan('pro'); // pro has max_branches = 3, max_vehicles = 20, max_users = 5
        $admin = $this->createAdminUser();

        tenancy()->initialize($tenant);

        // Create 2 bases (under pro limit of 3)
        $response1 = $this->actingAs($admin)->post(route('module.fleet.bases.store'), [
            'code' => 'BASE-01',
            'name' => 'First Base',
            'kind' => 'depot',
            'status' => 'active',
            'manager_id' => $admin->id,
            'timezone' => 'Asia/Jakarta',
            'allows_overnight' => true,
        ]);
        $response1->assertSessionHasNoErrors();

        $response2 = $this->actingAs($admin)->post(route('module.fleet.bases.store'), [
            'code' => 'BASE-02',
            'name' => 'Second Base',
            'kind' => 'yard',
            'status' => 'active',
            'manager_id' => $admin->id,
            'timezone' => 'Asia/Jakarta',
            'allows_overnight' => true,
        ]);
        $response2->assertSessionHasNoErrors();

        $this->assertSame(2, FleetBase::count());

        tenancy()->end();
    }
}
