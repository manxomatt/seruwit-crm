<?php

namespace App\Listeners;

use App\Events\PaymentOrderConfirmed;
use App\Jobs\AccrueResellerCommissionJob;

class AccrueResellerCommission
{
    public function handle(PaymentOrderConfirmed $event): void
    {
        AccrueResellerCommissionJob::dispatch($event->order->id);
    }
}
