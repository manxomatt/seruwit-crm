<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\SubscriptionService;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SubscriptionTest extends TestCase
{
    use DatabaseMigrations;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    private function createTenantRecord(array $attributes): Tenant
    {
        $id = $attributes['id'] ?? (string) \Illuminate\Support\Str::random(16);
        $plan = $attributes['plan'] ?? null;
        unset($attributes['plan']);

        $data = $plan ? json_encode(['plan' => $plan]) : null;

        DB::table('tenants')->insert(array_merge([
            'id' => $id,
            'name' => 'Test Tenant',
            'status' => 'active',
            'data' => $data,
            'trial_ends_at' => null,
            'is_trial_expired' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ], $attributes));

        return Tenant::query()->findOrFail($id);
    }

    public function test_provision_job_sets_trial_ends_at(): void
    {
        $user = \App\Models\User::factory()->create(['email' => 'trial@test.test']);
        $user->forceFill(['email_verified_at' => now()])->save();

        $session = \App\Models\OnboardingSession::query()->create([
            'global_user_id' => $user->global_id,
            'company_name' => 'Trial Test',
            'subdomain' => 'trial-test',
            'verticals' => ['rental'],
            'status' => \App\Models\OnboardingSession::STATUS_PENDING,
        ]);

        (new \App\Jobs\ProvisionSelfServeTenantJob($session->id))->handle(
            app(\App\Actions\Tenancy\CreateTenantAction::class),
            app(\App\Modules\ModuleInstaller::class),
        );

        $session->refresh();
        $tenant = Tenant::query()->findOrFail($session->tenant_id);

        $this->assertNotNull($tenant->trial_ends_at);
        $this->assertTrue($tenant->trial_ends_at->isFuture());
        $this->assertTrue($tenant->isOnTrial);
        $this->assertFalse($tenant->is_trial_expired);
        $this->assertSame('active', $tenant->status);
    }

    public function test_expire_trials_suspends_expired_tenants(): void
    {
        $tenant = $this->createTenantRecord([
            'id' => 'expire-test',
            'name' => 'Expire Test',
            'trial_ends_at' => now()->subDay(),
        ]);

        $service = new SubscriptionService;
        $count = $service->expireTrials();

        $this->assertSame(1, $count);

        $tenant->refresh();
        $this->assertSame('active', $tenant->status);
        $this->assertTrue($tenant->is_trial_expired);
        $this->assertFalse($tenant->isOnTrial);
    }

    public function test_expire_trials_skips_already_expired_tenants(): void
    {
        $tenant = $this->createTenantRecord([
            'id' => 'already-expired',
            'name' => 'Already Expired',
            'status' => 'active',
            'trial_ends_at' => now()->subDays(2),
            'is_trial_expired' => true,
        ]);

        $service = new SubscriptionService;
        $count = $service->expireTrials();

        $this->assertSame(0, $count);
    }

    public function test_activate_creates_subscription_and_updates_tenant(): void
    {
        $tenant = $this->createTenantRecord([
            'id' => 'activate-test',
            'name' => 'Activate Test',
            'trial_ends_at' => now()->addDay(),
            'plan' => Plan::KEY_TRIAL,
        ]);

        $plan = Plan::query()->where('key', 'basic')->firstOrFail();

        $service = new SubscriptionService;
        $subscription = $service->activate($tenant, $plan);

        $this->assertNotNull($subscription->id);
        $this->assertSame($tenant->id, $subscription->tenant_id);
        $this->assertSame($plan->id, $subscription->plan_id);
        $this->assertSame(Subscription::STATUS_ACTIVE, $subscription->status);
        $this->assertTrue($subscription->isActive());

        $tenant->refresh();
        $this->assertSame('basic', $tenant->plan);
        $this->assertNull($tenant->trial_ends_at);
        $this->assertFalse($tenant->is_trial_expired);
        $this->assertSame('active', $tenant->status);
    }

    public function test_subscription_cancel_suspends_tenant(): void
    {
        $plan = Plan::query()->where('key', 'basic')->firstOrFail();

        $tenant = $this->createTenantRecord([
            'id' => 'cancel-test',
            'name' => 'Cancel Test',
            'plan' => 'basic',
        ]);

        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'starts_at' => now()->subDays(10),
            'ends_at' => now()->addDays(20),
            'status' => Subscription::STATUS_ACTIVE,
        ]);

        $service = new SubscriptionService;
        $service->cancel($tenant);

        $subscription->refresh();
        $this->assertSame(Subscription::STATUS_CANCELLED, $subscription->status);
        $this->assertNotNull($subscription->cancelled_at);

        $tenant->refresh();
        $this->assertSame('suspended', $tenant->status);
        $this->assertTrue($tenant->is_trial_expired);
    }

    public function test_expire_trials_command_runs(): void
    {
        $this->createTenantRecord([
            'id' => 'cmd-test',
            'name' => 'Cmd Test',
            'trial_ends_at' => now()->subDays(2),
        ]);

        $this->artisan('subscription:expire-trials')
            ->expectsOutput('Expired 1 trials.')
            ->assertExitCode(0);

        $tenant = Tenant::query()->findOrFail('cmd-test');
        $this->assertSame('active', $tenant->status);
        $this->assertTrue($tenant->is_trial_expired);
    }

    public function test_price_tiering_calculation(): void
    {
        // Tier 1 (1 - 10): 20,000 per unit
        $this->assertEquals(160000, \App\Models\SubscriptionTier::calculatePrice(8, 'month'));
        // Tier 2 (11 - 50): 15,000 per unit
        $this->assertEquals(375000, \App\Models\SubscriptionTier::calculatePrice(25, 'month'));
        // Tier 3 (51+): 10,000 per unit
        $this->assertEquals(600000, \App\Models\SubscriptionTier::calculatePrice(60, 'month'));

        // Annual pricing should have a 10x multiplier (2 months free discount)
        $this->assertEquals(1600000, \App\Models\SubscriptionTier::calculatePrice(8, 'annual'));
    }

    public function test_tenant_limit_uses_subscribed_vehicles(): void
    {
        $tenant = $this->createTenantRecord([
            'id' => 'limit-test-tenant',
            'name' => 'Limit Test Tenant',
            'plan' => 'pay_as_you_go',
        ]);

        $plan = Plan::query()->where('key', 'pay_as_you_go')->firstOrFail();

        // 1. Without active subscription, limit should be 0 (since trial expired is true by fallback)
        $this->assertEquals(0, $tenant->planLimit('max_vehicles'));

        // 2. Activate subscription with 15 vehicles
        Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'subscribed_vehicles' => 15,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'status' => Subscription::STATUS_ACTIVE,
        ]);

        $tenant->refresh();
        $this->assertEquals(15, $tenant->planLimit('max_vehicles'));
    }

    public function test_create_order_calculates_pay_as_you_go_amount(): void
    {
        $tenant = $this->createTenantRecord([
            'id' => 'order-calc-tenant',
            'name' => 'Order Calc Tenant',
            'plan' => Plan::KEY_TRIAL,
        ]);

        $plan = Plan::query()->where('key', 'pay_as_you_go')->firstOrFail();

        $service = new \App\Services\PaymentOrderService;
        $order = $service->createOrder($tenant, $plan, 'activate', 'month', 12);

        $this->assertEquals(12, $order->subscribed_vehicles);
        // 12 * 15,000 = 180,000
        $this->assertEquals(180000, (float) $order->amount);
        $this->assertEquals(180000 + $order->unique_code, (float) $order->total_amount);
    }

    public function test_expired_trial_tenant_stays_accessible_but_vehicle_creation_blocked(): void
    {
        $tenant = $this->createTenantRecord([
            'id' => 'expired-trial-tenant',
            'name' => 'Expired Trial Tenant',
            'plan' => Plan::KEY_TRIAL,
            'trial_ends_at' => now()->subDay(),
            'is_trial_expired' => true,
            'status' => 'active',
        ]);

        $this->assertFalse($tenant->isOnTrial);
        $this->assertSame('active', $tenant->status);

        // Limit for vehicles must be 0
        $this->assertEquals(0, $tenant->planLimit('max_vehicles'));
        $this->assertTrue($tenant->hasReachedLimit('max_vehicles', 0));
        $this->assertTrue($tenant->hasReachedLimit('max_vehicles', 1));

        // SubscriptionService canAddVehicle must be false
        $service = new SubscriptionService;
        $this->assertFalse($service->canAddVehicle($tenant, 0));
        $this->assertSame(0, $service->getMaxVehiclesAllowed($tenant));
    }
}
