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

        if ($session !== null && $session->isInProgress()) {
            return redirect()->route('central.onboarding.status');
        }

        if ($session?->status === OnboardingSession::STATUS_READY && $session->tenant_id) {
            return redirect()->route('central.workspaces.enter', $session->tenant_id);
        }

        if (! $this->postAuthDestination->needsWorkspaceOnboarding($request->user())) {
            return redirect()->to($this->postAuthDestination->url($request->user()));
        }

        return Inertia::render('Central/Onboarding', [
            'user' => [
                'name' => $request->user()->name,
                'email' => $request->user()->email,
            ],
            'centralHost' => (string) (config('tenancy.tenant_base_domain') ?: 'localhost'),
            'settings' => Setting::getPublic()
                ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
                ->toArray(),
            'verticalOptions' => [
                [
                    'key' => SelfServeProvisioningPlan::VERTICAL_RENTAL,
                    'label' => __('central.onboarding.verticals.rental'),
                    'description' => __('central.onboarding.verticals.rental_hint'),
                ],
                [
                    'key' => SelfServeProvisioningPlan::VERTICAL_TRAVEL,
                    'label' => __('central.onboarding.verticals.travel'),
                    'description' => __('central.onboarding.verticals.travel_hint'),
                ],
            ],
            'failedSession' => $session?->status === OnboardingSession::STATUS_FAILED
                ? [
                    'company_name' => $session->company_name,
                    'subdomain' => $session->subdomain,
                    'verticals' => $session->verticals,
                    'error_message' => $session->error_message,
                ]
                : null,
        ]);
    }

    public function store(StoreOnboardingRequest $request): RedirectResponse
    {
        abort_if(tenancy()->initialized, 404);

        $existing = $this->sessionFor($request);
        if ($existing !== null && $existing->isInProgress()) {
            return redirect()->route('central.onboarding.status');
        }

        $user = $this->ensureUserHasGlobalId->execute($request->user());

        $verticals = array_values(array_unique($request->validated('verticals')));
        $subdomain = $request->validated('subdomain');

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
                'subdomain' => $subdomain,
                'verticals' => $verticals,
                'status' => OnboardingSession::STATUS_PENDING,
                'tenant_id' => $reuseTenantId,
                'error_message' => null,
            ],
        );

        ProvisionSelfServeTenantJob::dispatch($session->id);

        return redirect()->route('central.onboarding.status');
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
