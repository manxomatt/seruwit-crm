<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePlanRequest;
use App\Http\Requests\UpdatePlanRequest;
use App\Models\Plan;
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
                    'modules' => $plan->modules ?? [],
                    'sort_order' => $plan->sort_order,
                    'is_default' => $plan->is_default,
                    'tenants' => $plan->tenantCount(),
                ])
                ->all(),
            // The registry is the menu a plan gets to sell from.
            'availableModules' => collect(Modules::all())
                ->map(fn (ModuleContract $module): array => [
                    'key' => $module->key(),
                    'label' => $module->label(),
                    'description' => $module->description(),
                ])
                ->values()
                ->all(),
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

        return back()->with('success', "Paket {$plan->name} dibuat.");
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

        return back()->with(
            'success',
            "Paket {$plan->name} diperbarui. Perubahan berlaku untuk semua tenant di paket ini.",
        );
    }

    public function destroy(Plan $plan): RedirectResponse
    {
        // Tenants point at a plan by key, so deleting one out from under them
        // would leave them entitled to nothing at all.
        if (($count = $plan->tenantCount()) > 0) {
            return back()->with(
                'error',
                "Paket {$plan->name} masih dipakai {$count} tenant. Pindahkan mereka dulu sebelum menghapusnya.",
            );
        }

        if ($plan->is_default) {
            return back()->with(
                'error',
                'Paket default tidak bisa dihapus. Tetapkan paket lain sebagai default dulu.',
            );
        }

        $plan->delete();

        return back()->with('success', "Paket {$plan->name} dihapus.");
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
}
