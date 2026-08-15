<?php

namespace App\Jobs;

use App\Actions\Tenancy\CreateTenantAction;
use App\Models\CentralUser;
use App\Models\OnboardingSession;
use App\Models\Plan;
use App\Models\Tenant;
use App\Modules\Facades\Modules;
use App\Modules\ModuleInstaller;
use App\Support\Onboarding\SelfServeProvisioningPlan;
use Database\Seeders\CreateBintangKejoraAlternativePagesSeeder;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProvisionSelfServeTenantJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    public function __construct(public int $onboardingSessionId) {}

    public function handle(CreateTenantAction $createTenant, ModuleInstaller $installer): void
    {
        $session = OnboardingSession::query()->find($this->onboardingSessionId);

        if ($session === null || $session->status === OnboardingSession::STATUS_READY) {
            return;
        }

        $session->update([
            'status' => OnboardingSession::STATUS_PROVISIONING,
            'error_message' => null,
        ]);

        $owner = CentralUser::query()
            ->where('global_id', $session->global_user_id)
            ->firstOrFail();

        try {
            [$tenant, $isExisting] = $this->resolveTenant($session, $owner, $createTenant);

            if ($isExisting) {
                // Schema already present: install modules and packs inline, then mark ready.
                $this->installModulesAndPacks($tenant, $session, $installer);

                $session->update([
                    'status' => OnboardingSession::STATUS_READY,
                    'error_message' => null,
                ]);
            }
            // For new tenants, FinalizeTenantSetupJob is queued in the pipeline and
            // will mark the session READY (or FAILED) once it completes.
        } catch (Throwable $e) {
            Log::error('Self-serve tenant provisioning failed.', [
                'onboarding_session_id' => $session->id,
                'exception' => $e->getMessage(),
            ]);

            $session->update([
                'status' => OnboardingSession::STATUS_FAILED,
                'error_message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Reuse a half-provisioned tenant when its database still exists; otherwise
     * discard the orphan row and create a fresh workspace for the same subdomain.
     *
     * @return array{0: Tenant, 1: bool} Tenant + whether the schema already existed.
     */
    private function resolveTenant(
        OnboardingSession $session,
        CentralUser $owner,
        CreateTenantAction $createTenant,
    ): array {
        if ($session->tenant_id) {
            $tenant = $session->tenant;

            if ($tenant === null) {
                $session->update(['tenant_id' => null]);
            } elseif ($tenant->database()->manager()->databaseExists($tenant->database()->getName())) {
                $tenant->update([
                    'plan' => Plan::KEY_TRIAL,
                    'trial_ends_at' => now()->addDays(7),
                    'is_trial_expired' => false,
                    'status' => 'active',
                ]);

                return [$tenant, true];
            } else {
                // Domain row would block CreateTenantAction for the same subdomain.
                $tenant->delete();
                $session->update(['tenant_id' => null]);
            }
        }

        $vertical = $session->verticals[0] ?? 'rental';

        $tenant = $createTenant->execute(
            companyName: $session->company_name,
            subdomain: $session->subdomain,
            owner: $owner,
            setup: [
                'session_id' => $session->id,
                'vertical' => $vertical,
                'module_keys' => SelfServeProvisioningPlan::defaultContentModules(),
                'pack_keys' => SelfServeProvisioningPlan::packKeysForVerticals($session->verticals ?? []),
            ],
        );

        $tenant->update([
            'plan' => Plan::KEY_TRIAL,
            'trial_ends_at' => now()->addDays(7),
            'is_trial_expired' => false,
            'status' => 'active',
        ]);

        $session->update(['tenant_id' => $tenant->getTenantKey()]);

        return [$tenant, false];
    }

    private function installModulesAndPacks(Tenant $tenant, OnboardingSession $session, ModuleInstaller $installer): void
    {
        foreach (SelfServeProvisioningPlan::defaultContentModules() as $moduleKey) {
            $module = Modules::find($moduleKey);
            if ($module === null) {
                continue;
            }
            $installer->install($tenant, $module);
        }

        foreach (SelfServeProvisioningPlan::packKeysForVerticals($session->verticals ?? []) as $packKey) {
            $installer->installPack($tenant, $packKey, withDemoSeeders: false);
        }

        $vertical = $session->verticals[0] ?? 'rental';
        $tenant->run(function () use ($vertical): void {
            app(\Database\Seeders\TenantDefaultPageSeeder::class)->run($vertical);
            app(CreateBintangKejoraAlternativePagesSeeder::class)->run();
        });
    }
}
