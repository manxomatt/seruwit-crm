<?php

namespace Tests\Feature\Auth;

use App\Jobs\ProvisionSelfServeTenantJob;
use App\Models\CentralUser;
use App\Models\InstalledModule;
use App\Models\OnboardingSession;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Tests\Traits\WithTenant;

class SelfServeOnboardingJobTest extends TestCase
{
    use WithTenant;

    public function test_provision_job_creates_tenant_with_trial_plan_and_selected_modules(): void
    {
        $this->seed(PlanSeeder::class);

        $user = User::factory()->create([
            'email' => 'owner@selfserve.test',
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();

        $session = OnboardingSession::query()->create([
            'global_user_id' => $user->global_id,
            'company_name' => 'Self Serve Travel',
            'subdomain' => 'self-serve-travel',
            'verticals' => ['travel'],
            'status' => OnboardingSession::STATUS_PENDING,
        ]);

        (new ProvisionSelfServeTenantJob($session->id))->handle(
            app(\App\Actions\Tenancy\CreateTenantAction::class),
            app(\App\Modules\ModuleInstaller::class),
        );

        $session->refresh();
        $this->assertSame(
            OnboardingSession::STATUS_READY,
            $session->status,
            (string) $session->error_message,
        );
        $this->assertNotNull($session->tenant_id);

        $tenant = Tenant::query()->findOrFail($session->tenant_id);
        $this->assertSame(Plan::KEY_TRIAL, $tenant->planKey());
        $this->assertSame('self-serve-travel.localhost', $tenant->domains()->first()?->domain);

        $attached = CentralUser::query()
            ->where('global_id', $user->global_id)
            ->first()
            ?->tenants()
            ->whereKey($tenant->id)
            ->exists();
        $this->assertTrue($attached);

        $tenant->run(function (): void {
            $this->assertTrue(Schema::hasTable('pages'));
            $this->assertTrue(Schema::hasTable('shuttle_corridors'));
            $this->assertTrue(Schema::hasTable('accounts'));
            $this->assertTrue(InstalledModule::query()->where('key', 'pages')->installed()->exists());
            $this->assertTrue(InstalledModule::query()->where('key', 'shuttle')->installed()->exists());
            $this->assertFalse(InstalledModule::query()->where('key', 'accounting')->exists());
            $this->assertFalse(InstalledModule::query()->where('key', 'partners')->exists());
        });
    }
}
