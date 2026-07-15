<?php

namespace App\Modules;

use App\Models\InstalledModule;
use App\Models\Tenant;
use App\Modules\Facades\Modules;

/**
 * Builds the module catalog view-model.
 *
 * Shared by the workspace admin's own catalog and the super admin's per-tenant
 * panel so the two can never disagree about what state a module is in.
 */
class ModuleCatalog
{
    /**
     * @return list<array<string, mixed>>
     */
    public function forCurrentTenant(): array
    {
        return $this->forTenant(tenant());
    }

    /**
     * Every registered module with its state for $tenant.
     *
     * @return list<array<string, mixed>>
     */
    public function forTenant(Tenant $tenant): array
    {
        $graceDays = config('modules.purge_after_days');

        // Built inside the tenant context: the records are pinned to the tenant
        // connection, and casting their timestamps reaches for that connection's
        // query grammar, which no longer resolves once tenancy ends.
        return $tenant->run(function () use ($tenant, $graceDays): array {
            $states = InstalledModule::query()->get()->keyBy('key');

            $catalog = [];

            foreach (Modules::all() as $key => $module) {
                $record = $states->get($key);
                $entitled = $tenant->isEntitledTo($key);
                $installed = $record !== null && $record->isInstalled();

                $catalog[] = [
                    'key' => $key,
                    'label' => $module->label(),
                    'description' => $module->description(),
                    'requires' => $module->requires(),
                    'entitled' => $entitled,
                    'installed' => $installed,
                    'state' => $this->resolveState($entitled, $installed, $record),
                    'purges_at' => $record?->uninstalled_at
                        ?->addDays($graceDays)
                        ->toDateString(),
                    'plans_offering' => $this->plansOffering($key),
                ];
            }

            return $catalog;
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function currentPlan(): array
    {
        return $this->planFor(tenant());
    }

    /**
     * @return array<string, mixed>
     */
    public function planFor(Tenant $tenant): array
    {
        return [
            'key' => $tenant->planKey(),
            'label' => $tenant->planConfig()['label'] ?? $tenant->planKey(),
            'description' => $tenant->planConfig()['description'] ?? '',
        ];
    }

    /**
     * Every plan that can be assigned, for the super admin's plan picker.
     *
     * @return list<array<string, mixed>>
     */
    public function allPlans(): array
    {
        $plans = [];

        foreach (config('modules.plans', []) as $key => $plan) {
            $plans[] = [
                'key' => $key,
                'label' => $plan['label'] ?? $key,
                'description' => $plan['description'] ?? '',
                'modules' => $plan['modules'] ?? [],
            ];
        }

        return $plans;
    }

    /**
     * Names of the plans that include $key, so a locked module can say what it
     * would take to unlock it.
     *
     * @return list<string>
     */
    private function plansOffering(string $key): array
    {
        $labels = [];

        foreach (config('modules.plans', []) as $planKey => $plan) {
            if (in_array($key, $plan['modules'] ?? [], true)) {
                $labels[] = $plan['label'] ?? $planKey;
            }
        }

        return $labels;
    }

    /**
     * A module the plan no longer covers reads as locked even while its rows and
     * data are still sitting there — a downgrade revokes access without
     * uninstalling, and never starts the purge clock.
     */
    private function resolveState(bool $entitled, bool $installed, ?InstalledModule $record): string
    {
        if (! $entitled) {
            return $installed || $record ? 'locked_with_data' : 'locked';
        }

        if ($installed) {
            return 'installed';
        }

        return $record ? 'uninstalled' : 'available';
    }
}
