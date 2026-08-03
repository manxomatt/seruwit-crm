<?php

namespace Tests\Feature\Auth;

use App\Jobs\ProvisionSelfServeTenantJob;
use App\Models\OnboardingSession;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Str;
use Tests\TestCase;

class SelfServeOnboardingRetryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_failed_onboarding_retry_reuses_tenant_for_same_subdomain(): void
    {
        Bus::fake();

        $user = User::factory()->create();
        $tenantId = (string) Str::uuid();

        OnboardingSession::query()->create([
            'global_user_id' => $user->global_id,
            'company_name' => 'Retry Co',
            'subdomain' => 'retry-co',
            'verticals' => ['rental'],
            'status' => OnboardingSession::STATUS_FAILED,
            'tenant_id' => $tenantId,
            'error_message' => 'Plan [trial] does not include module [receivables].',
        ]);

        $this->actingAs($user)
            ->post(route('central.onboarding.store'), [
                'company_name' => 'Retry Co',
                'subdomain' => 'retry-co',
                'verticals' => ['rental', 'travel'],
            ])
            ->assertRedirect(route('central.onboarding.status', absolute: false));

        $session = OnboardingSession::query()
            ->where('global_user_id', $user->global_id)
            ->firstOrFail();

        $this->assertSame(OnboardingSession::STATUS_PENDING, $session->status);
        $this->assertSame($tenantId, $session->tenant_id);
        $this->assertSame(['rental', 'travel'], $session->verticals);
        $this->assertNull($session->error_message);

        Bus::assertDispatched(
            ProvisionSelfServeTenantJob::class,
            fn (ProvisionSelfServeTenantJob $job): bool => $job->onboardingSessionId === $session->id,
        );
    }

    public function test_failed_onboarding_retry_clears_tenant_when_subdomain_changes(): void
    {
        Bus::fake();

        $user = User::factory()->create();

        OnboardingSession::query()->create([
            'global_user_id' => $user->global_id,
            'company_name' => 'Old Co',
            'subdomain' => 'old-co',
            'verticals' => ['rental'],
            'status' => OnboardingSession::STATUS_FAILED,
            'tenant_id' => (string) Str::uuid(),
            'error_message' => 'Previous failure',
        ]);

        $this->actingAs($user)
            ->post(route('central.onboarding.store'), [
                'company_name' => 'New Co',
                'subdomain' => 'new-co',
                'verticals' => ['travel'],
            ])
            ->assertRedirect(route('central.onboarding.status', absolute: false));

        $session = OnboardingSession::query()
            ->where('global_user_id', $user->global_id)
            ->firstOrFail();

        $this->assertNull($session->tenant_id);
        $this->assertSame('new-co', $session->subdomain);
    }

    public function test_plan_seeder_refreshes_stale_trial_modules(): void
    {
        Plan::query()->create([
            'key' => Plan::KEY_TRIAL,
            'name' => 'Trial',
            'description' => 'Stale',
            'modules' => ['pages', 'posts', 'products'],
            'sort_order' => 0,
            'is_default' => false,
        ]);

        $this->seed(\Database\Seeders\PlanSeeder::class);

        $trial = Plan::query()->firstWhere('key', Plan::KEY_TRIAL);

        $this->assertNotNull($trial);
        $this->assertSame(Plan::trialModuleKeys(), $trial->modules);
        $this->assertContains('receivables', $trial->modules);
        $this->assertNotContains('products', $trial->modules);
    }
}
