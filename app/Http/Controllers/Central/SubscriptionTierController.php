<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionTier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionTierController extends Controller
{
    /**
     * Show tier management page.
     */
    public function index(): Response
    {
        $tiers = SubscriptionTier::orderBy('min_vehicles')->get();

        return Inertia::render('Central/SubscriptionTier/Index', [
            'tiers' => $tiers->map(fn ($tier) => [
                'id' => $tier->id,
                'name' => $tier->name,
                'min_vehicles' => $tier->min_vehicles,
                'max_vehicles' => $tier->max_vehicles,
                'price_per_vehicle' => $tier->price_per_vehicle,
                'created_at' => $tier->created_at->format('Y-m-d'),
            ]),
        ]);
    }

    /**
     * Show create form.
     */
    public function create(): Response
    {
        return Inertia::render('Central/SubscriptionTier/Form', [
            'tier' => null,
        ]);
    }

    /**
     * Store new tier.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'min_vehicles' => 'required|integer|min:1',
            'max_vehicles' => 'required|integer|gt:min_vehicles',
            'price_per_vehicle' => 'required|numeric|min:0',
        ]);

        SubscriptionTier::create($validated);

        return redirect()
            ->route('central.subscription-tiers.index')
            ->with('success', 'Subscription tier created successfully.');
    }

    /**
     * Show edit form.
     */
    public function edit(SubscriptionTier $tier): Response
    {
        return Inertia::render('Central/SubscriptionTier/Form', [
            'tier' => [
                'id' => $tier->id,
                'name' => $tier->name,
                'min_vehicles' => $tier->min_vehicles,
                'max_vehicles' => $tier->max_vehicles,
                'price_per_vehicle' => $tier->price_per_vehicle,
            ],
        ]);
    }

    /**
     * Update tier.
     */
    public function update(Request $request, SubscriptionTier $tier): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'min_vehicles' => 'required|integer|min:1',
            'max_vehicles' => 'required|integer|gt:min_vehicles',
            'price_per_vehicle' => 'required|numeric|min:0',
        ]);

        $tier->update($validated);

        return redirect()
            ->route('central.subscription-tiers.index')
            ->with('success', 'Subscription tier updated successfully.');
    }

    /**
     * Delete tier.
     */
    public function destroy(SubscriptionTier $tier): RedirectResponse
    {
        $tier->delete();

        return redirect()
            ->route('central.subscription-tiers.index')
            ->with('success', 'Subscription tier deleted successfully.');
    }

    /**
     * Get pricing calculator data (API).
     */
    public function priceCalculator(Request $request)
    {
        $vehicleCount = $request->get('vehicles', 1);
        $interval = $request->get('interval', 'month');

        $breakdown = SubscriptionTier::priceBreakdown($vehicleCount, $interval);

        return response()->json($breakdown);
    }

    /**
     * Show unified billing dashboard (Plans + Tiers).
     */
    public function billingDashboard(): Response
    {
        $tiers = SubscriptionTier::orderBy('min_vehicles')->get();

        $tiersData = $tiers->map(fn ($tier) => [
            'id' => $tier->id,
            'name' => $tier->name,
            'min_vehicles' => $tier->min_vehicles,
            'max_vehicles' => $tier->max_vehicles,
            'price_per_vehicle' => $tier->price_per_vehicle,
            'created_at' => $tier->created_at->format('Y-m-d'),
        ]);

        // Get plans data
        $plans = \App\Models\Plan::where('is_active', true)->orderBy('sort_order')->get();

        $plansData = $plans->map(fn ($plan) => [
            'id' => $plan->id,
            'name' => $plan->name,
            'description' => $plan->description,
            'price' => $plan->price,
            'annual_price' => $plan->annual_price,
            'is_popular' => $plan->is_popular ?? false,
            'modules_count' => count($plan->modules ?? []),
            'tenants_count' => $plan->tenants_count ?? 0,
            'trial_days' => $plan->trial_days,
        ]);

        return Inertia::render('Module/Billing/Dashboard', [
            'tiers' => $tiersData,
            'plans' => $plansData,
            'stats' => [
                'total_tiers' => $tiersData->count(),
                'total_plans' => $plansData->count(),
                'total_tenants_on_plans' => $plansData->sum('tenants_count'),
            ],
        ]);
    }
}
