<?php

namespace App\Jobs;

use App\Models\Subscription;
use App\Services\PaygRenewalService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendRenewalReminderJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private Subscription $subscription,
    ) {}

    public function handle(PaygRenewalService $renewalService): void
    {
        // Skip if not PAYG plan or not auto-renewing
        if (! $this->subscription->plan->isPayg() || ! $this->subscription->auto_renew) {
            return;
        }

        // Send reminder notification
        $renewalService->sendRenewalReminder($this->subscription);

        // TODO: Dispatch actual email notification
        // Mail::queue(new RenewalReminderMail($this->subscription));
    }
}
