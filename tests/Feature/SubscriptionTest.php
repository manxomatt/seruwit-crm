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
        $this->assertSame('suspended', $tenant->status);
        $this->assertTrue($tenant->is_trial_expired);
    }

    public function test_expire_trials_skips_already_expired_tenants(): void
    {
        $this->createTenantRecord([
            'id' => 'already-expired',
            'name' => 'Already Expired',
            'status' => 'suspended',
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
        $this->assertSame('suspended', $tenant->status);
    }
}
