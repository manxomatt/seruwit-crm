<?php

namespace App\Services;

use App\Events\PaymentOrderConfirmed;
use App\Models\PaymentOrder;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use App\Notifications\PaymentOrderConfirmedNotification;
use App\Notifications\PaymentOrderCreatedNotification;
use App\Notifications\PaymentOrderRejectedNotification;
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

    public function createOrder(Tenant $tenant, Plan $plan, string $type = 'activate', string $billingInterval = 'month', int $subscribedVehicles = 0): PaymentOrder
    {
        $central = $this->centralConnection();
        $tenantId = $this->tenantId($tenant);
        $instructions = Config::get('payment.manual_transfer', []);

        return DB::connection($central)->transaction(function () use ($central, $tenant, $plan, $type, $billingInterval, $tenantId, $instructions, $subscribedVehicles) {
            $uniqueCode = PaymentOrder::generateUniqueCode();
            if ($plan->key === 'pay_as_you_go') {
                $amount = \App\Models\SubscriptionTier::calculatePrice($subscribedVehicles, $billingInterval);
            } else {
                $amount = $billingInterval === 'annual' && $plan->annual_price
                    ? (float) $plan->annual_price
                    : (float) ($plan->price ?? 0);
            }
            $totalAmount = $amount + $uniqueCode;

            $order = new PaymentOrder;
            $order->setConnection($central);
            $order->tenant_id = $tenantId;
            $order->plan_id = $plan->id;
            $order->subscribed_vehicles = $subscribedVehicles;
            $order->type = $type;
            $order->billing_interval = $billingInterval;
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

    public function createOnboardingOrder(\App\Models\OnboardingSession $session, Plan $plan, string $billingInterval = 'month', int $subscribedVehicles = 0): PaymentOrder
    {
        $central = $this->centralConnection();
        $instructions = Config::get('payment.manual_transfer', []);

        return DB::connection($central)->transaction(function () use ($central, $session, $plan, $billingInterval, $instructions, $subscribedVehicles) {
            $uniqueCode = PaymentOrder::generateUniqueCode();
            if ($plan->key === 'pay_as_you_go') {
                $amount = \App\Models\SubscriptionTier::calculatePrice($subscribedVehicles, $billingInterval);
            } else {
                $amount = $billingInterval === 'annual' && $plan->annual_price
                    ? (float) $plan->annual_price
                    : (float) ($plan->price ?? 0);
            }
            $totalAmount = $amount + $uniqueCode;

            $order = new PaymentOrder;
            $order->setConnection($central);
            $order->tenant_id = null;
            $order->onboarding_session_id = $session->id;
            $order->plan_id = $plan->id;
            $order->subscribed_vehicles = $subscribedVehicles;
            $order->type = 'activate';
            $order->billing_interval = $billingInterval;
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

            return $order->fresh();
        });
    }

    public function submitProof(PaymentOrder $order, UploadedFile $proof, ?string $note = null): void
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

            if ($order->onboarding_session_id && $order->onboardingSession) {
                $order->onboardingSession->update(['status' => \App\Models\OnboardingSession::STATUS_PAYMENT_SUBMITTED]);
            }

            $admins = User::on($central)->whereHas('roles', function ($query) {
                $query->where('slug', 'admin');
            })->get();

            $companyName = $order->tenant?->name
                ?? $order->onboardingSession?->company_name
                ?? 'Calon Workspace';

            foreach ($admins as $admin) {
                $admin->notify(new \App\Notifications\GenericNotification(
                    'Bukti Transfer Baru',
                    'Bukti transfer dari '.$companyName.' untuk paket '.$order->plan->name.' menunggu konfirmasi.',
                    route('module.payment-orders.show', $order),
                ));
            }
        });
    }

    public function confirm(PaymentOrder $order, User $admin): ?Subscription
    {
        $central = $this->centralConnection();

        if (! $order->tenant_id && $order->onboarding_session_id) {
            $session = DB::connection($central)->transaction(function () use ($central, $order, $admin) {
                if (! $order->isAwaitingConfirmation() && ! $order->isPending()) {
                    throw new \RuntimeException('Cannot confirm order in status: '.$order->status);
                }

                $order->setConnection($central);
                $order->status = PaymentOrder::STATUS_CONFIRMED;
                $order->confirmed_at = now();
                $order->confirmed_by = $admin->id;
                $order->save();

                $session = \App\Models\OnboardingSession::on($central)->findOrFail($order->onboarding_session_id);
                $session->update(['status' => \App\Models\OnboardingSession::STATUS_PENDING]);

                return $session;
            });

            \App\Jobs\ProvisionSelfServeTenantJob::dispatch($session->id);
            PaymentOrderConfirmed::dispatch($order);

            return null;
        }

        $subscription = DB::connection($central)->transaction(function () use ($central, $order, $admin) {
            if (! $order->isAwaitingConfirmation() && ! $order->isPending()) {
                throw new \RuntimeException('Cannot confirm order in status: '.$order->status);
            }

            $order->setConnection($central);
            $order->status = PaymentOrder::STATUS_CONFIRMED;
            $order->confirmed_at = now();
            $order->confirmed_by = $admin->id;
            $order->save();

            $tenant = Tenant::on($central)->whereKey($order->tenant_id)->firstOrFail();
            $plan = $order->plan_id ? Plan::on($central)->find($order->plan_id) : null;

            $subscriptionService = app(SubscriptionService::class);
            if ($order->type === PaymentOrder::TYPE_VEHICLE_CHECKOUT) {
                app(\Modules\Fleet\Support\VehicleCheckoutService::class)->confirmCheckoutOrder($order, (string) $admin->id);
                $subscription = null;
            } elseif ($order->type === 'upgrade') {
                $subscription = $subscriptionService->confirmUpgrade($order);
            } else {
                $isRenewal = in_array($order->type, ['renew', 'renewal'], true);
                $subscription = $plan ? $subscriptionService->activate(
                    $tenant,
                    $plan,
                    $isRenewal,
                    $order->billing_interval ?? 'month',
                    (int) $order->subscribed_vehicles
                ) : null;
            }

            if ($subscription) {
                $order->subscription_id = $subscription->id;
                $order->save();
            }

            $tenant->load('users');
            foreach ($tenant->users as $owner) {
                $owner->notify(new PaymentOrderConfirmedNotification($order));
            }

            return $subscription;
        });

        // Fired after the transaction commits so listeners (revenue journal,
        // reseller commission) only ever see a payment that is genuinely
        // confirmed — and so a failure in either can never roll back the
        // activation the tenant already paid for.
        PaymentOrderConfirmed::dispatch($order);

        return $subscription;
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
