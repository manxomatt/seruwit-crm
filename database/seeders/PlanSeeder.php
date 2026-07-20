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
                'key' => 'free',
                'name' => 'Free',
                'description' => 'CMS inti saja, tanpa modul tambahan.',
                'modules' => [],
                'sort_order' => 1,
                'is_default' => false,
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
            ],
            [
                'key' => 'pro',
                'name' => 'Pro',
                'description' => 'Seluruh modul yang tersedia.',
                // Invoicing is not optional alongside Billing: Billing requires it,
                // and the auto-install chain enforces entitlement at every level,
                // so a plan selling Billing without it could never install either.
                'modules' => ['billing', 'carousels', 'customers', 'fleet', 'invoicing', 'orders', 'pages', 'posts', 'products', 'tracking', 'transportation'],
                'sort_order' => 3,
                'is_default' => false,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::query()->firstOrCreate(['key' => $plan['key']], $plan);
        }
    }
}
