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
use App\Services\PaymentOrderService;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TenantOnboardingPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(PlanSeeder::class);
    }

    public function test_onboarding_store_paid_plan_with_zero_trial_days_redirects_to_payment_without_creating_tenant(): void
    {
        $proPlan = Plan::query()->where('key', 'pro')->first();
        if ($proPlan) {
            $proPlan->update(['trial_days' => 0, 'is_trial' => false, 'price' => 299000]);
        }

        $user = User::factory()->create(['email' => 'pro-user@test.test']);
        $user->forceFill(['email_verified_at' => now()])->save();

        $response = $this->actingAs($user)->post(route('central.onboarding.store'), [
            'company_name' => 'Pro Rental Jakarta',
            'subdomain' => 'pro-jakarta',
            'phone' => '081234567890',
            'city' => 'Jakarta',
            'fleet_size' => '21-50+',
            'rental_model' => 'both',
            'verticals' => ['rental'],
            'plan_key' => 'pro',
        ]);

        $response->assertRedirect(route('central.onboarding.payment'));

        // Tenant MUST NOT be created yet!
        $this->assertSame(0, Tenant::query()->count());

        $session = OnboardingSession::query()->where('global_user_id', $user->global_id)->first();
        $this->assertNotNull($session);
        $this->assertSame(OnboardingSession::STATUS_AWAITING_PAYMENT, $session->status);
        $this->assertNull($session->tenant_id);

        $order = PaymentOrder::query()->where('onboarding_session_id', $session->id)->first();
        $this->assertNotNull($order);
        $this->assertSame(PaymentOrder::STATUS_PENDING, $order->status);
        $this->assertSame('pro', $order->plan->key);
        $this->assertEquals(299000, (float) $order->amount);
    }

    public function test_user_can_submit_payment_proof_and_admin_confirmation_provisions_tenant(): void
    {
        Storage::fake('payment_proofs');

        $proPlan = Plan::query()->where('key', 'pro')->first();
        if ($proPlan) {
            $proPlan->update(['trial_days' => 0, 'is_trial' => false, 'price' => 299000]);
        }

        $user = User::factory()->create(['email' => 'pro-submit@test.test']);
        $user->forceFill(['email_verified_at' => now()])->save();

        $session = OnboardingSession::query()->create([
            'global_user_id' => $user->global_id,
            'company_name' => 'Pro Rental Submit',
            'subdomain' => 'pro-submit',
            'plan_key' => 'pro',
            'verticals' => ['rental'],
            'status' => OnboardingSession::STATUS_AWAITING_PAYMENT,
        ]);

        $order = app(PaymentOrderService::class)->createOnboardingOrder($session, $proPlan, 'month');
        $this->assertSame(PaymentOrder::STATUS_PENDING, $order->status);

        // User submits payment proof
        $file = UploadedFile::fake()->image('transfer_receipt.jpg');
        $response = $this->actingAs($user)->post(route('central.onboarding.payment.submit'), [
            'transfer_proof' => $file,
            'transfer_note' => 'Transfer BCA a.n. Pro User',
        ]);

        $response->assertRedirect();
        $order->refresh();
        $this->assertSame(PaymentOrder::STATUS_AWAITING_CONFIRMATION, $order->status);
        $this->assertSame('Transfer BCA a.n. Pro User', $order->transfer_note);

        $session->refresh();
        $this->assertSame(OnboardingSession::STATUS_PAYMENT_SUBMITTED, $session->status);

        // Admin confirms order
        $admin = User::factory()->create(['email' => 'admin@seruwit.test']);
        $admin->forceFill(['email_verified_at' => now()])->save();

        app(PaymentOrderService::class)->confirm($order, $admin);

        $order->refresh();
        $this->assertSame(PaymentOrder::STATUS_CONFIRMED, $order->status);

        $session->refresh();
        $this->assertSame(OnboardingSession::STATUS_PENDING, $session->status);

        // Provisioning job runs
        (new ProvisionSelfServeTenantJob($session->id))->handle(
            app(CreateTenantAction::class),
            app(ModuleInstaller::class),
        );

        $session->refresh();
        $this->assertSame(OnboardingSession::STATUS_READY, $session->status);
        $this->assertNotNull($session->tenant_id);

        $tenant = Tenant::query()->findOrFail($session->tenant_id);
        $this->assertNull($tenant->trial_ends_at);
        $this->assertFalse($tenant->is_trial_expired);
        $this->assertFalse($tenant->isOnTrial);

        $order->refresh();
        $this->assertSame($tenant->id, $order->tenant_id);
        $this->assertNotNull($order->subscription_id);
    }

    public function test_workspace_list_does_not_show_trial_info_for_pro_and_free_tenants(): void
    {
        $user = User::factory()->create(['email' => 'workspace-owner@test.test']);
        $user->forceFill(['email_verified_at' => now()])->save();

        $tenant = Tenant::create([
            'id' => 'pro-tenant',
            'name' => 'Pro Tenant Workspace',
            'status' => 'active',
            'plan' => 'pro',
            'trial_ends_at' => null,
            'is_trial_expired' => false,
        ]);

        $tenant->domains()->create(['domain' => 'pro-tenant.localhost']);
        $tenant->users()->attach($user->global_id);

        $response = $this->actingAs($user)->get(route('central.workspaces.index'));
        $response->assertOk();

        $workspaces = $response->viewData('page')['props']['workspaces'];
        $this->assertCount(1, $workspaces);
        $this->assertFalse($workspaces[0]['is_on_trial']);
        $this->assertSame(0, $workspaces[0]['trial_days_left']);
    }
}

