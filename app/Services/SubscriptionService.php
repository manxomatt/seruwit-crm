<?php

namespace App\Services;

use App\Models\PaymentOrder;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionTier;
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

    public function activate(Tenant $tenant, Plan $plan, bool $renewal = false, string $billingInterval = 'month', int $subscribedVehicles = 0): Subscription
    {
        $central = $this->centralConnection();
        $tenantId = $this->tenantId($tenant);
        $isAnnual = $billingInterval === 'annual' || $plan->interval === 'year';

        return DB::connection($central)->transaction(function () use ($tenant, $plan, $central, $tenantId, $renewal, $isAnnual, $subscribedVehicles) {
            $now = now();

            if ($renewal) {
                $subscription = Subscription::on($central)
                    ->where('tenant_id', $tenantId)
                    ->first();

                if ($subscription) {
                    $endsAt = $subscription->ends_at
                        ? max($now, $subscription->ends_at)
                        : $now;

                    $newEndsAt = $isAnnual ? $endsAt->copy()->addYear() : $endsAt->copy()->addMonth();
                    $vehicleCount = $subscribedVehicles ?: $subscription->subscribed_vehicles;

                    $subscription->update([
                        'plan_id' => $plan->id,
                        'subscribed_vehicles' => $vehicleCount,
                        'current_vehicle_count' => $vehicleCount,
                        'subscription_type' => 'payg',
                        'starts_at' => $now,
                        'ends_at' => $newEndsAt,
                        'renewal_date' => $newEndsAt->toDateString(),
                        'next_billing_date' => $newEndsAt,
                        'status' => Subscription::STATUS_ACTIVE,
                        'cancelled_at' => null,
                        'ended_at' => null,
                    ]);

                    $tenant->update([
                        'plan' => $plan->key,
                        'subscription_type' => 'payg',
                        'max_vehicles_allowed' => $vehicleCount,
                        'subscription_id' => $subscription->id,
                        'trial_ends_at' => null,
                        'is_trial_expired' => false,
                        'status' => 'active',
                    ]);

                    return $subscription->fresh();
                }
            }

            $newEndsAt = $isAnnual ? $now->copy()->addYear() : $now->copy()->addMonth();

            $subscription = Subscription::on($central)->updateOrCreate(
                ['tenant_id' => $tenantId],
                [
                    'plan_id' => $plan->id,
                    'subscribed_vehicles' => $subscribedVehicles,
                    'current_vehicle_count' => $subscribedVehicles,
                    'subscription_type' => 'payg',
                    'starts_at' => $now,
                    'ends_at' => $newEndsAt,
                    'renewal_date' => $newEndsAt->toDateString(),
                    'next_billing_date' => $newEndsAt,
                    'auto_renew' => true,
                    'status' => Subscription::STATUS_ACTIVE,
                    'cancelled_at' => null,
                    'ended_at' => null,
                ]
            );

            $tenant->update([
                'plan' => $plan->key,
                'subscription_type' => 'payg',
                'max_vehicles_allowed' => $subscribedVehicles,
                'subscription_id' => $subscription->id,
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

    /**
     * Get maximum vehicles allowed for tenant (dynamic limit).
     * Returns null if unlimited (trial or no subscription).
     */
    public function getMaxVehiclesAllowed(Tenant $tenant): ?int
    {
        $central = $this->centralConnection();
        $tenantId = $this->tenantId($tenant);

        // On trial = unlimited
        if ($tenant->isOnTrial) {
            return null;
        }

        $subscription = Subscription::on($central)
            ->where('tenant_id', $tenantId)
            ->where('status', Subscription::STATUS_ACTIVE)
            ->first();

        if ($subscription && $subscription->isActive()) {
            return $subscription->subscribed_vehicles;
        }

        // Not on trial and no active subscription = blocked
        return 0;
    }

    /**
     * Check if tenant can add a vehicle (quota check).
     */
    public function canAddVehicle(Tenant $tenant, int $currentVehicleCount = 0): bool
    {
        $maxAllowed = $this->getMaxVehiclesAllowed($tenant);

        // Null = unlimited (trial)
        if ($maxAllowed === null) {
            return true;
        }

        // 0 = blocked (no active subscription)
        if ($maxAllowed === 0) {
            return false;
        }

        // Check if current + 1 exceeds quota
        return ($currentVehicleCount + 1) <= $maxAllowed;
    }

    /**
     * Upgrade subscription vehicle quota mid-period with pro-rated billing.
     */
    public function upgrade(Tenant $tenant, int $newVehicleCount): PaymentOrder
    {
        $central = $this->centralConnection();
        $tenantId = $this->tenantId($tenant);

        return DB::connection($central)->transaction(function () use ($central, $tenantId, $newVehicleCount) {
            $subscription = Subscription::on($central)
                ->where('tenant_id', $tenantId)
                ->where('status', Subscription::STATUS_ACTIVE)
                ->firstOrFail();

            if ($newVehicleCount <= $subscription->subscribed_vehicles) {
                throw new \InvalidArgumentException('New vehicle count must be greater than current');
            }

            $now = now();
            $oldCount = $subscription->subscribed_vehicles;
            $oldTier = SubscriptionTier::tierFor($oldCount);
            $newTier = SubscriptionTier::tierFor($newVehicleCount);

            // Calculate pro-rated amount
            $daysRemaining = max(1, $now->diffInDays($subscription->ends_at));
            $totalDays = 30; // assume monthly billing
            $oldDailyRate = (($oldCount * $oldTier->price_per_vehicle) ?? 0) / $totalDays;
            $newDailyRate = ($newVehicleCount * $newTier->price_per_vehicle) / $totalDays;
            $proratedAmount = ($newDailyRate - $oldDailyRate) * $daysRemaining;

            // Create upgrade payment order
            $paymentOrder = PaymentOrder::on($central)->create([
                'tenant_id' => $tenantId,
                'plan_id' => $subscription->plan_id,
                'subscription_id' => $subscription->id,
                'subscription_tier_id' => $newTier->id,
                'subscribed_vehicles' => $newVehicleCount,
                'price_per_vehicle' => $newTier->price_per_vehicle,
                'total_vehicle_cost' => $newVehicleCount * $newTier->price_per_vehicle,
                'upgrade_from_vehicles' => $oldCount,
                'prorated_amount' => $proratedAmount,
                'type' => 'upgrade',
                'billing_interval' => 'month',
                'payment_method' => 'manual_transfer',
                'status' => PaymentOrder::STATUS_PENDING,
                'amount' => $proratedAmount,
                'total_amount' => $proratedAmount,
                'currency' => 'IDR',
                'unique_code' => PaymentOrder::generateUniqueCode(),
                'expires_at' => $now->addDays(7),
            ]);

            return $paymentOrder;
        });
    }

    /**
     * Confirm upgrade and update subscription.
     */
    public function confirmUpgrade(PaymentOrder $paymentOrder): Subscription
    {
        $central = $this->centralConnection();

        return DB::connection($central)->transaction(function () use ($paymentOrder) {
            $subscription = $paymentOrder->subscription;

            $subscription->update([
                'subscribed_vehicles' => $paymentOrder->subscribed_vehicles,
                'current_vehicle_count' => $paymentOrder->subscribed_vehicles,
            ]);

            $tenant = $subscription->tenant;
            $tenant->update([
                'max_vehicles_allowed' => $paymentOrder->subscribed_vehicles,
            ]);

            return $subscription->fresh();
        });
    }

    /**
     * Auto-renew subscription (scheduled job).
     */
    public function autoRenew(): int
    {
        $central = $this->centralConnection();
        $now = now();

        $subscriptions = Subscription::on($central)
            ->where('auto_renew', true)
            ->where('status', Subscription::STATUS_ACTIVE)
            ->where('renewal_date', '<=', $now->toDateString())
            ->where('renewal_date', '>', $now->copy()->subDays(1)->toDateString())
            ->get();

        $renewed = 0;

        foreach ($subscriptions as $subscription) {
            try {
                $this->renew($subscription);
                $renewed++;
            } catch (\Exception $e) {
                \Log::error('Auto-renewal failed for subscription '.$subscription->id, [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $renewed;
    }

    /**
     * Renew subscription (create payment order for next period).
     */
    public function renew(Subscription $subscription): PaymentOrder
    {
        $central = $this->centralConnection();

        return DB::connection($central)->transaction(function () use ($subscription, $central) {
            $tenant = $subscription->tenant;
            $plan = $subscription->plan;
            $tier = SubscriptionTier::tierFor($subscription->subscribed_vehicles);

            $paymentOrder = PaymentOrder::on($central)->create([
                'tenant_id' => $subscription->tenant_id,
                'plan_id' => $subscription->plan_id,
                'subscription_tier_id' => $tier->id,
                'subscribed_vehicles' => $subscription->subscribed_vehicles,
                'price_per_vehicle' => $tier->price_per_vehicle,
                'total_vehicle_cost' => $subscription->subscribed_vehicles * $tier->price_per_vehicle,
                'type' => 'renewal',
                'billing_interval' => 'month',
                'payment_method' => 'manual_transfer',
                'status' => PaymentOrder::STATUS_PENDING,
                'amount' => $subscription->subscribed_vehicles * $tier->price_per_vehicle,
                'total_amount' => $subscription->subscribed_vehicles * $tier->price_per_vehicle,
                'currency' => 'IDR',
                'unique_code' => PaymentOrder::generateUniqueCode(),
                'subscription_id' => $subscription->id,
                'expires_at' => now()->addDays(7),
            ]);

            return $paymentOrder;
        });
    }

    /**
     * Update current vehicle count snapshot on subscription.
     */
    public function updateVehicleCountSnapshot(Subscription $subscription, int $currentCount): void
    {
        $subscription->update([
            'current_vehicle_count' => $currentCount,
        ]);
    }

    /**
     * Get subscription pricing breakdown.
     */
    public function getPricingBreakdown(int $vehicleCount): array
    {
        return SubscriptionTier::priceBreakdown($vehicleCount, 'month');
    }

    /**
     * Calculate PAYG pricing for a plan and vehicle count.
     */
    public function calculatePaygPrice(Plan $plan, int $vehicleCount, string $billingInterval = 'month'): array
    {
        if (! $plan->isPayg()) {
            throw new \InvalidArgumentException('Plan must use the PAYG pricing model');
        }

        $tier = SubscriptionTier::tierFor($vehicleCount);

        if (! $tier) {
            throw new \InvalidArgumentException("No subscription tier is defined for {$vehicleCount} vehicles");
        }

        $pricePerVehicle = $tier->price_per_vehicle;
        $monthlyTotal = $vehicleCount * $pricePerVehicle;

        if ($billingInterval === 'annual') {
            $annualTotal = $monthlyTotal * 10; // 2 months discount
        } else {
            $annualTotal = $monthlyTotal * 12;
        }

        return [
            'tier_id' => $tier->id,
            'tier_name' => $tier->name,
            'vehicle_count' => $vehicleCount,
            'price_per_vehicle' => $pricePerVehicle,
            'monthly_total' => $monthlyTotal,
            'annual_total' => $annualTotal,
            'annual_savings' => $monthlyTotal * 2, // 2 months saved
            'discount_percent' => round((1 - ($pricePerVehicle / 20000)) * 100), // Relative to tier 1
            'billing_interval' => $billingInterval,
            'total_amount' => $billingInterval === 'annual' ? $annualTotal : $monthlyTotal,
        ];
    }

    /**
     * Create payment order for PAYG plan activation.
     */
    public function createPaygPaymentOrder(Tenant $tenant, Plan $plan, int $vehicleCount, string $billingInterval = 'month'): PaymentOrder
    {
        $central = $this->centralConnection();
        $tenantId = $this->tenantId($tenant);
        $pricing = $this->calculatePaygPrice($plan, $vehicleCount, $billingInterval);

        return DB::connection($central)->transaction(function () use ($plan, $tenantId, $central, $vehicleCount, $billingInterval, $pricing) {
            $paymentOrder = PaymentOrder::on($central)->create([
                'tenant_id' => $tenantId,
                'plan_id' => $plan->id,
                'subscription_tier_id' => $pricing['tier_id'],
                'subscribed_vehicles' => $vehicleCount,
                'price_per_vehicle' => $pricing['price_per_vehicle'],
                'total_vehicle_cost' => $pricing['total_amount'],
                'type' => 'activate',
                'billing_interval' => $billingInterval,
                'payment_method' => 'manual_transfer',
                'status' => PaymentOrder::STATUS_PENDING,
                'amount' => $pricing['total_amount'],
                'total_amount' => $pricing['total_amount'],
                'currency' => 'IDR',
                'unique_code' => PaymentOrder::generateUniqueCode(),
                'expires_at' => now()->addDays(7),
            ]);

            return $paymentOrder;
        });
    }

    /**
     * Activate PAYG subscription after payment confirmation.
     */
    public function activatePaygSubscription(Tenant $tenant, Plan $plan, int $vehicleCount, string $billingInterval = 'month'): Subscription
    {
        $central = $this->centralConnection();
        $tenantId = $this->tenantId($tenant);
        $isAnnual = $billingInterval === 'annual';
        $pricing = $this->calculatePaygPrice($plan, $vehicleCount, $billingInterval);

        return DB::connection($central)->transaction(function () use ($tenant, $plan, $central, $tenantId, $vehicleCount, $isAnnual) {
            $now = now();
            $trialDays = $plan->include_trial ? ($plan->trial_duration_days ?? 30) : 0;
            $startsAt = $trialDays > 0 ? $now : $now;
            $trialEndsAt = $trialDays > 0 ? $now->copy()->addDays($trialDays) : null;
            $billingStartsAt = $trialEndsAt ?? $now;
            $endsAt = $isAnnual ? $billingStartsAt->copy()->addYear() : $billingStartsAt->copy()->addMonth();

            $subscription = Subscription::on($central)->updateOrCreate(
                ['tenant_id' => $tenantId],
                [
                    'plan_id' => $plan->id,
                    'subscribed_vehicles' => $vehicleCount,
                    'current_vehicle_count' => 0,
                    'subscription_type' => 'payg',
                    'starts_at' => $startsAt,
                    'ends_at' => $endsAt,
                    'renewal_date' => $endsAt->toDateString(),
                    'next_billing_date' => $billingStartsAt,
                    'auto_renew' => true,
                    'status' => Subscription::STATUS_ACTIVE,
                    'cancelled_at' => null,
                    'ended_at' => null,
                ]
            );

            $tenant->update([
                'plan' => $plan->key,
                'subscription_type' => 'payg',
                'max_vehicles_allowed' => $plan->allow_payg_upgrade ? null : $vehicleCount,
                'subscription_id' => $subscription->id,
                'trial_ends_at' => $trialEndsAt,
                'is_trial_expired' => false,
                'status' => 'active',
            ]);

            return $subscription->fresh();
        });
    }
}
