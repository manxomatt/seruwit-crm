<?php

namespace Tests\Feature\Tenancy;

use App\Actions\Tenancy\CreateTenantAction;
use App\Jobs\ProvisionSelfServeTenantJob;
use App\Models\OnboardingSession;
use App\Models\PaymentOrder;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use App\Modules\ModuleInstaller;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class TenantOnboardingPaymentTest extends TestCase
{
    use DatabaseMigrations;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    public function test_provisioning_paid_plan_with_zero_trial_days_creates_payment_order_and_sets_trial_expired(): void
    {
        $proPlan = Plan::query()->where('key', 'pro')->first();
        if ($proPlan) {
            $proPlan->update(['trial_days' => 0, 'is_trial' => false, 'price' => 299000]);
        }

        $user = User::factory()->create(['email' => 'pro-user@test.test']);
        $user->forceFill(['email_verified_at' => now()])->save();

        $session = OnboardingSession::query()->create([
            'global_user_id' => $user->global_id,
            'company_name' => 'Pro Rental',
            'subdomain' => 'pro-rental',
            'plan_key' => 'pro',
            'verticals' => ['rental'],
            'status' => OnboardingSession::STATUS_PENDING,
        ]);

        (new ProvisionSelfServeTenantJob($session->id))->handle(
            app(CreateTenantAction::class),
            app(ModuleInstaller::class),
        );

        $session->refresh();
        $this->assertSame(OnboardingSession::STATUS_READY, $session->status);
        $this->assertNotNull($session->tenant_id);

        $tenant = Tenant::query()->findOrFail($session->tenant_id);
        $this->assertNull($tenant->trial_ends_at);
        $this->assertTrue($tenant->is_trial_expired);

        $order = PaymentOrder::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', PaymentOrder::STATUS_PENDING)
            ->first();

        $this->assertNotNull($order);
        $this->assertSame('pro', $order->plan->key);
        $this->assertEquals(299000, (float) $order->amount);

        // Test workspace enter redirects to impersonate
        $response = $this->actingAs($user)->get(route('central.workspaces.enter', $tenant->id));
        $response->assertRedirect();
        $targetUrl = $response->headers->get('Location');
        $this->assertStringContainsString('/impersonate/', $targetUrl);
    }

    public function test_provisioning_plan_with_trial_sets_future_trial_deadline_without_payment_order(): void
    {
        $basicPlan = Plan::query()->where('key', 'basic')->first();
        if ($basicPlan) {
            $basicPlan->update(['trial_days' => 30, 'price' => 45000]);
        }

        $user = User::factory()->create(['email' => 'starter-user@test.test']);
        $user->forceFill(['email_verified_at' => now()])->save();

        $session = OnboardingSession::query()->create([
            'global_user_id' => $user->global_id,
            'company_name' => 'Starter Rental',
            'subdomain' => 'starter-rental',
            'plan_key' => 'basic',
            'verticals' => ['rental'],
            'status' => OnboardingSession::STATUS_PENDING,
        ]);

        (new ProvisionSelfServeTenantJob($session->id))->handle(
            app(CreateTenantAction::class),
            app(ModuleInstaller::class),
        );

        $session->refresh();
        $this->assertSame(OnboardingSession::STATUS_READY, $session->status);

        $tenant = Tenant::query()->findOrFail($session->tenant_id);
        $this->assertNotNull($tenant->trial_ends_at);
        $this->assertTrue($tenant->trial_ends_at->isFuture());
        $this->assertFalse($tenant->is_trial_expired);

        $order = PaymentOrder::query()
            ->where('tenant_id', $tenant->id)
            ->first();

        $this->assertNull($order);
    }
}
