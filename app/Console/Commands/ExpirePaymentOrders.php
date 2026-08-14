<?php

namespace App\Console\Commands;

use App\Services\PaymentOrderService;
use Illuminate\Console\Command;

class ExpirePaymentOrders extends Command
{
    protected $signature = 'subscription:expire-payment-orders';

    protected $description = 'Expire stale payment orders that have passed their deadline';

    public function handle(PaymentOrderService $service): int
    {
        $count = $service->expireStale();

        $this->info("Expired {$count} payment orders.");

        return 0;
    }
}
