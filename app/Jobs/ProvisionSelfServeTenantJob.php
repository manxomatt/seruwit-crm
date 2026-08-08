<?php

namespace App\Jobs;

use App\Actions\Tenancy\CreateTenantAction;
use App\Models\CentralUser;
use App\Models\OnboardingSession;
use App\Models\Plan;
use App\Modules\Facades\Modules;
use App\Modules\ModuleInstaller;
use App\Support\Onboarding\SelfServeProvisioningPlan;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProvisionSelfServeTenantJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    /**
     * Tenant DDL + pack installs routinely exceed the default 60s worker timeout.
     */
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
            $tenant = $this->resolveTenant($session, $owner, $createTenant);

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

            $tenant->run(function () use ($session): void {
                $vertical = $session->verticals[0] ?? 'rental';
                app(\Database\Seeders\TenantDefaultPageSeeder::class)->run($vertical);
            });

            $session->update([
                'status' => OnboardingSession::STATUS_READY,
                'error_message' => null,
            ]);
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
     */
    private function resolveTenant(
        OnboardingSession $session,
        CentralUser $owner,
        CreateTenantAction $createTenant,
    ): \App\Models\Tenant {
        if ($session->tenant_id) {
            $tenant = $session->tenant;

            if ($tenant === null) {
                $session->update(['tenant_id' => null]);
            } elseif ($tenant->database()->manager()->databaseExists($tenant->database()->getName())) {
                if ($tenant->planKey() !== Plan::KEY_TRIAL) {
                    $tenant->update(['plan' => Plan::KEY_TRIAL]);
                }

                return $tenant;
            } else {
                // Domain row would block CreateTenantAction for the same subdomain.
                $tenant->delete();
                $session->update(['tenant_id' => null]);
            }
        }

        $tenant = $createTenant->execute(
            companyName: $session->company_name,
            subdomain: $session->subdomain,
            owner: $owner,
        );

        $tenant->update(['plan' => Plan::KEY_TRIAL]);
        $session->update(['tenant_id' => $tenant->getTenantKey()]);

        return $tenant;
    }
}
