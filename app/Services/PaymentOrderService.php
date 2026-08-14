<?php

namespace App\Services;

use App\Models\PaymentOrder;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use App\Notifications\PaymentOrderCreatedNotification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Stancl\Tenancy\Contracts\TenantWithDatabase;

class PaymentOrderService
{
    private function centralConnection(): string
    {
        return Config::get('tenancy.database.central_connection');
    }

    private function tenantId(TenantWithDatabase|Tenant $tenant): string
    {
        $id = $tenant->getKey();

        if (is_string($id) && $id !== '') {
            return $id;
        }

        $identifier = tenancy()->getTenantIdentifier();

        return is_string($identifier) ? $identifier : (string) $identifier;
    }

    public function createOrder(Tenant $tenant, Plan $plan, string $type = 'activate'): PaymentOrder
    {
        $central = $this->centralConnection();
        $tenantId = $this->tenantId($tenant);
        $instructions = Config::get('payment.manual_transfer', []);

        return DB::connection($central)->transaction(function () use ($central, $tenant, $plan, $type, $tenantId, $instructions) {
            $uniqueCode = PaymentOrder::generateUniqueCode();
            $amount = (float) ($plan->price ?? 0);
            $totalAmount = $amount + $uniqueCode;

            $order = new PaymentOrder;
            $order->setConnection($central);
            $order->tenant_id = $tenantId;
            $order->plan_id = $plan->id;
            $order->type = $type;
            $order->payment_method = Config::get('payment.driver', 'manual_transfer');
            $order->status = PaymentOrder::STATUS_PENDING;
            $order->amount = $amount;
            $order->unique_code = $uniqueCode;
            $order->total_amount = $totalAmount;
            $order->currency = $plan->currency ?? 'IDR';
            $order->bank_name = $instructions['bank_name'] ?? null;
            $order->bank_account_number = $instructions['bank_account_number'] ?? null;
            $order->bank_account_name = $instructions['bank_account_name'] ?? null;
            $order->expires_at = now()->addHours(48);
            $order->save();

            $tenant->load('users');
            foreach ($tenant->users as $owner) {
                $owner->notify(new PaymentOrderCreatedNotification($order));
            }

            return $order->fresh();
        });
    }

    public function submitProof(PaymentOrder $order, UploadedFile $proof, ?string $note): void
    {
        $central = $this->centralConnection();

        DB::connection($central)->transaction(function () use ($central, $order, $proof, $note) {
            if (! $order->isPending()) {
                throw new \RuntimeException('Cannot submit proof for order in status: '.$order->status);
            }

            $path = $proof->store('payment-proofs', 'payment_proofs');

            $order->setConnection($central);
            $order->transfer_proof_path = $path;
            $order->transfer_note = $note;
            $order->status = PaymentOrder::STATUS_AWAITING_CONFIRMATION;
            $order->save();

            $admins = User::on($central)->whereHas('roles', function ($query) {
                $query->where('slug', 'admin');
            })->get();

            foreach ($admins as $admin) {
                $admin->notify(new \App\Notifications\GenericNotification(
                    'Bukti Transfer Baru',
                    'Bukti transfer dari '.$order->tenant->name.' untuk paket '.$order->plan->name.' menunggu konfirmasi.',
                    route('module.payment-orders.show', $order),
                ));
            }
        });
    }

    public function confirm(PaymentOrder $order, User $admin): Subscription
    {
        $central = $this->centralConnection();

        return DB::connection($central)->transaction(function () use ($central, $order, $admin) {
            if (! $order->isAwaitingConfirmation() && ! $order->isPending()) {
                throw new \RuntimeException('Cannot confirm order in status: '.$order->status);
            }

            $order->setConnection($central);
            $order->status = PaymentOrder::STATUS_CONFIRMED;
            $order->confirmed_at = now();
            $order->confirmed_by = $admin->id;
            $order->save();

            $tenant = Tenant::on($central)->whereKey($order->tenant_id)->firstOrFail();
            $plan = Plan::on($central)->findOrFail($order->plan_id);

            $subscriptionService = app(SubscriptionService::class);
            $subscription = $subscriptionService->activate($tenant, $plan, $order->type === 'renew');

            $order->subscription_id = $subscription->id;
            $order->save();

            $tenant->load('users');
            foreach ($tenant->users as $owner) {
                $owner->notify(new PaymentOrderConfirmedNotification($order));
            }

            return $subscription;
        });
    }

    public function reject(PaymentOrder $order, User $admin, string $reason): void
    {
        $central = $this->centralConnection();

        DB::connection($central)->transaction(function () use ($central, $order, $admin, $reason) {
            if (! $order->isAwaitingConfirmation() && ! $order->isPending()) {
                throw new \RuntimeException('Cannot reject order in status: '.$order->status);
            }

            $order->setConnection($central);
            $order->status = PaymentOrder::STATUS_REJECTED;
            $order->rejected_at = now();
            $order->rejected_by = $admin->id;
            $order->rejection_reason = $reason;
            $order->save();

            $tenant = Tenant::on($central)->whereKey($order->tenant_id)->firstOrFail();
            $tenant->load('users');
            foreach ($tenant->users as $owner) {
                $owner->notify(new PaymentOrderRejectedNotification($order));
            }
        });
    }

    public function expireStale(): int
    {
        $central = $this->centralConnection();
        $now = now();

        $orders = PaymentOrder::on($central)
            ->whereIn('status', [
                PaymentOrder::STATUS_PENDING,
                PaymentOrder::STATUS_AWAITING_CONFIRMATION,
            ])
            ->where('expires_at', '<', $now)
            ->get(['id']);

        $ids = $orders->pluck('id')->all();

        if (! empty($ids)) {
            PaymentOrder::on($central)->whereIn('id', $ids)->update([
                'status' => PaymentOrder::STATUS_EXPIRED,
            ]);
        }

        return count($ids);
    }

    public function cancelActive(Tenant $tenant): void
    {
        $central = $this->centralConnection();
        $tenantId = $this->tenantId($tenant);

        PaymentOrder::on($central)
            ->where('tenant_id', $tenantId)
            ->whereIn('status', [
                PaymentOrder::STATUS_PENDING,
                PaymentOrder::STATUS_AWAITING_CONFIRMATION,
            ])
            ->update(['status' => PaymentOrder::STATUS_CANCELLED]);
    }
}
