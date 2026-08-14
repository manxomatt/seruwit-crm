<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Stancl\Tenancy\Contracts\TenantWithDatabase;

class SubscriptionService
{
    private function centralConnection(): string
    {
        return Config::get('tenancy.database.central_connection');
    }

    private function tenantId(TenantWithDatabase|Tenant $tenant): string
    {
        $id = $tenant->getKey();

        if (is_string($id) && $id !== '') {
            return $id;
        }

        $identifier = tenancy()->getTenantIdentifier();

        return is_string($identifier) ? $identifier : (string) $identifier;
    }

    public function activate(Tenant $tenant, Plan $plan, bool $renewal = false): Subscription
    {
        $central = $this->centralConnection();
        $tenantId = $this->tenantId($tenant);

        return DB::connection($central)->transaction(function () use ($tenant, $plan, $central, $tenantId, $renewal) {
            $now = now();

            if ($renewal) {
                $subscription = Subscription::on($central)
                    ->where('tenant_id', $tenantId)
                    ->first();

                if ($subscription) {
                    $endsAt = $subscription->ends_at
                        ? max($now, $subscription->ends_at)
                        : $now;

                    $subscription->update([
                        'plan_id' => $plan->id,
                        'ends_at' => $plan->interval === 'year' ? $endsAt->copy()->addYear() : $endsAt->copy()->addMonth(),
                        'status' => Subscription::STATUS_ACTIVE,
                        'cancelled_at' => null,
                        'ended_at' => null,
                    ]);

                    $tenant->update([
                        'plan' => $plan->key,
                        'trial_ends_at' => null,
                        'is_trial_expired' => false,
                        'status' => 'active',
                    ]);

                    return $subscription->fresh();
                }
            }

            $subscription = Subscription::on($central)->updateOrCreate(
                ['tenant_id' => $tenantId],
                [
                    'plan_id' => $plan->id,
                    'starts_at' => $now,
                    'ends_at' => $plan->interval === 'year' ? $now->copy()->addYear() : $now->copy()->addMonth(),
                    'status' => Subscription::STATUS_ACTIVE,
                    'cancelled_at' => null,
                    'ended_at' => null,
                ]
            );

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
        $central = $this->centralConnection();
        $tenantId = $this->tenantId($tenant);

        $subscription = Subscription::on($central)
            ->where('tenant_id', $tenantId)
            ->first();

        if ($subscription) {
            $subscription->update([
                'status' => Subscription::STATUS_CANCELLED,
                'cancelled_at' => now(),
            ]);
        }

        Tenant::on($central)->whereKey($tenantId)->update([
            'trial_ends_at' => null,
            'is_trial_expired' => true,
            'status' => 'suspended',
        ]);
    }

    public function expireTrials(): int
    {
        $central = $this->centralConnection();
        $tenants = Tenant::query()
            ->trialExpired()
            ->where('is_trial_expired', false)
            ->get(['id']);

        $tenantIds = $tenants->pluck('id')->all();

        if (! empty($tenantIds)) {
            Tenant::on($central)->whereIn('id', $tenantIds)->update([
                'status' => 'suspended',
                'is_trial_expired' => true,
            ]);
        }

        return count($tenantIds);
    }
}
