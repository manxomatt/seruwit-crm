<?php

namespace App\Jobs;

use App\Services\PaygRenewalService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessSubscriptionRenewalsJob implements ShouldQueue
{
    use Queueable;

    public function __construct() {}

    public function handle(PaygRenewalService $renewalService): void
    {
        // Get all subscriptions ready for renewal
        $subscriptions = $renewalService->getSubscriptionsReadyForRenewal();

        foreach ($subscriptions as $subscription) {
            try {
                // Create payment order for renewal
                $paymentOrder = $renewalService->createRenewalPaymentOrder($subscription);

                // TODO: Send payment reminder email
                // dispatch(new SendRenewalPaymentReminderJob($paymentOrder));
            } catch (\Exception $e) {
                // Log error but continue with other renewals
                Log::error("Failed to process renewal for subscription {$subscription->id}: ".$e->getMessage());
            }
        }
    }
}
