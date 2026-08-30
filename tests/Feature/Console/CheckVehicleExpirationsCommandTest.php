<?php

namespace Tests\Feature\Console;

use App\Models\Tenant;
use App\Models\TenantCapacityTransaction;
use Carbon\Carbon;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Tests\TestCase;

class CheckVehicleExpirationsCommandTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $this->seed(PlanSeeder::class);

        $this->tenant = Tenant::withoutEvents(function (): Tenant {
            return Tenant::create([
                'id' => fake()->uuid(),
                'name' => 'Fast Cargo',
                'status' => 'active',
                'plan' => 'starter',
                'unit_capacity_credits' => 1,
                'provision' => ['owner_global_id' => fake()->uuid()],
            ]);
        });
        $this->tenant->domains()->create(['domain' => 'fastcargo.seruwit.test']);
    }

    public function test_command_auto_renews_expiring_vehicle_if_credits_available(): void
    {
        // Vehicle expiring today with auto_renew enabled
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'active_until' => Carbon::now()->subMinute(),
            'auto_renew' => true,
        ]);

        app()->instance('tenant', $this->tenant);

        $this->artisan('fleet:check-expirations', ['--tenant' => $this->tenant->id])
            ->assertExitCode(0);

        $vehicle->refresh();
        $this->assertSame(Vehicle::STATUS_ACTIVE, $vehicle->status);
        $this->assertTrue($vehicle->active_until->isFuture());

        $this->tenant->refresh();
        $this->assertSame(0, $this->tenant->unit_capacity_credits);

        $this->assertDatabaseHas('tenant_capacity_transactions', [
            'tenant_id' => $this->tenant->id,
            'amount' => -1,
            'balance_after' => 0,
            'type' => TenantCapacityTransaction::TYPE_RENEWAL,
        ]);
    }

    public function test_command_deactivates_vehicle_past_grace_period_when_no_credits(): void
    {
        $this->tenant->update(['unit_capacity_credits' => 0]);

        // Vehicle expired 10 days ago (past default 3 days grace period)
        $vehicle = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_ACTIVE,
            'active_until' => Carbon::now()->subDays(10),
            'auto_renew' => true,
        ]);

        app()->instance('tenant', $this->tenant);

        $this->artisan('fleet:check-expirations', ['--tenant' => $this->tenant->id])
            ->assertExitCode(0);

        $vehicle->refresh();
        $this->assertSame(Vehicle::STATUS_INACTIVE, $vehicle->status);
    }
}
