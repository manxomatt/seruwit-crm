<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SubscriptionAutoRenewCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscription:auto-renew';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Auto-renew subscriptions and create payment orders for due renewals';

    /**
     * Execute the console command.
     */
    public function handle(\App\Services\SubscriptionService $service): int
    {
        $renewed = $service->autoRenew();
        $this->info("Auto-renewed {$renewed} subscriptions.");

        return 0;
    }
}
