<?php

namespace Tests\Feature\Modules;

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * An inactive plan stays visible in the plan manager but disappears from every
 * tenant-facing surface and cannot back a new transaction.
 */
class InactivePlanTest extends TestCase
{
    use WithTenant;

    protected function setUpWithTenant(): void
    {
        parent::setUpWithTenant();

        $this->withoutVite();
    }

    private function tenantUser(Tenant $tenant, string $email): User
    {
        $user = $tenant->run(fn (): ?User => User::query()->firstWhere('email', $email));

        tenancy()->end();

        return $user;
    }

    private function domainOf(Tenant $tenant): string
    {
        return $tenant->run(fn (): string => 'http://'.$tenant->domains->first()->domain);
    }

    public function test_an_inactive_plan_is_hidden_from_the_tenant_subscription_page(): void
    {
        $tenant = $this->provisionTenant('Hidden Plan Co', 'hidden-plan-co', 'owner@hidden.test');
        Plan::query()->firstWhere('key', 'pro')->update(['is_active' => false]);

        $owner = $this->tenantUser($tenant, 'owner@hidden.test');

        $this->actingAs($owner)
            ->get($this->domainOf($tenant).'/module/subscription')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Subscription/Activate')
                ->where('plans', fn ($plans) => collect($plans)->every(
                    fn ($plan): bool => $plan['key'] !== 'pro',
                ))
            );
    }

    public function test_an_inactive_plan_cannot_back_a_new_payment_order(): void
    {
        $tenant = $this->provisionTenant('Blocked Plan Co', 'blocked-plan-co', 'owner@blocked.test');

        $plan = Plan::query()->firstWhere('key', 'pro');
        $plan->update(['is_active' => false]);

        $owner = $this->tenantUser($tenant, 'owner@blocked.test');

        $this->actingAs($owner)
            ->post($this->domainOf($tenant).'/module/subscription/order', [
                'plan_id' => $plan->id,
                'type' => 'activate',
            ])
            ->assertSessionHasErrors('plan_id');

        $this->assertDatabaseCount('payment_orders', 0);
    }
}
