<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Tenant;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function show(Request $request, Tenant $tenant): Response
    {
        $this->authorizeTenant($request, $tenant);

        $plans = Plan::query()
            ->where(function ($query) {
                $query->where('is_trial', false)
                    ->where('key', '!=', Plan::KEY_TRIAL);
            })
            ->ordered()
            ->get();

        $subscription = $tenant->subscription;

        return Inertia::render('Central/Subscription/Activate', [
            'tenant' => $tenant,
            'plans' => $plans,
            'subscription' => $subscription,
            'trialEndsAt' => $tenant->trial_ends_at?->toIso8601String(),
            'isOnTrial' => $tenant->isOnTrial ?? false,
        ]);
    }

    public function activate(Request $request, Tenant $tenant, SubscriptionService $service)
    {
        $this->authorizeTenant($request, $tenant);

        $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);

        $plan = Plan::findOrFail($request->plan_id);

        if ($plan->is_trial) {
            return back()->withErrors(['plan_id' => 'Tidak dapat mengaktivasi plan trial.']);
        }

        $service->activate($tenant, $plan);

        return redirect()
            ->route('central.workspaces.index')
            ->with('success', 'Paket berhasil diaktifkan.');
    }

    private function authorizeTenant(Request $request, Tenant $tenant): void
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return;
        }

        if ($user->hasRole('reseller') && $tenant->reseller_global_id === $user->global_id) {
            return;
        }

        $isOwner = $tenant->users()->where('global_user_id', $user->global_id)->exists();

        if (! $isOwner) {
            abort(403);
        }
    }
}
