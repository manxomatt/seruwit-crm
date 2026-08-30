<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\PaymentOrder;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\PaymentOrderService;
use App\Services\SubscriptionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function __construct(
        private readonly SubscriptionService $service,
        private readonly PaymentOrderService $paymentOrderService,
    ) {}

    public function index(Request $request): Response|RedirectResponse
    {
        if (! tenancy()->initialized) {
            return redirect()->route('central.workspaces.index');
        }

        $tenant = tenant();
        abort_unless($tenant instanceof Tenant, 404);

        $plans = Plan::on('central')
            ->where(function ($query): void {
                $query->where('is_trial', false)
                    ->where('key', '!=', Plan::KEY_TRIAL);
            })
            ->active()
            ->ordered()
            ->get();

        $tenantId = (string) $tenant->getKey();
        $subscription = Subscription::on('central')->where('tenant_id', $tenantId)->first();
        $activePaymentOrder = PaymentOrder::on('central')
            ->where('tenant_id', $tenantId)
            ->active()
            ->latest()
            ->first();

        // Get count of registered vehicles in tenant's database
        $currentVehiclesCount = \Modules\Fleet\Models\Vehicle::billable()->count();
        $totalVehiclesCount = \Modules\Fleet\Models\Vehicle::count();

        // Get subscription tiers from central database
        $tiers = \App\Models\SubscriptionTier::on('central')->orderBy('min_vehicles')->get();

        // Get tenant's recent payment orders / transaction history
        $orders = PaymentOrder::on('central')
            ->where('tenant_id', $tenantId)
            ->with('plan:id,name,key')
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('Modules/Subscription/Activate', [
            'tenant' => [
                'id' => $tenantId,
                'name' => $tenant->name,
                'status' => $tenant->status,
                'plan' => $tenant->planKey(),
                'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
                'is_on_trial' => $tenant->isOnTrial ?? false,
            ],
            'plans' => $plans->map(fn (Plan $plan): array => [
                'id' => $plan->id,
                'key' => $plan->key,
                'name' => $plan->name,
                'description' => $plan->description,
                'badge' => $plan->badge,
                'is_popular' => (bool) $plan->is_popular,
                'price' => $plan->price,
                'original_price' => $plan->original_price,
                'annual_price' => $plan->annual_price,
                'annual_original_price' => $plan->annual_original_price,
                'currency' => $plan->currency ?? 'IDR',
                'interval' => $plan->interval,
                'modules' => $plan->modules ?? [],
                'limits' => $plan->limits ?? [],
                'features_list' => $plan->features_list ?? [],
            ])->values()->all(),
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'plan' => $subscription->plan?->name,
                'plan_id' => $subscription->plan_id,
                'subscribed_vehicles' => $subscription->subscribed_vehicles,
                'ends_at' => $subscription->ends_at?->toIso8601String(),
            ] : null,
            'isOnTrial' => $tenant->isOnTrial ?? false,
            'trialEndsAt' => $tenant->trial_ends_at?->toIso8601String(),
            'activePaymentOrder' => $activePaymentOrder ? [
                'id' => $activePaymentOrder->id,
                'status' => $activePaymentOrder->status,
                'total_amount' => $activePaymentOrder->total_amount,
                'unique_code' => $activePaymentOrder->unique_code,
                'expires_at' => $activePaymentOrder->expires_at?->toIso8601String(),
                'type' => $activePaymentOrder->type,
            ] : null,
            'orders' => $orders->map(fn (PaymentOrder $o): array => [
                'id' => $o->id,
                'type' => $o->type,
                'status' => $o->status,
                'amount' => $o->amount,
                'unique_code' => $o->unique_code,
                'total_amount' => $o->total_amount,
                'created_at' => $o->created_at?->toIso8601String(),
                'expires_at' => $o->expires_at?->toIso8601String(),
                'plan_name' => $o->plan?->name ?? 'Paket Langganan',
                'billing_interval' => $o->billing_interval,
                'can_cancel' => in_array($o->status, [PaymentOrder::STATUS_PENDING, PaymentOrder::STATUS_AWAITING_CONFIRMATION], true),
            ])->values()->all(),
            'currentVehiclesCount' => $currentVehiclesCount,
            'totalVehiclesCount' => $totalVehiclesCount,
            'tiers' => $tiers->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'min_vehicles' => $t->min_vehicles,
                'max_vehicles' => $t->max_vehicles,
                'price_per_vehicle' => $t->price_per_vehicle,
            ])->all(),
        ]);
    }

    public function previewUpgrade(Request $request): \Illuminate\Http\JsonResponse
    {
        $tenant = tenant();
        abort_unless($tenant instanceof Tenant, 404);

        $validated = $request->validate([
            'new_vehicle_quota' => 'required|integer|min:1|max:999999',
        ]);

        try {
            $calculation = $this->service->calculateProratedUpgrade(
                $tenant,
                $validated['new_vehicle_quota']
            );

            return response()->json([
                'success' => true,
                'data' => $calculation,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function createOrder(Request $request): RedirectResponse
    {
        $tenant = tenant();
        abort_unless($tenant instanceof Tenant, 404);

        $request->validate([
            'plan_id' => ['nullable', 'integer'],
            'type' => ['required', 'in:activate,renew,upgrade'],
            'billing_interval' => ['nullable', 'in:month,annual'],
            'subscribed_vehicles' => ['required_if:type,upgrade', 'nullable', 'integer', 'min:1'],
        ]);

        $type = $request->input('type', 'activate');
        $subscribedVehicles = (int) $request->input('subscribed_vehicles', 0);

        if ($type === 'upgrade') {
            try {
                $order = $this->service->upgrade($tenant, $subscribedVehicles);

                return redirect()->route('module.subscription.payment', $order);
            } catch (\InvalidArgumentException $e) {
                return back()->withErrors(['subscribed_vehicles' => $e->getMessage()]);
            }
        }

        $plan = Plan::on('central')->findOrFail($request->input('plan_id'));

        if ($plan->is_trial || ! $plan->is_active) {
            return back()->withErrors(['plan_id' => 'Invalid plan selected.']);
        }

        $billingInterval = $request->input('billing_interval', 'month');

        if ($type === 'renew' && ! $tenant->subscription) {
            $type = 'activate';
        }

        $order = $this->paymentOrderService->createOrder($tenant, $plan, $type, $billingInterval, $subscribedVehicles);

        return redirect()->route('module.subscription.payment', $order);
    }

    public function payment(Request $request, PaymentOrder $order): Response|RedirectResponse
    {
        if (! tenancy()->initialized) {
            return redirect()->route('central.workspaces.index');
        }

        $tenant = tenant();
        abort_unless($tenant instanceof Tenant, 404);

        if ((string) $order->tenant_id !== (string) $tenant->getKey()) {
            abort(403);
        }

        if ($order->isTerminal()) {
            return redirect()->route('module.subscription.index');
        }

        $instructions = config('payment.manual_transfer', []);

        return Inertia::render('Modules/Subscription/Payment', [
            'order' => [
                'id' => $order->id,
                'type' => $order->type,
                'status' => $order->status,
                'amount' => $order->amount,
                'unique_code' => $order->unique_code,
                'total_amount' => $order->total_amount,
                'currency' => $order->currency,
                'expires_at' => $order->expires_at?->toIso8601String(),
                'transfer_proof_path' => $order->transfer_proof_path,
                'transfer_note' => $order->transfer_note,
                'rejection_reason' => $order->rejection_reason,
                'bank_name' => $order->bank_name ?? $instructions['bank_name'] ?? null,
                'bank_account_number' => $order->bank_account_number ?? $instructions['bank_account_number'] ?? null,
                'bank_account_name' => $order->bank_account_name ?? $instructions['bank_account_name'] ?? null,
                'proof_url' => $order->proof_url,
            ],
            'plan' => $order->plan ? [
                'id' => $order->plan->id,
                'name' => $order->plan->name,
                'interval' => $order->plan->interval,
            ] : null,
        ]);
    }

    public function submitProof(Request $request, PaymentOrder $order): RedirectResponse
    {
        $tenant = tenant();
        abort_unless($tenant instanceof Tenant, 404);

        if ((string) $order->tenant_id !== (string) $tenant->getKey()) {
            abort(403);
        }

        $request->validate([
            'proof' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'transfer_note' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->paymentOrderService->submitProof($order, $request->file('proof'), $request->input('transfer_note'));

        return redirect()->route('module.subscription.payment', $order)->with('success', 'Bukti transfer berhasil diunggah.');
    }

    public function cancelOrder(Request $request, PaymentOrder $order): RedirectResponse
    {
        $tenant = tenant();
        abort_unless($tenant instanceof Tenant, 404);

        if ((string) $order->tenant_id !== (string) $tenant->getKey()) {
            abort(403);
        }

        $central = config('tenancy.database.central_connection');
        if (in_array($order->status, [PaymentOrder::STATUS_PENDING, PaymentOrder::STATUS_AWAITING_CONFIRMATION], true)) {
            $order->setConnection($central);
            $order->update(['status' => PaymentOrder::STATUS_CANCELLED]);
        } else {
            $this->paymentOrderService->cancelActive($tenant);
        }

        return redirect()->route('module.subscription.index')->with('success', 'Transaksi pesanan pembayaran #'.$order->id.' berhasil dibatalkan.');
    }

    public function cancelActiveOrder(Request $request): RedirectResponse
    {
        $tenant = tenant();
        abort_unless($tenant instanceof Tenant, 404);

        $this->paymentOrderService->cancelActive($tenant);

        return redirect()->route('module.subscription.index')->with('success', 'Transaksi pesanan pembayaran aktif berhasil dibatalkan.');
    }
}
