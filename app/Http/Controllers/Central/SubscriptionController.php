<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionTier;
use App\Models\Tenant;
use App\Services\PaygRenewalService;
use App\Services\SubscriptionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function __construct(
        private SubscriptionService $subscriptionService,
        private PaygRenewalService $renewalService,
    ) {}

    /**
     * Show subscription activation form.
     */
    public function show(Tenant $tenant): Response
    {
        $central = config('tenancy.database.central_connection');

        $plans = Plan::query()
            ->where('is_trial', false)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'description' => $plan->description,
                'price' => $plan->price,
                'currency' => $plan->currency,
                'pricing_model' => $plan->pricing_model,
                'subscription_tier_id' => $plan->subscription_tier_id,
                'include_trial' => $plan->include_trial,
                'trial_duration_days' => $plan->trial_duration_days,
                'allow_payg_upgrade' => $plan->allow_payg_upgrade,
            ]);

        $subscription = $tenant->subscription;
        $tiers = SubscriptionTier::orderBy('min_vehicles')->get();

        $trialEndsAt = $tenant->trial_ends_at?->format('Y-m-d');
        $daysUntilExpiry = $tenant->trial_ends_at
            ? max(0, $tenant->trial_ends_at->diffInDays(now()))
            : null;

        return Inertia::render('Central/Subscription/Activate', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'status' => $tenant->status,
            ],
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'plan_id' => $subscription->plan_id,
                'subscribed_vehicles' => $subscription->subscribed_vehicles,
                'status' => $subscription->status,
                'starts_at' => $subscription->starts_at->format('Y-m-d'),
                'ends_at' => $subscription->ends_at->format('Y-m-d'),
                'auto_renew' => $subscription->auto_renew,
            ] : null,
            'plans' => $plans,
            'tiers' => $tiers->map(fn ($tier) => [
                'id' => $tier->id,
                'name' => $tier->name,
                'min_vehicles' => $tier->min_vehicles,
                'max_vehicles' => $tier->max_vehicles,
                'price_per_vehicle' => $tier->price_per_vehicle,
            ]),
            'trial_ends_at' => $trialEndsAt,
            'days_until_expiry' => $daysUntilExpiry,
            'is_on_trial' => $tenant->isOnTrial,
        ]);
    }

    /**
     * Activate subscription (show payment form).
     */
    public function activate(Request $request, Tenant $tenant): Response
    {
        $validated = $request->validate([
            'plan_id' => 'required|integer|exists:plans,id',
            'vehicles_quota' => 'required|integer|min:1|max:999999',
            'billing_interval' => 'required|in:month,year',
        ]);

        $plan = Plan::findOrFail($validated['plan_id']);
        $vehicleCount = $validated['vehicles_quota'];

        // For PAYG plans, use plan's tier pricing
        if ($plan->isPayg()) {
            $pricing = $this->subscriptionService->calculatePaygPrice($plan, $vehicleCount, $validated['billing_interval']);
        } else {
            // For fixed plans, use traditional pricing
            $pricing = SubscriptionTier::priceBreakdown($vehicleCount, $validated['billing_interval']);
        }

        return Inertia::render('Central/Subscription/Payment', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
            ],
            'plan' => [
                'id' => $plan->id,
                'name' => $plan->name,
                'pricing_model' => $plan->pricing_model,
            ],
            'vehicles_quota' => $vehicleCount,
            'billing_interval' => $validated['billing_interval'],
            'pricing' => $pricing,
            'tier' => $plan->isPayg() ? $plan->subscriptionTier?->toArray() : SubscriptionTier::tierFor($vehicleCount)?->toArray(),
        ]);
    }

    /**
     * Process subscription activation (create payment order).
     */
    public function store(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'plan_id' => 'required|integer|exists:plans,id',
            'vehicles_quota' => 'required|integer|min:1|max:999999',
            'billing_interval' => 'required|in:month,year',
            'payment_method' => 'required|in:manual_transfer',
        ]);

        $plan = Plan::findOrFail($validated['plan_id']);
        $vehicleCount = $validated['vehicles_quota'];

        // For PAYG plans, create payment order using PAYG service
        if ($plan->isPayg()) {
            $paymentOrder = $this->subscriptionService->createPaygPaymentOrder(
                $tenant,
                $plan,
                $vehicleCount,
                $validated['billing_interval']
            );
        } else {
            // For fixed plans, use traditional pricing
            $central = config('tenancy.database.central_connection');
            $paymentOrder = DB::connection($central)->transaction(function () use ($tenant, $plan, $vehicleCount, $validated) {
                $tier = SubscriptionTier::tierFor($vehicleCount);
                $totalAmount = $vehicleCount * $tier->price_per_vehicle;

                if ($validated['billing_interval'] === 'year') {
                    $totalAmount = $totalAmount * 10; // Annual discount (pay 10 months)
                }

                return \App\Models\PaymentOrder::create([
                    'tenant_id' => $tenant->id,
                    'plan_id' => $plan->id,
                    'subscription_tier_id' => $tier->id,
                    'subscribed_vehicles' => $vehicleCount,
                    'price_per_vehicle' => $tier->price_per_vehicle,
                    'total_vehicle_cost' => $vehicleCount * $tier->price_per_vehicle,
                    'type' => 'activate',
                    'billing_interval' => $validated['billing_interval'],
                    'payment_method' => $validated['payment_method'],
                    'status' => \App\Models\PaymentOrder::STATUS_PENDING,
                    'amount' => $totalAmount,
                    'total_amount' => $totalAmount,
                    'currency' => 'IDR',
                    'unique_code' => \App\Models\PaymentOrder::generateUniqueCode(),
                    'expires_at' => now()->addDays(7),
                ]);
            });
        }

        return redirect()
            ->route('central.payment-orders.show', $paymentOrder)
            ->with('success', 'Payment order created. Please complete the payment.');
    }

    /**
     * Upgrade vehicle quota.
     */
    public function upgrade(Request $request, Tenant $tenant): Response
    {
        $subscription = $tenant->subscription;

        if (! $subscription || ! $subscription->isActive()) {
            return Inertia::render('Central/Subscription/NoActive', [
                'tenant' => $tenant->only('id', 'name'),
            ]);
        }

        $currentVehicles = $subscription->subscribed_vehicles;
        $tiers = SubscriptionTier::orderBy('min_vehicles')->get();

        return Inertia::render('Central/Subscription/Upgrade', [
            'tenant' => $tenant->only('id', 'name'),
            'subscription' => [
                'subscribed_vehicles' => $currentVehicles,
                'starts_at' => $subscription->starts_at->format('Y-m-d'),
                'ends_at' => $subscription->ends_at->format('Y-m-d'),
                'monthly_cost' => $currentVehicles * SubscriptionTier::tierFor($currentVehicles)->price_per_vehicle,
                'days_remaining' => max(1, $subscription->ends_at->diffInDays(now())),
            ],
            'tiers' => $tiers->map(fn ($tier) => [
                'id' => $tier->id,
                'name' => $tier->name,
                'min_vehicles' => $tier->min_vehicles,
                'max_vehicles' => $tier->max_vehicles,
                'price_per_vehicle' => $tier->price_per_vehicle,
            ]),
        ]);
    }

    /**
     * Process upgrade.
     */
    public function processUpgrade(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'new_vehicle_quota' => 'required|integer|min:1|max:999999',
        ]);

        $paymentOrder = $this->subscriptionService->upgrade($tenant, $validated['new_vehicle_quota']);

        return redirect()
            ->route('central.payment-orders.show', $paymentOrder)
            ->with('success', 'Upgrade offer created. Please complete the payment.');
    }

    /**
     * Show subscription management page.
     */
    public function management(Tenant $tenant): Response
    {
        $subscription = $tenant->subscription;

        if (! $subscription) {
            return Inertia::render('Central/Subscription/NoActive', [
                'tenant' => $tenant->only('id', 'name'),
            ]);
        }

        $paymentOrders = \App\Models\PaymentOrder::where('subscription_id', $subscription->id)
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'type' => $order->type,
                'status' => $order->status,
                'amount' => $order->total_amount,
                'created_at' => $order->created_at->format('Y-m-d'),
            ]);

        $plan = $subscription->plan;

        return Inertia::render('Central/Subscription/Management', [
            'tenant' => $tenant->only('id', 'name'),
            'subscription' => [
                'id' => $subscription->id,
                'subscribed_vehicles' => $subscription->subscribed_vehicles,
                'current_vehicle_count' => $subscription->current_vehicle_count,
                'status' => $subscription->status,
                'starts_at' => $subscription->starts_at->format('Y-m-d'),
                'ends_at' => $subscription->ends_at->format('Y-m-d'),
                'renewal_date' => $subscription->renewal_date?->format('Y-m-d'),
                'next_renewal_date' => $subscription->next_renewal_date?->format('Y-m-d'),
                'auto_renew' => $subscription->auto_renew,
                'skip_next_renewal' => $subscription->skip_next_renewal,
                'renewal_attempts' => $subscription->renewal_attempts,
                'subscription_type' => $subscription->subscription_type,
                'monthly_cost' => $subscription->subscribed_vehicles * SubscriptionTier::tierFor($subscription->subscribed_vehicles)->price_per_vehicle,
                'plan' => $plan ? [
                    'name' => $plan->name,
                    'pricing_model' => $plan->pricing_model,
                ] : null,
            ],
            'payment_orders' => $paymentOrders,
        ]);
    }

    /**
     * Toggle auto-renewal.
     */
    public function toggleAutoRenew(Request $request, Tenant $tenant): RedirectResponse
    {
        $subscription = $tenant->subscription;

        if (! $subscription) {
            return back()->withErrors('No active subscription');
        }

        $subscription->update([
            'auto_renew' => ! $subscription->auto_renew,
        ]);

        return back()->with('success', 'Auto-renewal setting updated.');
    }

    /**
     * Cancel subscription.
     */
    public function cancel(Tenant $tenant): RedirectResponse
    {
        $this->subscriptionService->cancel($tenant);

        return redirect()
            ->route('central.workspaces.index')
            ->with('success', 'Subscription cancelled.');
    }

    /**
     * Show renewal history and upcoming renewal.
     */
    public function renewalHistory(Tenant $tenant): Response
    {
        $subscription = $tenant->subscription;

        if (! $subscription) {
            return Inertia::render('Central/Subscription/NoActive', [
                'tenant' => $tenant->only('id', 'name'),
            ]);
        }

        $renewalHistory = $this->renewalService->getRenewalHistory($subscription, 20);
        $daysUntilRenewal = $this->renewalService->getDaysUntilRenewal($subscription);
        $isOverdue = $this->renewalService->isRenewalOverdue($subscription);

        return Inertia::render('Central/Subscription/RenewalHistory', [
            'tenant' => $tenant->only('id', 'name'),
            'subscription' => [
                'id' => $subscription->id,
                'plan_id' => $subscription->plan_id,
                'auto_renew' => $subscription->auto_renew,
                'next_renewal_date' => $subscription->next_renewal_date?->format('Y-m-d'),
                'skip_next_renewal' => $subscription->skip_next_renewal,
                'renewal_attempts' => $subscription->renewal_attempts,
                'days_until_renewal' => $daysUntilRenewal,
                'is_renewal_overdue' => $isOverdue,
            ],
            'renewal_history' => $renewalHistory->map(fn ($renewal) => [
                'id' => $renewal->id,
                'status' => $renewal->status,
                'renewal_date' => $renewal->renewal_date->format('Y-m-d'),
                'processed_at' => $renewal->processed_at?->format('Y-m-d H:i'),
                'failure_reason' => $renewal->failure_reason,
                'attempt_count' => $renewal->attempt_count,
            ]),
        ]);
    }

    /**
     * Process manual renewal.
     */
    public function processRenewal(Tenant $tenant): RedirectResponse
    {
        $subscription = $tenant->subscription;

        if (! $subscription) {
            return back()->withErrors('No active subscription');
        }

        try {
            $paymentOrder = $this->renewalService->createRenewalPaymentOrder($subscription);

            return redirect()
                ->route('central.payment-orders.show', $paymentOrder)
                ->with('success', 'Renewal payment order created. Please complete the payment.');
        } catch (\Exception $e) {
            return back()->withErrors('Failed to create renewal: '.$e->getMessage());
        }
    }

    /**
     * Skip next renewal.
     */
    public function skipRenewal(Tenant $tenant): RedirectResponse
    {
        $subscription = $tenant->subscription;

        if (! $subscription) {
            return back()->withErrors('No active subscription');
        }

        $this->renewalService->skipNextRenewal($subscription);

        return back()->with('success', 'Next renewal has been skipped.');
    }

    /**
     * Enable renewal again.
     */
    public function enableRenewal(Tenant $tenant): RedirectResponse
    {
        $subscription = $tenant->subscription;

        if (! $subscription) {
            return back()->withErrors('No active subscription');
        }

        $this->renewalService->enableRenewal($subscription);

        return back()->with('success', 'Renewal has been enabled.');
    }
}
