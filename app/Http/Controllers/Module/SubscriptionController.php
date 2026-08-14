<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\SubscriptionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function __construct(private readonly SubscriptionService $service) {}

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
            ->ordered()
            ->get();

        $tenantId = (string) $tenant->getKey();
        $subscription = Subscription::on('central')->where('tenant_id', $tenantId)->first();

        return Inertia::render('Modules/Subscription/Activate', [
            'tenant' => [
                'id' => $tenantId,
                'name' => $tenant->name,
                'status' => $tenant->status,
                'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
                'is_on_trial' => $tenant->isOnTrial ?? false,
            ],
            'plans' => $plans,
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'plan' => $subscription->plan?->name,
            ] : null,
            'isOnTrial' => $tenant->isOnTrial ?? false,
            'trialEndsAt' => $tenant->trial_ends_at?->toIso8601String(),
        ]);
    }

    public function activate(Request $request): RedirectResponse
    {
        $tenant = tenant();
        abort_unless($tenant instanceof Tenant, 404);

        $request->validate([
            'plan_id' => ['required', 'integer'],
        ]);

        $plan = Plan::on('central')->findOrFail($request->input('plan_id'));

        if ($plan->is_trial) {
            return back()->withErrors(['plan_id' => 'Invalid plan selected.']);
        }

        $this->service->activate($tenant, $plan);

        return back()->with('success', __('central.subscription.success'));
    }
}
