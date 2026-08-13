<?php

namespace App\Console\Commands;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Console\Command;

class BackfillSubscriptions extends Command
{
    protected $signature = 'subscription:backfill';

    protected $description = 'Backfill subscription records for existing tenants';

    public function handle(): int
    {
        $tenants = Tenant::query()
            ->whereDoesntHave('subscription')
            ->get(['id', 'name', 'data', 'status', 'trial_ends_at', 'is_trial_expired']);

        $count = 0;

        foreach ($tenants as $tenant) {
            $planKey = data_get($tenant->data, 'plan', Plan::KEY_TRIAL);
            $plan = Plan::query()->where('key', $planKey)->first();

            if (! $plan) {
                $plan = Plan::query()->where('key', Plan::KEY_TRIAL)->firstOrFail();
            }

            $now = now();

            Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'starts_at' => $tenant->trial_ends_at?->subDays(7) ?? $now->subDays(30),
                'ends_at' => $tenant->trial_ends_at ?? null,
                'status' => $tenant->status === 'active' ? Subscription::STATUS_ACTIVE : Subscription::STATUS_CANCELLED,
                'cancelled_at' => $tenant->status !== 'active' ? $tenant->updated_at : null,
            ]);

            $count++;
        }

        $this->info("Backfilled {$count} subscriptions.");

        return 0;
    }
}
