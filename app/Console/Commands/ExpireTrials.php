<?php

namespace App\Console\Commands;

use App\Services\SubscriptionService;
use Illuminate\Console\Command;

class ExpireTrials extends Command
{
    protected $signature = 'subscription:expire-trials';

    protected $description = 'Suspend tenants whose trial period has expired';

    public function handle(SubscriptionService $service): int
    {
        $count = $service->expireTrials();

        $this->info("Expired {$count} trials.");

        return 0;
    }
}
