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
        $this->assertNotNull($tenant->trial_ends_at);
        $this->assertTrue($tenant->trial_ends_at->isFuture());
        $this->assertTrue($tenant->isOnTrial);
        $this->assertStringEndsWith('.localhost', $tenant->domains()->first()?->domain ?? '');

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
            $this->assertTrue(InstalledModule::query()->where('key', 'fleet')->installed()->exists());
            $this->assertTrue(InstalledModule::query()->where('key', 'invoicing')->installed()->exists());
            $this->assertTrue(InstalledModule::query()->where('key', 'receivables')->installed()->exists());
            $this->assertFalse(InstalledModule::query()->where('key', 'rental')->installed()->exists());
            $this->assertFalse(InstalledModule::query()->where('key', 'accounting')->exists());
            $this->assertFalse(InstalledModule::query()->where('key', 'partners')->exists());
        });
    }

    public function test_provision_job_installs_rental_and_travel_packs_together(): void
    {
        $this->seed(PlanSeeder::class);

        $user = User::factory()->create([
            'email' => 'both@selfserve.test',
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();

        $session = OnboardingSession::query()->create([
            'global_user_id' => $user->global_id,
            'company_name' => 'Self Serve Both',
            'subdomain' => 'self-serve-both',
            'verticals' => ['rental', 'travel'],
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

        $tenant = Tenant::query()->findOrFail($session->tenant_id);

        $tenant->run(function (): void {
            foreach (['pages', 'posts', 'carousels', 'fleet', 'document', 'maintenance', 'tracking', 'invoicing', 'receivables', 'rental', 'shuttle'] as $key) {
                $this->assertTrue(
                    InstalledModule::query()->where('key', $key)->installed()->exists(),
                    "Expected module [{$key}] to be installed.",
                );
            }
        });
    }
}
