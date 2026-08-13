<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

/**
 * The plans the platform ships with.
 *
 * Re-runnable, and it only fills in what is missing: plan contents are edited
 * from the super admin UI, so re-seeding must never overwrite a live definition.
 * Basic is the default because it is what tenants had before plans existed —
 * defaulting to anything narrower would quietly take modules away from them.
 */
class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'key' => Plan::KEY_TRIAL,
                'name' => 'Trial',
                'description' => 'Self-serve onboarding trial: content CMS plus rental/travel packs (accounting & partners are core).',
                // Union of onboarding defaults (pages + accounting) and both
                // vertical packs — entitlement only; install still chooses packs.
                'modules' => Plan::trialModuleKeys(),
                'sort_order' => 0,
                'is_default' => false,
                'price' => 0,
                'currency' => 'IDR',
                'interval' => 'month',
                'trial_days' => 7,
                'is_trial' => true,
            ],
            [
                'key' => 'free',
                'name' => 'Free',
                'description' => 'CMS inti saja, tanpa modul tambahan.',
                'modules' => [],
                'sort_order' => 1,
                'is_default' => false,
                'price' => 0,
                'currency' => 'IDR',
                'interval' => 'month',
                'trial_days' => 0,
                'is_trial' => false,
            ],
            [
                'key' => 'basic',
                'name' => 'Basic',
                'description' => 'CMS inti plus page builder, blog, dan carousel untuk halaman publik.',
                // Pages and Posts were core before their extraction into
                // modules, so the default plan must keep covering them.
                'modules' => ['carousels', 'pages', 'posts'],
                'sort_order' => 2,
                'is_default' => true,
                'price' => 500000,
                'currency' => 'IDR',
                'interval' => 'month',
                'trial_days' => 0,
                'is_trial' => false,
            ],
            [
                'key' => 'pro',
                'name' => 'Pro',
                'description' => 'Seluruh modul yang tersedia, termasuk rental, canvassing, dan travel shuttle.',
                // Invoicing is not optional alongside Billing: Billing requires it,
                // and the auto-install chain enforces entitlement at every level,
                // so a plan selling Billing without it could never install either.
                'modules' => [
                    'approvals',
                    'billing',
                    'bi',
                    'canvassing',
                    'carousels',
                    'document',
                    'fleet',
                    'inventory',
                    'invoicing',
                    'maintenance',
                    'orders',
                    'outbound',
                    'pages',
                    'payables',
                    'pos',
                    'posts',
                    'products',
                    'promotions',
                    'purchasing',
                    'receivables',
                    'rental',
                    'routing',
                    'sales',
                    'scoring',
                    'shuttle',
                    'tracking',
                    'transportation',
                ],
                'sort_order' => 3,
                'is_default' => false,
                'price' => 1500000,
                'currency' => 'IDR',
                'interval' => 'month',
                'trial_days' => 0,
                'is_trial' => false,
            ],
        ];

        foreach ($plans as $plan) {
            // Trial is a code contract for self-serve pack installs — always
            // refresh its modules so stale firstOrCreate rows cannot block
            // ProvisionSelfServeTenantJob after packs gain new dependencies.
            if ($plan['key'] === Plan::KEY_TRIAL) {
                Plan::query()->updateOrCreate(['key' => Plan::KEY_TRIAL], $plan);

                continue;
            }

            // Other plans are edited from the super admin UI; never overwrite.
            Plan::query()->firstOrCreate(['key' => $plan['key']], $plan);
        }
    }
}
