<?php

namespace App\Http\Controllers\Central;

use App\Actions\Auth\EnsureUserHasGlobalId;
use App\Actions\Auth\ResolvePostAuthDestination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\StoreOnboardingRequest;
use App\Jobs\ProvisionSelfServeTenantJob;
use App\Models\OnboardingSession;
use App\Models\Setting;
use App\Support\Onboarding\SelfServeProvisioningPlan;
use App\Support\Reseller\ResellerAttribution;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function __construct(
        private readonly ResolvePostAuthDestination $postAuthDestination,
        private readonly EnsureUserHasGlobalId $ensureUserHasGlobalId,
    ) {}

    public function show(Request $request): Response|RedirectResponse
    {
        abort_if(tenancy()->initialized, 404);

        $session = $this->sessionFor($request);

        if ($session !== null && $session->isAwaitingPayment()) {
            return redirect()->route('central.onboarding.payment');
        }

        if ($session !== null && $session->isInProgress()) {
            return redirect()->route('central.onboarding.status');
        }

        if ($session?->status === OnboardingSession::STATUS_READY && $session->tenant_id) {
            return redirect()->route('central.workspaces.enter', $session->tenant_id);
        }

        if (! $this->postAuthDestination->needsWorkspaceOnboarding($request->user())) {
            return redirect()->to($this->postAuthDestination->url($request->user()));
        }

        $plans = \App\Models\Plan::query()
            ->active()
            ->orderBy('sort_order')
            ->get()
            ->map(fn (\App\Models\Plan $plan) => [
                'id' => $plan->id,
                'key' => $plan->key,
                'name' => $plan->name,
                'description' => $plan->description,
                'badge' => $plan->badge,
                'is_popular' => (bool) $plan->is_popular,
                'is_default' => (bool) $plan->is_default,
                'is_trial' => (bool) $plan->is_trial,
                'trial_days' => (int) $plan->trial_days,
                'price' => $plan->price,
                'original_price' => $plan->original_price,
                'annual_price' => $plan->annual_price,
                'currency' => $plan->currency,
                'limits' => $plan->limits,
                'features_list' => $plan->features_list,
                'modules' => $plan->modules ?? [],
            ])
            ->all();

        $initialCompanyName = (string) ($request->query('company_name')
            ?: ($session?->company_name ?: session('onboarding_company_name', '')));

        $initialSubdomain = (string) ($request->query('subdomain')
            ?: ($session?->subdomain ?: ($initialCompanyName ? \Illuminate\Support\Str::slug($initialCompanyName, '') : '')));

        $selectedPlanKey = (string) ($request->query('plan')
            ?: ($session?->plan_key ?: (session('onboarding_plan') ?: (collect($plans)->firstWhere('key', 'free')['key'] ?? 'free'))));

        $initialPhone = (string) ($session?->phone ?: session('onboarding_phone', ''));
        $initialCity = (string) ($session?->city ?: session('onboarding_city', ''));
        $initialFleetSize = (string) ($session?->fleet_size ?: '1-5');
        $initialRentalModel = (string) ($session?->rental_model ?: 'both');

        return Inertia::render('Central/Onboarding', [
            'user' => [
                'name' => $request->user()->name,
                'email' => $request->user()->email,
            ],
            'centralHost' => (string) (config('tenancy.tenant_base_domain') ?: 'localhost'),
            'settings' => Setting::getPublic()
                ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
                ->toArray(),
            'availablePlans' => $plans,
            'initialPlanKey' => $selectedPlanKey,
            'initialCompanyName' => $initialCompanyName,
            'initialSubdomain' => $initialSubdomain,
            'initialPhone' => $initialPhone,
            'initialCity' => $initialCity,
            'initialFleetSize' => $initialFleetSize,
            'initialRentalModel' => $initialRentalModel,
            'verticalOptions' => collect(SelfServeProvisioningPlan::verticals())
                ->map(fn (string $vertical): array => [
                    'key' => $vertical,
                    'label' => __("central.onboarding.verticals.{$vertical}"),
                    'description' => __("central.onboarding.verticals.{$vertical}_hint"),
                    'available' => SelfServeProvisioningPlan::isSelectableVertical($vertical),
                ])
                ->all(),
            'failedSession' => $session?->status === OnboardingSession::STATUS_FAILED
                ? [
                    'company_name' => $session->company_name,
                    'phone' => $session->phone,
                    'city' => $session->city,
                    'subdomain' => $session->subdomain,
                    'plan_key' => $session->plan_key,
                    'fleet_size' => $session->fleet_size,
                    'rental_model' => $session->rental_model,
                    'verticals' => array_values(array_filter(
                        $session->verticals ?? [],
                        SelfServeProvisioningPlan::isSelectableVertical(...),
                    )),
                    'error_message' => $session->error_message,
                ]
                : null,
        ]);
    }

    public function store(StoreOnboardingRequest $request): RedirectResponse
    {
        abort_if(tenancy()->initialized, 404);

        $existing = $this->sessionFor($request);
        if ($existing !== null && $existing->isAwaitingPayment()) {
            return redirect()->route('central.onboarding.payment');
        }

        if ($existing !== null && $existing->isInProgress()) {
            return redirect()->route('central.onboarding.status');
        }

        $user = $this->ensureUserHasGlobalId->execute($request->user());

        $verticals = array_values(array_unique($request->validated('verticals')));
        $subdomain = $request->validated('subdomain');
        $planKey = $request->validated('plan_key') ?? 'free';

        $plan = \App\Models\Plan::query()->firstWhere('key', $planKey);
        $isPaidWithoutTrial = $plan && (float) $plan->price > 0 && ((int) ($plan->trial_days ?? 0) <= 0) && ! $plan->is_trial;

        if ($isPaidWithoutTrial) {
            $session = OnboardingSession::query()->updateOrCreate(
                ['global_user_id' => $user->global_id],
                [
                    'company_name' => $request->validated('company_name'),
                    'phone' => $request->validated('phone'),
                    'city' => $request->validated('city'),
                    'subdomain' => $subdomain,
                    'verticals' => $verticals,
                    'fleet_size' => $request->validated('fleet_size'),
                    'rental_model' => $request->validated('rental_model'),
                    'plan_key' => $planKey,
                    'status' => OnboardingSession::STATUS_AWAITING_PAYMENT,
                    'tenant_id' => null,
                    'reseller_global_id' => $existing?->reseller_global_id
                        ?? ResellerAttribution::resolveFromRequest($request),
                    'error_message' => null,
                ],
            );

            $order = \App\Models\PaymentOrder::on('central')
                ->where('onboarding_session_id', $session->id)
                ->where('plan_id', $plan->id)
                ->whereIn('status', [\App\Models\PaymentOrder::STATUS_PENDING, \App\Models\PaymentOrder::STATUS_AWAITING_CONFIRMATION])
                ->latest()
                ->first();

            if (! $order) {
                app(\App\Services\PaymentOrderService::class)->createOnboardingOrder($session, $plan, 'month');
            }

            return redirect()->route('central.onboarding.payment');
        }

        // Reuse a half-provisioned tenant when retrying the same subdomain so
        // pack installs can finish without orphaning the previous attempt.
        $reuseTenantId = $existing?->status === OnboardingSession::STATUS_FAILED
            && $existing->tenant_id
            && $existing->subdomain === $subdomain
            ? $existing->tenant_id
            : null;

        $session = OnboardingSession::query()->updateOrCreate(
            ['global_user_id' => $user->global_id],
            [
                'company_name' => $request->validated('company_name'),
                'phone' => $request->validated('phone'),
                'city' => $request->validated('city'),
                'subdomain' => $subdomain,
                'verticals' => $verticals,
                'fleet_size' => $request->validated('fleet_size'),
                'rental_model' => $request->validated('rental_model'),
                'plan_key' => $planKey,
                'status' => OnboardingSession::STATUS_PENDING,
                'tenant_id' => $reuseTenantId,
                'reseller_global_id' => $existing?->reseller_global_id
                    ?? ResellerAttribution::resolveFromRequest($request),
                'error_message' => null,
            ],
        );

        ProvisionSelfServeTenantJob::dispatch($session->id);

        return redirect()->route('central.onboarding.status');
    }

    public function payment(Request $request): Response|RedirectResponse
    {
        abort_if(tenancy()->initialized, 404);

        $session = $this->sessionFor($request);

        if ($session === null) {
            return redirect()->route('central.onboarding.show');
        }

        if ($session->status === OnboardingSession::STATUS_READY && $session->tenant_id) {
            return redirect()->route('central.workspaces.enter', $session->tenant_id);
        }

        if (! $session->isAwaitingPayment()) {
            return redirect()->route('central.onboarding.status');
        }

        $order = \App\Models\PaymentOrder::on('central')
            ->where('onboarding_session_id', $session->id)
            ->with('plan')
            ->latest()
            ->first();

        if (! $order) {
            $plan = \App\Models\Plan::query()->firstWhere('key', $session->plan_key) ?? \App\Models\Plan::query()->active()->first();
            $order = app(\App\Services\PaymentOrderService::class)->createOnboardingOrder($session, $plan, 'month');
        }

        $instructions = config('payment.manual_transfer', []);

        return Inertia::render('Central/OnboardingPayment', [
            'session' => [
                'id' => $session->id,
                'status' => $session->status,
                'company_name' => $session->company_name,
                'subdomain' => $session->subdomain,
                'plan_key' => $session->plan_key,
                'verticals' => $session->verticals,
            ],
            'order' => [
                'id' => $order->id,
                'status' => $order->status,
                'amount' => (string) $order->amount,
                'unique_code' => $order->unique_code,
                'total_amount' => (string) $order->total_amount,
                'currency' => $order->currency,
                'billing_interval' => $order->billing_interval,
                'plan' => [
                    'id' => $order->plan->id,
                    'name' => $order->plan->name,
                    'price' => (string) $order->plan->price,
                ],
                'transfer_proof_path' => $order->transfer_proof_path,
                'proof_url' => $order->proof_url,
                'transfer_note' => $order->transfer_note,
                'expires_at' => $order->expires_at?->toIso8601String(),
            ],
            'instructions' => $instructions,
            'centralHost' => (string) (config('tenancy.tenant_base_domain') ?: 'localhost'),
            'settings' => Setting::getPublic()
                ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
                ->toArray(),
        ]);
    }

    public function submitPayment(Request $request): RedirectResponse
    {
        abort_if(tenancy()->initialized, 404);

        $session = $this->sessionFor($request);
        abort_unless($session !== null, 404);

        $order = \App\Models\PaymentOrder::on('central')
            ->where('onboarding_session_id', $session->id)
            ->whereIn('status', [\App\Models\PaymentOrder::STATUS_PENDING, \App\Models\PaymentOrder::STATUS_AWAITING_CONFIRMATION])
            ->latest()
            ->firstOrFail();

        $request->validate([
            'transfer_proof' => ['required', 'file', 'image', 'max:5120'],
            'transfer_note' => ['nullable', 'string', 'max:500'],
        ]);

        app(\App\Services\PaymentOrderService::class)->submitProof(
            $order,
            $request->file('transfer_proof'),
            $request->input('transfer_note')
        );

        return back()->with('success', 'Bukti transfer berhasil diunggah. Tim kami sedang memverifikasi pembayaran Anda.');
    }

    public function status(Request $request): Response|RedirectResponse
    {
        abort_if(tenancy()->initialized, 404);

        $session = $this->sessionFor($request);

        if ($session === null) {
            return redirect()->route('central.onboarding.show');
        }

        if ($session->status === OnboardingSession::STATUS_FAILED) {
            return redirect()->route('central.onboarding.show');
        }

        // Always render when ready (do not HTTP-redirect). Inertia XHR polls cannot
        // reliably follow workspaces.enter → redirect()->away() to the tenant domain;
        // the page hard-navigates via window.location using enterUrl instead.
        $preview = SelfServeProvisioningPlan::previewModules($session->verticals ?? []);

        return Inertia::render('Central/OnboardingStatus', [
            'session' => [
                'status' => $session->status,
                'company_name' => $session->company_name,
                'subdomain' => $session->subdomain,
                'verticals' => $session->verticals,
                'tenant_id' => $session->tenant_id,
                'error_message' => $session->error_message,
                'preview_modules' => $preview,
                'updated_at' => optional($session->updated_at)?->toIso8601String(),
            ],
            'enterUrl' => $session->status === OnboardingSession::STATUS_READY && $session->tenant_id
                ? route('central.workspaces.enter', $session->tenant_id)
                : null,
            'trialEndsAt' => $session->tenant?->trial_ends_at?->toIso8601String(),
            'centralHost' => (string) (config('tenancy.tenant_base_domain') ?: 'localhost'),
            'queueConnection' => config('queue.default'),
            'settings' => Setting::getPublic()
                ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
                ->toArray(),
        ]);
    }

    private function sessionFor(Request $request): ?OnboardingSession
    {
        $user = $this->ensureUserHasGlobalId->execute($request->user());

        return OnboardingSession::query()
            ->where('global_user_id', $user->global_id)
            ->first();
    }
}
