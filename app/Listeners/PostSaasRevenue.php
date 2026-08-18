<?php

namespace App\Listeners;

use App\Events\PaymentOrderConfirmed;
use App\Jobs\PostSaasRevenueJob;

class PostSaasRevenue
{
    public function handle(PaymentOrderConfirmed $event): void
    {
        PostSaasRevenueJob::dispatch($event->order->id);
    }
}
