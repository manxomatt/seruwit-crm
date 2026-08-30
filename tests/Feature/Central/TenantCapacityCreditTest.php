<?php

namespace Tests\Feature\Central;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantCapacityCreditTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $this->seed(PlanSeeder::class);
        Role::factory()->admin()->create();
        $this->admin = User::factory()->admin()->create();

        $this->tenant = Tenant::withoutEvents(function (): Tenant {
            return Tenant::create([
                'id' => fake()->uuid(),
                'name' => 'Acme Transport',
                'status' => 'active',
                'plan' => 'starter',
                'unit_capacity_credits' => 5,
                'provision' => ['owner_global_id' => fake()->uuid()],
            ]);
        });
        $this->tenant->domains()->create(['domain' => 'acme.seruwit.test']);
    }

    public function test_admin_can_add_capacity_credits_to_tenant(): void
    {
        $response = $this->actingAs($this->admin)->post(
            route('module.tenants.adjust-capacity-credits', $this->tenant->id),
            [
                'amount' => 10,
                'type' => 'bonus',
                'notes' => 'Bonus onboarding 10 unit',
            ]
        );

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->tenant->refresh();
        $this->assertSame(15, $this->tenant->unit_capacity_credits);

        $this->assertDatabaseHas('tenant_capacity_transactions', [
            'tenant_id' => $this->tenant->id,
            'amount' => 10,
            'balance_after' => 15,
            'type' => 'bonus',
            'description' => 'Bonus onboarding 10 unit',
        ]);

        $this->assertDatabaseHas('tenant_activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'capacity_adjusted',
        ]);
    }

    public function test_admin_can_deduct_capacity_credits_from_tenant(): void
    {
        $response = $this->actingAs($this->admin)->post(
            route('module.tenants.adjust-capacity-credits', $this->tenant->id),
            [
                'amount' => -2,
                'type' => 'correction',
                'notes' => 'Koreksi kelebihan kredit',
            ]
        );

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->tenant->refresh();
        $this->assertSame(3, $this->tenant->unit_capacity_credits);

        $this->assertDatabaseHas('tenant_capacity_transactions', [
            'tenant_id' => $this->tenant->id,
            'amount' => -2,
            'balance_after' => 3,
            'type' => 'correction',
        ]);
    }

    public function test_cannot_deduct_credits_below_zero(): void
    {
        $response = $this->actingAs($this->admin)->post(
            route('module.tenants.adjust-capacity-credits', $this->tenant->id),
            [
                'amount' => -10,
                'type' => 'correction',
                'notes' => 'Pengurangan melebihi saldo',
            ]
        );

        $response->assertRedirect();
        $response->assertSessionHas('error');

        $this->tenant->refresh();
        $this->assertSame(5, $this->tenant->unit_capacity_credits);

        $this->assertDatabaseMissing('tenant_capacity_transactions', [
            'amount' => -10,
        ]);
    }
}
