<?php

namespace App\Console\Commands;

use App\Services\ResellerCommissionService;
use Illuminate\Console\Command;

class ApproveMaturedCommissions extends Command
{
    protected $signature = 'reseller:approve-commissions';

    protected $description = 'Approve reseller commissions whose refund hold period has passed';

    public function handle(ResellerCommissionService $service): int
    {
        $count = $service->approveMatured();

        $this->info("Approved {$count} commissions.");

        return 0;
    }
}
