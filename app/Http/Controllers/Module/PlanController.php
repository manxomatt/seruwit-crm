<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePlanRequest;
use App\Http\Requests\UpdatePlanRequest;
use App\Models\Plan;
use App\Models\SubscriptionTier;
use App\Modules\Facades\Modules;
use App\Modules\ModuleContract;
use App\Modules\PlanRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Super admin CRUD over subscription plans.
 *
 * Central only — plans are a platform-wide definition. Editing a plan changes
 * what every tenant on it may install, and takes effect on their next request;
 * it never touches data, so narrowing a plan only locks modules rather than
 * destroying anything.
 */
class PlanController extends Controller
{
    public function __construct(private readonly PlanRepository $plans) {}

    public function index(): Response
    {
        return Inertia::render('Module/Plans/Index', [
            'plans' => Plan::query()
                ->ordered()
                ->get()
                ->map(fn (Plan $plan): array => [
                    'id' => $plan->id,
                    'key' => $plan->key,
                    'name' => $plan->name,
                    'description' => $plan->description,
                    'badge' => $plan->badge,
                    'is_popular' => (bool) $plan->is_popular,
                    'is_active' => (bool) $plan->is_active,
                    'modules' => $plan->modules ?? [],
                    'limits' => $plan->limits ?? [],
                    'features_list' => $plan->features_list ?? [],
                    'sort_order' => $plan->sort_order,
                    'is_default' => $plan->is_default,
                    'price' => $plan->price,
                    'original_price' => $plan->original_price,
                    'annual_price' => $plan->annual_price,
                    'annual_original_price' => $plan->annual_original_price,
                    'currency' => $plan->currency ?? 'IDR',
                    'trial_days' => $plan->trial_days,
                    'tenants' => $plan->tenantCount(),
                ])
                ->all(),
            // The registry is the menu a plan gets to sell from.
            'availableModules' => $this->availableModules(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Module/Plans/Create', [
            'nextSortOrder' => Plan::query()->max('sort_order') + 1,
            'availableModules' => $this->availableModules(),
            'subscriptionTiers' => SubscriptionTier::orderBy('min_vehicles')->get(['id', 'name', 'min_vehicles', 'max_vehicles', 'price_per_vehicle']),
        ]);
    }

    public function store(StorePlanRequest $request): RedirectResponse
    {
        $plan = DB::transaction(function () use ($request): Plan {
            $plan = Plan::query()->create([
                ...$request->validated(),
                'sort_order' => $request->integer('sort_order'),
            ]);

            $this->settleDefault($plan);

            return $plan;
        });

        return redirect()->route('module.plans.index')->with('success', __('plans.messages.created', ['name' => $plan->name]));
    }

    public function edit(Plan $plan): Response
    {
        return Inertia::render('Module/Plans/Edit', [
            'plan' => [
                'id' => $plan->id,
                'key' => $plan->key,
                'name' => $plan->name,
                'description' => $plan->description,
                'badge' => $plan->badge,
                'is_popular' => (bool) $plan->is_popular,
                'is_active' => (bool) $plan->is_active,
                'modules' => $plan->modules ?? [],
                'limits' => $plan->limits ?? [],
                'features_list' => $plan->features_list ?? [],
                'sort_order' => $plan->sort_order,
                'is_default' => $plan->is_default,
                'price' => $plan->price,
                'original_price' => $plan->original_price,
                'annual_price' => $plan->annual_price,
                'annual_original_price' => $plan->annual_original_price,
                'currency' => $plan->currency ?? 'IDR',
                'trial_days' => $plan->trial_days,
                'pricing_model' => $plan->pricing_model,
                'subscription_tier_id' => $plan->subscription_tier_id,
                'allow_payg_upgrade' => (bool) $plan->allow_payg_upgrade,
                'include_trial' => (bool) $plan->include_trial,
                'trial_duration_days' => $plan->trial_duration_days,
                'tenants' => $plan->tenantCount(),
            ],
            'availableModules' => $this->availableModules(),
            'subscriptionTiers' => SubscriptionTier::orderBy('min_vehicles')->get(['id', 'name', 'min_vehicles', 'max_vehicles', 'price_per_vehicle']),
        ]);
    }

    public function update(UpdatePlanRequest $request, Plan $plan): RedirectResponse
    {
        DB::transaction(function () use ($request, $plan): void {
            $plan->update([
                ...$request->validated(),
                'sort_order' => $request->integer('sort_order'),
            ]);

            $this->settleDefault($plan);
        });

        return redirect()->route('module.plans.index')->with('success', __('plans.messages.updated', ['name' => $plan->name]));
    }

    public function destroy(Plan $plan): RedirectResponse
    {
        // Tenants point at a plan by key, so deleting one out from under them
        // would leave them entitled to nothing at all.
        if (($count = $plan->tenantCount()) > 0) {
            return back()->with('error', __('plans.messages.delete_in_use', [
                'name' => $plan->name,
                'count' => $count,
            ]));
        }

        if ($plan->is_default) {
            return back()->with('error', __('plans.messages.delete_default'));
        }

        $plan->delete();

        return back()->with('success', __('plans.messages.deleted', ['name' => $plan->name]));
    }

    /**
     * Keep exactly one default.
     *
     * A tenant with no plan of its own falls back to the default, so two would be
     * ambiguous and none would leave those tenants entitled to nothing.
     */
    private function settleDefault(Plan $plan): void
    {
        if ($plan->is_default) {
            Plan::query()->whereKeyNot($plan->id)->update(['is_default' => false]);

            $this->plans->flush();

            return;
        }

        if (! Plan::query()->where('is_default', true)->exists()) {
            $plan->forceFill(['is_default' => true])->save();
        }
    }

    /**
     * Build the available optional modules catalog for plans.
     *
     * Core modules (such as partners, accounting, users, settings) ship with
     * every tenant unconditionally and cannot be selected or omitted from plans,
     * so requirements are filtered to only include non-core, registered modules.
     *
     * @return list<array<string, mixed>>
     */
    private function availableModules(): array
    {
        return collect(Modules::all())
            ->map(fn (ModuleContract $module): array => [
                'key' => $module->key(),
                'label' => $module->label(),
                'description' => $module->description(),
                'tier' => $module->tier()->value,
                'is_enabled' => Modules::platformEnabled($module->key()),
                'requires' => array_values(array_filter(
                    $module->requires(),
                    fn (string $key): bool => Modules::has($key),
                )),
            ])
            ->values()
            ->all();
    }
}
