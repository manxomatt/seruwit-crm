<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class SubscriptionService
{
    public function activate(Tenant $tenant, Plan $plan): Subscription
    {
        return DB::transaction(function () use ($tenant, $plan) {
            $now = now();

            $subscription = Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'starts_at' => $now,
                'ends_at' => $plan->interval === 'year' ? $now->copy()->addYear() : $now->copy()->addMonth(),
                'status' => Subscription::STATUS_ACTIVE,
            ]);

            $tenant->update([
                'plan' => $plan->key,
                'trial_ends_at' => null,
                'is_trial_expired' => false,
                'status' => 'active',
            ]);

            return $subscription;
        });
    }

    public function cancel(Tenant $tenant): void
    {
        $subscription = $tenant->subscription;

        if ($subscription) {
            $subscription->update([
                'status' => Subscription::STATUS_CANCELLED,
                'cancelled_at' => now(),
            ]);
        }

        $tenant->update([
            'trial_ends_at' => null,
            'is_trial_expired' => true,
            'status' => 'suspended',
        ]);
    }

    public function expireTrials(): int
    {
        $tenants = Tenant::query()
            ->trialExpired()
            ->where('is_trial_expired', false)
            ->get();

        foreach ($tenants as $tenant) {
            $tenant->update([
                'status' => 'suspended',
                'is_trial_expired' => true,
            ]);
        }

        return $tenants->count();
    }
}
