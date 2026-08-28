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
    protected $signature = 'subscription:auto-renew {--days=7 : Number of days in advance to generate renewal orders} {--grace-days=3 : Grace period in days before suspending overdue subscriptions}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Auto-renew subscriptions, generate renewal payment orders, and process overdue accounts';

    /**
     * Execute the console command.
     */
    public function handle(\App\Services\SubscriptionService $service): int
    {
        $daysInAdvance = (int) $this->option('days');
        $graceDays = (int) $this->option('grace-days');

        $renewed = $service->autoRenew($daysInAdvance);
        $this->info("Generated renewal payment orders for {$renewed} subscriptions due in {$daysInAdvance} days.");

        $suspended = $service->processOverdueSubscriptions($graceDays);
        if ($suspended > 0) {
            $this->warn("Suspended {$suspended} overdue subscriptions past {$graceDays}-day grace period.");
        }

        return 0;
    }
}
