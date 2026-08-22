<?php

namespace App\Services;

use App\Models\PaymentOrder;
use App\Models\Subscription;
use App\Models\SubscriptionRenewal;
use Illuminate\Support\Facades\DB;

class PaygRenewalService
{
    public function __construct(
        private SubscriptionService $subscriptionService,
    ) {}

    /**
     * Get subscriptions due for renewal within N days
     */
    public function getSubscriptionsDueForRenewal(int $daysFromNow = 7): \Illuminate\Database\Eloquent\Collection
    {
        return Subscription::query()
            ->where('auto_renew', true)
            ->where('status', Subscription::STATUS_ACTIVE)
            ->whereNotNull('next_renewal_date')
            ->where('next_renewal_date', '<=', now()->addDays($daysFromNow))
            ->where('next_renewal_date', '>', now())
            ->where('skip_next_renewal', false)
            ->where('renewal_notification_sent_at', '<', now()->subDays(7))
            ->orWhereNull('renewal_notification_sent_at')
            ->get();
    }

    /**
     * Get subscriptions ready to be renewed (renewal date is today or past)
     */
    public function getSubscriptionsReadyForRenewal(): \Illuminate\Database\Eloquent\Collection
    {
        return Subscription::query()
            ->where('auto_renew', true)
            ->where('status', Subscription::STATUS_ACTIVE)
            ->whereNotNull('next_renewal_date')
            ->where('next_renewal_date', '<=', now())
            ->where('skip_next_renewal', false)
            ->get();
    }

    /**
     * Create renewal record and payment order for subscription
     */
    public function createRenewalPaymentOrder(Subscription $subscription): PaymentOrder
    {
        return DB::connection(config('tenancy.database.central_connection'))
            ->transaction(function () use ($subscription) {
                $tenant = $subscription->tenant;
                $plan = $subscription->plan;

                // Calculate pricing for renewal
                $pricing = $this->subscriptionService->calculatePaygPrice(
                    $plan,
                    $subscription->subscribed_vehicles,
                    $this->getBillingInterval($subscription)
                );

                // Create payment order for renewal
                $paymentOrder = PaymentOrder::create([
                    'tenant_id' => $tenant->id,
                    'plan_id' => $plan->id,
                    'subscription_id' => $subscription->id,
                    'subscription_tier_id' => $plan->subscription_tier_id,
                    'subscribed_vehicles' => $subscription->subscribed_vehicles,
                    'price_per_vehicle' => $pricing['price_per_vehicle'],
                    'total_vehicle_cost' => $pricing['price_per_vehicle'] * $subscription->subscribed_vehicles,
                    'type' => 'renewal',
                    'billing_interval' => $this->getBillingInterval($subscription),
                    'payment_method' => 'manual_transfer',
                    'status' => PaymentOrder::STATUS_PENDING,
                    'amount' => $pricing['total_amount'],
                    'total_amount' => $pricing['total_amount'],
                    'currency' => 'IDR',
                    'unique_code' => PaymentOrder::generateUniqueCode(),
                    'expires_at' => now()->addDays(7),
                ]);

                // Create renewal record
                SubscriptionRenewal::create([
                    'subscription_id' => $subscription->id,
                    'payment_order_id' => $paymentOrder->id,
                    'status' => 'pending',
                    'renewal_date' => $subscription->next_renewal_date,
                ]);

                return $paymentOrder;
            });
    }

    /**
     * Process successful renewal after payment
     */
    public function processRenewalPayment(PaymentOrder $paymentOrder): Subscription
    {
        return DB::connection(config('tenancy.database.central_connection'))
            ->transaction(function () use ($paymentOrder) {
                $subscription = $paymentOrder->subscription;
                $plan = $subscription->plan;
                $currentVehicleCount = $subscription->subscribed_vehicles;

                // Calculate new billing period
                $interval = $paymentOrder->billing_interval;
                $newStartDate = $subscription->ends_at->addDay();
                $newEndDate = $interval === 'year'
                    ? $newStartDate->addYear()
                    : $newStartDate->addMonth();

                // Update subscription for new period
                $subscription->update([
                    'starts_at' => $newStartDate,
                    'ends_at' => $newEndDate,
                    'renewal_date' => $newEndDate,
                    'next_renewal_date' => $newEndDate->copy()->subDays(7),
                    'renewal_attempts' => 0,
                    'last_renewal_attempted_at' => now(),
                    'renewal_notification_sent_at' => null,
                    'skip_next_renewal' => false,
                ]);

                // Mark renewal as completed
                $renewal = SubscriptionRenewal::where('payment_order_id', $paymentOrder->id)->first();
                if ($renewal) {
                    $renewal->markAsCompleted();
                }

                return $subscription;
            });
    }

    /**
     * Mark renewal as failed
     */
    public function markRenewalFailed(PaymentOrder $paymentOrder, ?string $reason = null): void
    {
        $renewal = SubscriptionRenewal::where('payment_order_id', $paymentOrder->id)->first();
        if ($renewal) {
            $renewal->markAsFailed($reason);

            // Update subscription renewal attempts
            $subscription = $renewal->subscription;
            $subscription->update([
                'renewal_attempts' => $renewal->attempt_count,
                'last_renewal_attempted_at' => now(),
            ]);
        }
    }

    /**
     * Send renewal reminder notification
     */
    public function sendRenewalReminder(Subscription $subscription): void
    {
        $subscription->update([
            'renewal_notification_sent_at' => now(),
        ]);

        // TODO: Send email notification
        // NotificationFacade::send(new RenewalReminderNotification($subscription));
    }

    /**
     * Skip next renewal
     */
    public function skipNextRenewal(Subscription $subscription): void
    {
        $subscription->update([
            'skip_next_renewal' => true,
        ]);
    }

    /**
     * Re-enable renewal
     */
    public function enableRenewal(Subscription $subscription): void
    {
        $subscription->update([
            'skip_next_renewal' => false,
        ]);
    }

    /**
     * Get renewal history
     */
    public function getRenewalHistory(Subscription $subscription, int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return $subscription->renewals()
            ->latest('renewal_date')
            ->limit($limit)
            ->get();
    }

    /**
     * Determine billing interval from subscription
     */
    private function getBillingInterval(Subscription $subscription): string
    {
        // Check the most recent payment order for interval
        $lastPayment = PaymentOrder::where('subscription_id', $subscription->id)
            ->where('status', PaymentOrder::STATUS_CONFIRMED)
            ->latest()
            ->first();

        return $lastPayment?->billing_interval ?? 'month';
    }

    /**
     * Get days until renewal
     */
    public function getDaysUntilRenewal(Subscription $subscription): int
    {
        if (! $subscription->next_renewal_date) {
            return 0;
        }

        return max(0, now()->diffInDays($subscription->next_renewal_date, false));
    }

    /**
     * Check if renewal is overdue
     */
    public function isRenewalOverdue(Subscription $subscription): bool
    {
        return $subscription->next_renewal_date && $subscription->next_renewal_date->isPast();
    }
}
