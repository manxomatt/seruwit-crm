<?php

namespace App\Services;

use App\Models\PaymentOrder;
use App\Models\ResellerCommission;
use App\Models\Tenant;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * Writes and retires rows in the reseller commission ledger.
 *
 * The ledger is append-only in spirit: rows are created once, transition
 * through their status, and are never re-costed. Anything that would change an
 * amount after the fact belongs in a new row, not an update.
 */
class ResellerCommissionService
{
    public function __construct(private readonly ResellerCommissionResolver $resolver) {}

    private function centralConnection(): string
    {
        return Config::get('tenancy.database.central_connection');
    }

    /**
     * Record what a confirmed payment owes its reseller.
     *
     * Idempotent twice over: an existing row short-circuits the work, and the
     * unique index on payment_order_id catches the race where two workers pass
     * that check at the same time.
     */
    public function accrueFor(PaymentOrder $order): ?ResellerCommission
    {
        if ($order->status !== PaymentOrder::STATUS_CONFIRMED) {
            return null;
        }

        $central = $this->centralConnection();

        $existing = ResellerCommission::on($central)
            ->where('payment_order_id', $order->id)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        $tenant = Tenant::on($central)->find($order->tenant_id);
        $quote = $this->resolver->resolve($order, $tenant);

        if ($quote === null) {
            return null;
        }

        $confirmedAt = $order->confirmed_at ?? now();
        $holdDays = (int) Config::get('reseller.hold_days', 7);

        try {
            return DB::connection($central)->transaction(fn () => ResellerCommission::on($central)->create([
                'reseller_global_id' => $quote->resellerGlobalId,
                'tenant_id' => $order->tenant_id,
                'payment_order_id' => $order->id,
                'subscription_id' => $order->subscription_id,
                'plan_id' => $order->plan_id,
                'event' => $quote->event,
                'base_amount' => $quote->baseAmount,
                'rule_id' => $quote->rule?->id,
                'rate_type' => $quote->rateType,
                'rate_value' => $quote->rateValue,
                'commission_amount' => $quote->commissionAmount,
                'tax_withheld_amount' => 0,
                'net_amount' => $quote->commissionAmount,
                'currency' => $order->currency ?? 'IDR',
                'occurrence' => $quote->occurrence,
                'status' => ResellerCommission::STATUS_PENDING,
                'hold_until' => $confirmedAt->copy()->addDays($holdDays),
            ]));
        } catch (UniqueConstraintViolationException) {
            return ResellerCommission::on($central)
                ->where('payment_order_id', $order->id)
                ->first();
        }
    }

    /**
     * Cancel a commission that turned out not to be owed — a refunded payment,
     * a reversed order, a fraudulent signup.
     *
     * Refuses once the money has been paid out; that correction has to be an
     * explicit negative adjustment, not a silent status flip.
     */
    public function void(ResellerCommission $commission, string $reason): bool
    {
        if (! $commission->canBeVoided()) {
            return false;
        }

        $commission->setConnection($this->centralConnection());
        $commission->update([
            'status' => ResellerCommission::STATUS_VOID,
            'voided_at' => now(),
            'void_reason' => $reason,
        ]);

        return true;
    }

    public function voidForOrder(PaymentOrder $order, string $reason): bool
    {
        $commission = ResellerCommission::on($this->centralConnection())
            ->where('payment_order_id', $order->id)
            ->first();

        return $commission !== null && $this->void($commission, $reason);
    }

    /**
     * Release commissions whose refund window has closed, making them eligible
     * for the next payout batch. Run from the scheduler.
     */
    public function approveMatured(): int
    {
        return ResellerCommission::on($this->centralConnection())
            ->where('status', ResellerCommission::STATUS_PENDING)
            ->where(fn ($query) => $query->whereNull('hold_until')->orWhere('hold_until', '<=', now()))
            ->update([
                'status' => ResellerCommission::STATUS_APPROVED,
                'approved_at' => now(),
            ]);
    }
}
