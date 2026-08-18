<?php

namespace Tests\Feature\Tenancy;

use App\Models\Plan;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RoleSeeder;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * Super admins pick the subscription plan while creating a tenant, so the
 * workspace is entitled to the right modules from its first provisioning run.
 */
class TenantPlanSelectionTest extends TestCase
{
    use WithTenant;

    protected function setUpWithTenant(): void
    {
        $this->seed(PlanSeeder::class);
        $this->seed(RoleSeeder::class);
    }

    private function makeSuperAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::query()->where('slug', 'admin')->firstOrFail());

        return $user;
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'company_name' => 'Plan Client',
            'subdomain' => 'planclient',
            'owner_name' => 'Owner',
            'owner_email' => 'owner@planclient.test',
            'owner_password' => 'password123!',
        ], $overrides);
    }

    public function test_create_page_shares_the_plan_catalogue(): void
    {
        $admin = $this->makeSuperAdmin();

        $this->actingAs($admin)->get(route('module.tenants.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/Tenants/Create')
                ->has('plans')
                ->where('defaultPlan', Plan::query()->where('is_default', true)->value('key'))
            );
    }

    public function test_tenant_is_created_on_the_selected_plan(): void
    {
        $admin = $this->makeSuperAdmin();

        $this->actingAs($admin)->post(route('module.tenants.store'), $this->payload([
            'plan' => 'pro',
        ]))->assertRedirect();

        $tenant = Tenant::query()->where('name', 'Plan Client')->firstOrFail();

        $this->assertSame('pro', $tenant->plan);
        $this->assertSame('pro', data_get($tenant->provision, 'plan_key'));
    }

    public function test_tenant_falls_back_to_the_default_plan_when_none_is_chosen(): void
    {
        $admin = $this->makeSuperAdmin();
        $defaultKey = Plan::query()->where('is_default', true)->value('key');

        $this->actingAs($admin)->post(route('module.tenants.store'), $this->payload())
            ->assertRedirect();

        $tenant = Tenant::query()->where('name', 'Plan Client')->firstOrFail();

        $this->assertSame($defaultKey, $tenant->plan);
    }

    public function test_unknown_plan_key_is_rejected(): void
    {
        $admin = $this->makeSuperAdmin();

        $this->actingAs($admin)->post(route('module.tenants.store'), $this->payload([
            'plan' => 'does-not-exist',
        ]))->assertSessionHasErrors('plan');

        $this->assertFalse(Tenant::query()->where('name', 'Plan Client')->exists());
    }
}
