<?php

namespace App\Jobs;

use App\Models\PaymentOrder;
use App\Services\ResellerCommissionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Record the reseller commission for a confirmed payment order.
 *
 * Runs off PaymentOrderConfirmed rather than inside the confirmation
 * transaction: a tenant's subscription must never fail to activate because
 * commission bookkeeping had a bad day. Safe to retry — accrual is idempotent
 * on payment_order_id.
 */
class AccrueResellerCommissionJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(public readonly int $paymentOrderId) {}

    public function handle(ResellerCommissionService $commissions): void
    {
        $order = PaymentOrder::query()->find($this->paymentOrderId);

        if ($order === null || $order->status !== PaymentOrder::STATUS_CONFIRMED) {
            return;
        }

        $commissions->accrueFor($order);
    }
}
