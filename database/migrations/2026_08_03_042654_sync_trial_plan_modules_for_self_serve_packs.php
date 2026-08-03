<?php

use App\Models\Plan;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Keep the trial plan's entitlement list aligned with self-serve pack installs.
     *
     * PlanSeeder historically used firstOrCreate, so environments seeded before
     * receivables joined the vertical packs kept a stale trial catalog and
     * ProvisionSelfServeTenantJob failed with "Plan [trial] does not include…".
     */
    public function up(): void
    {
        $trial = Plan::query()->firstWhere('key', Plan::KEY_TRIAL);

        if ($trial === null) {
            return;
        }

        $trial->forceFill([
            'description' => 'Self-serve onboarding trial: content CMS plus rental/travel packs (accounting & partners are core).',
            'modules' => Plan::trialModuleKeys(),
            'is_default' => false,
        ])->save();
    }

    public function down(): void
    {
        // Intentionally empty — trial entitlements are a code contract.
    }
};
