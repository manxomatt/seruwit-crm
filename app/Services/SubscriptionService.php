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
     * Calculate pro-rated upgrade pricing and breakdown for a tenant.
     *
     * @return array{
     *     current_vehicles: int,
     *     new_vehicles: int,
     *     additional_vehicles: int,
     *     days_remaining: int,
     *     total_days: int,
     *     old_tier_id: int|null,
     *     old_tier_name: string|null,
     *     new_tier_id: int|null,
     *     new_tier_name: string|null,
     *     old_price_per_vehicle: float,
     *     new_price_per_vehicle: float,
     *     old_monthly_total: float,
     *     new_monthly_total: float,
     *     old_daily_rate: float,
     *     new_daily_rate: float,
     *     daily_difference: float,
     *     prorated_amount: float,
     *     subscription_id: int
     * }
     */
    public function calculateProratedUpgrade(Tenant $tenant, int $newVehicleCount): array
    {
        $central = $this->centralConnection();
        $tenantId = $this->tenantId($tenant);

        $subscription = Subscription::on($central)
            ->where('tenant_id', $tenantId)
            ->where('status', Subscription::STATUS_ACTIVE)
            ->first();

        $newTier = SubscriptionTier::tierFor($newVehicleCount);
        if (! $newTier) {
            throw new \InvalidArgumentException("Tier langganan tidak ditemukan untuk {$newVehicleCount} kendaraan");
        }

        $newPricePerVehicle = (float) $newTier->price_per_vehicle;
        $newMonthlyTotal = $newVehicleCount * $newPricePerVehicle;

        // If no active subscription exists yet (e.g. workspace is on Free Trial)
        if (! $subscription) {
            $oldCount = (int) ($tenant->max_vehicles_allowed ?? 0);
            $totalDays = 30;
            $daysRemaining = 30;
            $oldPricePerVehicle = 0.00;
            $oldMonthlyTotal = 0.00;
            $oldDailyRate = 0.00;
            $newDailyRate = $newMonthlyTotal / $totalDays;
            $dailyDiff = $newDailyRate;
            $proratedAmount = $newMonthlyTotal;

            return [
                'current_vehicles' => $oldCount,
                'new_vehicles' => $newVehicleCount,
                'additional_vehicles' => max(0, $newVehicleCount - $oldCount),
                'days_remaining' => $daysRemaining,
                'total_days' => $totalDays,
                'old_tier_id' => null,
                'old_tier_name' => 'Trial (Gratis)',
                'new_tier_id' => $newTier->id,
                'new_tier_name' => $newTier->name,
                'old_price_per_vehicle' => $oldPricePerVehicle,
                'new_price_per_vehicle' => $newPricePerVehicle,
                'old_monthly_total' => $oldMonthlyTotal,
                'new_monthly_total' => $newMonthlyTotal,
                'old_daily_rate' => $oldDailyRate,
                'new_daily_rate' => $newDailyRate,
                'daily_difference' => $dailyDiff,
                'prorated_amount' => $proratedAmount,
                'subscription_id' => null,
                'is_new_subscription' => true,
            ];
        }

        $oldCount = (int) $subscription->subscribed_vehicles;
        if ($newVehicleCount <= $oldCount) {
            throw new \InvalidArgumentException("Jumlah kuota baru ({$newVehicleCount}) harus lebih besar dari kuota saat ini ({$oldCount})");
        }

        $now = now();
        $oldTier = SubscriptionTier::tierFor($oldCount);

        $totalDays = ($subscription->starts_at && $subscription->ends_at)
            ? max(1, (int) $subscription->starts_at->diffInDays($subscription->ends_at))
            : 30;

        $daysRemaining = ($subscription->ends_at && $subscription->ends_at->isFuture())
            ? max(1, (int) $now->diffInDays($subscription->ends_at))
            : 1;

        $oldPricePerVehicle = $oldTier ? (float) $oldTier->price_per_vehicle : 20000.00;

        $oldMonthlyTotal = $oldCount * $oldPricePerVehicle;

        $oldDailyRate = $oldMonthlyTotal / $totalDays;
        $newDailyRate = $newMonthlyTotal / $totalDays;
        $dailyDiff = max(0, $newDailyRate - $oldDailyRate);

        $proratedAmount = round($dailyDiff * $daysRemaining, 2);

        return [
            'current_vehicles' => $oldCount,
            'new_vehicles' => $newVehicleCount,
            'additional_vehicles' => $newVehicleCount - $oldCount,
            'days_remaining' => $daysRemaining,
            'total_days' => $totalDays,
            'old_tier_id' => $oldTier?->id,
            'old_tier_name' => $oldTier?->name,
            'new_tier_id' => $newTier->id,
            'new_tier_name' => $newTier->name,
            'old_price_per_vehicle' => $oldPricePerVehicle,
            'new_price_per_vehicle' => $newPricePerVehicle,
            'old_monthly_total' => $oldMonthlyTotal,
            'new_monthly_total' => $newMonthlyTotal,
            'old_daily_rate' => $oldDailyRate,
            'new_daily_rate' => $newDailyRate,
            'daily_difference' => $dailyDiff,
            'prorated_amount' => $proratedAmount,
            'subscription_id' => $subscription->id,
            'is_new_subscription' => false,
        ];
    }

    /**
     * Upgrade subscription vehicle quota mid-period with pro-rated billing.
     */
    public function upgrade(Tenant $tenant, int $newVehicleCount, string $paymentMethod = 'manual_transfer'): PaymentOrder
    {
        $central = $this->centralConnection();
        $tenantId = $this->tenantId($tenant);
        $calculation = $this->calculateProratedUpgrade($tenant, $newVehicleCount);

        return DB::connection($central)->transaction(function () use ($central, $tenantId, $newVehicleCount, $paymentMethod, $calculation) {
            $plan = null;
            if ($calculation['subscription_id']) {
                $subscription = Subscription::on($central)->find($calculation['subscription_id']);
                $plan = $subscription?->plan;
            }

            if (! $plan) {
                $plan = Plan::on($central)
                    ->where(function ($q): void {
                        $q->where('key', 'pay_as_you_go')
                            ->orWhere('key', 'starter');
                    })
                    ->first()
                    ?? Plan::on($central)->where('is_trial', false)->first()
                    ?? Plan::on($central)->firstOrFail();
            }

            $uniqueCode = PaymentOrder::generateUniqueCode();
            $proratedAmount = $calculation['prorated_amount'];
            $totalAmount = $proratedAmount + $uniqueCode;
            $instructions = Config::get('payment.manual_transfer', []);

            $paymentOrder = PaymentOrder::on($central)->create([
                'tenant_id' => $tenantId,
                'plan_id' => $plan->id,
                'subscription_id' => $calculation['subscription_id'],
                'subscription_tier_id' => $calculation['new_tier_id'],
                'subscribed_vehicles' => $newVehicleCount,
                'price_per_vehicle' => $calculation['new_price_per_vehicle'],
                'total_vehicle_cost' => $calculation['new_monthly_total'],
                'upgrade_from_vehicles' => $calculation['current_vehicles'],
                'prorated_amount' => $proratedAmount,
                'type' => $calculation['subscription_id'] ? 'upgrade' : 'activate',
                'billing_interval' => 'month',
                'payment_method' => $paymentMethod,
                'status' => PaymentOrder::STATUS_PENDING,
                'amount' => $proratedAmount,
                'unique_code' => $uniqueCode,
                'total_amount' => $totalAmount,
                'currency' => 'IDR',
                'bank_name' => $instructions['bank_name'] ?? null,
                'bank_account_number' => $instructions['bank_account_number'] ?? null,
                'bank_account_name' => $instructions['bank_account_name'] ?? null,
                'expires_at' => now()->addDays(7),
            ]);

            return $paymentOrder;
        });
    }

    /**
     * Confirm upgrade and update subscription without resetting period dates.
     */
    public function confirmUpgrade(PaymentOrder $paymentOrder): Subscription
    {
        $central = $this->centralConnection();

        return DB::connection($central)->transaction(function () use ($paymentOrder, $central) {
            $subscription = Subscription::on($central)->findOrFail($paymentOrder->subscription_id);

            $subscription->update([
                'subscribed_vehicles' => $paymentOrder->subscribed_vehicles,
            ]);

            $tenant = Tenant::on($central)->whereKey($paymentOrder->tenant_id)->firstOrFail();
            $fromVehicles = (int) ($paymentOrder->upgrade_from_vehicles ?? 0);
            $targetVehicles = (int) $paymentOrder->subscribed_vehicles;
            $added = max(0, $targetVehicles - $fromVehicles);
            if ($added === 0 && $fromVehicles === 0) {
                $added = $targetVehicles;
            }

            $newCredits = (int) ($tenant->unit_capacity_credits ?? 0) + $added;

            $tenant->update([
                'max_vehicles_allowed' => $paymentOrder->subscribed_vehicles,
                'unit_capacity_credits' => $newCredits,
            ]);

            if ($added > 0) {
                \App\Models\TenantCapacityTransaction::on($central)->create([
                    'tenant_id' => $tenant->getTenantKey(),
                    'amount' => $added,
                    'balance_after' => $newCredits,
                    'type' => \App\Models\TenantCapacityTransaction::TYPE_TOPUP,
                    'description' => "Penambahan kuota unit dari upgrade order #{$paymentOrder->id} (+{$added} unit)",
                    'reference_id' => (string) $paymentOrder->id,
                    'created_by_id' => $paymentOrder->confirmed_by,
                ]);
            }

            return $subscription->fresh();
        });
    }

    /**
     * Auto-renew subscription: generate renewal orders H-7 for active subscriptions.
     */
    public function autoRenew(int $daysInAdvance = 7): int
    {
        $central = $this->centralConnection();
        $now = now();
        $targetDate = $now->copy()->addDays($daysInAdvance)->toDateString();

        $subscriptions = Subscription::on($central)
            ->where('auto_renew', true)
            ->where('status', Subscription::STATUS_ACTIVE)
            ->where(function ($query) use ($targetDate): void {
                $query->whereDate('renewal_date', '<=', $targetDate)
                    ->orWhere(function ($q) use ($targetDate): void {
                        $q->whereNotNull('ends_at')
                            ->whereDate('ends_at', '<=', $targetDate);
                    });
            })
            ->where('skip_next_renewal', false)
            ->get();

        $renewed = 0;

        foreach ($subscriptions as $subscription) {
            // Check if there is already an active/pending renewal order
            $hasActiveRenewalOrder = PaymentOrder::on($central)
                ->where('subscription_id', $subscription->id)
                ->where('type', 'renewal')
                ->whereIn('status', [
                    PaymentOrder::STATUS_PENDING,
                    PaymentOrder::STATUS_AWAITING_CONFIRMATION,
                ])
                ->exists();

            if ($hasActiveRenewalOrder) {
                continue;
            }

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
     * Process overdue subscriptions past the grace period (suspend unpaid accounts).
     */
    public function processOverdueSubscriptions(int $gracePeriodDays = 3): int
    {
        $central = $this->centralConnection();
        $cutoffDate = now()->subDays($gracePeriodDays);

        $expiredSubscriptions = Subscription::on($central)
            ->where('status', Subscription::STATUS_ACTIVE)
            ->whereNotNull('ends_at')
            ->where('ends_at', '<', $cutoffDate)
            ->get();

        $suspendedCount = 0;

        foreach ($expiredSubscriptions as $subscription) {
            DB::connection($central)->transaction(function () use ($subscription, $central) {
                $subscription->update([
                    'status' => Subscription::STATUS_EXPIRED,
                    'ended_at' => now(),
                ]);

                Tenant::on($central)->whereKey($subscription->tenant_id)->update([
                    'status' => 'suspended',
                ]);
            });

            $suspendedCount++;
        }

        return $suspendedCount;
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

            if (! $tier) {
                throw new \InvalidArgumentException("No tier defined for {$subscription->subscribed_vehicles} vehicles");
            }

            $uniqueCode = PaymentOrder::generateUniqueCode();
            $baseAmount = $subscription->subscribed_vehicles * $tier->price_per_vehicle;
            $totalAmount = $baseAmount + $uniqueCode;
            $instructions = Config::get('payment.manual_transfer', []);

            $paymentOrder = PaymentOrder::on($central)->create([
                'tenant_id' => $subscription->tenant_id,
                'plan_id' => $subscription->plan_id,
                'subscription_tier_id' => $tier->id,
                'subscribed_vehicles' => $subscription->subscribed_vehicles,
                'price_per_vehicle' => $tier->price_per_vehicle,
                'total_vehicle_cost' => $baseAmount,
                'type' => 'renewal',
                'billing_interval' => 'month',
                'payment_method' => 'manual_transfer',
                'status' => PaymentOrder::STATUS_PENDING,
                'amount' => $baseAmount,
                'unique_code' => $uniqueCode,
                'total_amount' => $totalAmount,
                'currency' => 'IDR',
                'bank_name' => $instructions['bank_name'] ?? null,
                'bank_account_number' => $instructions['bank_account_number'] ?? null,
                'bank_account_name' => $instructions['bank_account_name'] ?? null,
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
