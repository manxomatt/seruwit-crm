<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionTier;
use App\Models\Tenant;
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
            'vehicles_quota' => 'required|integer|min:1|max:999999',
            'billing_interval' => 'required|in:month,year',
        ]);

        $vehicleCount = $validated['vehicles_quota'];
        $pricingBreakdown = SubscriptionTier::priceBreakdown($vehicleCount, $validated['billing_interval']);

        return Inertia::render('Central/Subscription/Payment', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
            ],
            'vehicles_quota' => $vehicleCount,
            'billing_interval' => $validated['billing_interval'],
            'pricing' => $pricingBreakdown,
            'tier' => SubscriptionTier::tierFor($vehicleCount)?->toArray(),
        ]);
    }

    /**
     * Process subscription activation (create payment order).
     */
    public function store(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'vehicles_quota' => 'required|integer|min:1|max:999999',
            'billing_interval' => 'required|in:month,year',
            'payment_method' => 'required|in:manual_transfer',
        ]);

        $central = config('tenancy.database.central_connection');

        $paymentOrder = DB::connection($central)->transaction(function () use ($tenant, $validated) {
            $tier = SubscriptionTier::tierFor($validated['vehicles_quota']);
            $totalAmount = $validated['vehicles_quota'] * $tier->price_per_vehicle;

            if ($validated['billing_interval'] === 'year') {
                $totalAmount = $totalAmount * 10; // Annual discount (pay 10 months)
            }

            return \App\Models\PaymentOrder::create([
                'tenant_id' => $tenant->id,
                'plan_id' => Plan::where('key', 'trial')->firstOrFail()->id,
                'subscription_tier_id' => $tier->id,
                'subscribed_vehicles' => $validated['vehicles_quota'],
                'price_per_vehicle' => $tier->price_per_vehicle,
                'total_vehicle_cost' => $validated['vehicles_quota'] * $tier->price_per_vehicle,
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

        if (!$subscription || !$subscription->isActive()) {
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

        if (!$subscription) {
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
                'auto_renew' => $subscription->auto_renew,
                'subscription_type' => $subscription->subscription_type,
                'monthly_cost' => $subscription->subscribed_vehicles * SubscriptionTier::tierFor($subscription->subscribed_vehicles)->price_per_vehicle,
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

        if (!$subscription) {
            return back()->withErrors('No active subscription');
        }

        $subscription->update([
            'auto_renew' => !$subscription->auto_renew,
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
}
