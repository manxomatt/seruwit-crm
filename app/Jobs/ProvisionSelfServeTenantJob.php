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
        $planKey = $session->plan_key ?? Plan::KEY_TRIAL;
        $plan = Plan::query()->firstWhere('key', $planKey);
        $trialDays = $plan?->trial_days;
        $isTrialPlan = (bool) ($plan?->is_trial || $planKey === Plan::KEY_TRIAL);
        $hasActiveTrial = $isTrialPlan || ($trialDays !== null && (int) $trialDays > 0);

        $isFreePlan = ! $hasActiveTrial && (($planKey === 'free') || ($plan && (float) $plan->price <= 0));
        $isPaidWithoutTrial = ! $hasActiveTrial && ! $isFreePlan;

        if ($hasActiveTrial) {
            $days = $trialDays ?: $this->trialDaysFallback();
            $trialEndsAt = now()->addDays($days);
            $isTrialExpired = false;
        } elseif ($isPaidWithoutTrial) {
            $trialEndsAt = null;
            $isTrialExpired = true;
        } else {
            $trialEndsAt = null;
            $isTrialExpired = false;
        }

        if ($session->tenant_id) {
            $tenant = $session->tenant;

            if ($tenant === null) {
                $session->update(['tenant_id' => null]);
            } elseif ($tenant->database()->manager()->databaseExists($tenant->database()->getName())) {
                $tenant->update([
                    'plan' => $planKey,
                    'trial_ends_at' => $trialEndsAt,
                    'is_trial_expired' => $isTrialExpired,
                    'status' => 'active',
                ]);

                if ($isPaidWithoutTrial && $plan) {
                    $hasActiveOrder = \App\Models\PaymentOrder::on('central')
                        ->where('tenant_id', $tenant->getTenantKey())
                        ->active()
                        ->exists();

                    if (! $hasActiveOrder) {
                        app(\App\Services\PaymentOrderService::class)->createOrder($tenant, $plan, 'activate', 'month');
                    }
                }

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
            resellerGlobalId: $session->reseller_global_id,
            setup: [
                'session_id' => $session->id,
                'vertical' => $vertical,
                'plan_key' => $planKey,
                'phone' => $session->phone,
                'city' => $session->city,
                'fleet_size' => $session->fleet_size,
                'rental_model' => $session->rental_model,
                'module_keys' => SelfServeProvisioningPlan::defaultContentModules(),
                'pack_keys' => SelfServeProvisioningPlan::packKeysForVerticals($session->verticals ?? []),
            ],
            planKey: $planKey,
            trialEndsAt: $trialEndsAt,
        );

        $tenant->update([
            'plan' => $planKey,
            'trial_ends_at' => $trialEndsAt,
            'is_trial_expired' => $isTrialExpired,
            'status' => 'active',
        ]);

        $order = \App\Models\PaymentOrder::on('central')
            ->where('onboarding_session_id', $session->id)
            ->latest()
            ->first();

        if ($order) {
            $order->update(['tenant_id' => $tenant->getTenantKey()]);
            if ($order->status === \App\Models\PaymentOrder::STATUS_CONFIRMED && $plan) {
                $subscription = app(\App\Services\SubscriptionService::class)->activate(
                    $tenant,
                    $plan,
                    false,
                    $order->billing_interval ?? 'month',
                    (int) $order->subscribed_vehicles
                );
                $order->update(['subscription_id' => $subscription->id]);
            }
        }

        $session->update(['tenant_id' => $tenant->getTenantKey()]);

        return [$tenant, false];
    }

    private function installModulesAndPacks(Tenant $tenant, OnboardingSession $session, ModuleInstaller $installer): void
    {
        $vertical = $session->verticals[0] ?? 'rental';

        // Content modules (pages/posts/carousels) are core features: their tables
        // ship with every workspace via tenant migrations, so there is nothing to
        // install — seed the default landing pages directly.
        $tenant->run(function () use ($vertical): void {
            app(\Database\Seeders\TenantDefaultPageSeeder::class)->run($vertical);
            app(CreateBintangKejoraAlternativePagesSeeder::class)->run();
        });

        // Install any remaining *registered* content modules; core features are
        // always available and are skipped (install() rejects them by design,
        // same guard installPack() uses).
        foreach (SelfServeProvisioningPlan::defaultContentModules() as $moduleKey) {
            $module = Modules::find($moduleKey);

            if ($module === null || ! Modules::has($module->key())) {
                continue;
            }

            $installer->install($tenant, $module);
        }

        foreach (SelfServeProvisioningPlan::packKeysForVerticals($session->verticals ?? []) as $packKey) {
            $installer->installPack($tenant, $packKey, withDemoSeeders: false);
        }
    }

    /**
     * The Trial plan's own `trial_days` column, not a number embedded in code —
     * whoever edits the Trial plan changes how long every self-serve signup
     * gets, without a deploy. The fallback only covers a plan row that somehow
     * has no value at all.
     */
    private function trialDaysFallback(): int
    {
        $days = Plan::query()->where('key', Plan::KEY_TRIAL)->value('trial_days');

        return (int) ($days ?: 7);
    }
}
