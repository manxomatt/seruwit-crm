<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SubscriptionExpireTrialsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscription:expire-trials';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire trials for tenants whose trial period has ended';

    /**
     * Execute the console command.
     */
    public function handle(\App\Services\SubscriptionService $service): int
    {
        $count = $service->expireTrials();
        $this->info("Expired {$count} trials.");

        return 0;
    }
}
