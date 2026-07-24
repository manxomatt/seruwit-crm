<?php

namespace Modules\Routing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Routing\Http\Requests\StoreRoutePlanRequest;
use Modules\Routing\Http\Requests\UpdateRoutePlanRouteRequest;
use Modules\Routing\Models\RoutePlan;
use Modules\Routing\Models\RoutePlanRoute;
use Modules\Routing\Support\RouteOptimizationService;
use Modules\Routing\Support\RoutePlanApplier;
use RuntimeException;

class RoutePlanController extends Controller
{
    public function index(Request $request): Response
    {
        $plans = RoutePlan::query()
            ->with('creator:id,name')
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Routing/Plans/Index', [
            'plans' => $plans,
            'filters' => [
                'status' => $request->string('status')->toString() ?: null,
            ],
            'can' => [
                'create' => $request->user()?->hasPermissionFor('routing', 'create') ?? false,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $date = $request->date('planned_date')?->toDateString() ?? now()->toDateString();

        $orders = DeliveryOrder::query()
            ->with('partner:id,name')
            ->where('status', DeliveryOrder::STATUS_CONFIRMED)
            ->whereDate('order_date', $date)
            ->orderBy('id')
            ->get(['id', 'code', 'partner_id', 'delivery_address', 'delivery_lat', 'delivery_lng', 'demand_kg', 'order_date']);

        return Inertia::render('Modules/Routing/Plans/Create', [
            'defaults' => [
                'planned_date' => $date,
                'objective' => RoutePlan::OBJECTIVE_FUEL_COST,
                'depot_address' => 'Depot',
                'depot_lat' => -6.2088000,
                'depot_lng' => 106.8456000,
            ],
            'orders' => $orders,
            'eligible_counts' => [
                'geocoded' => $orders->filter(fn (DeliveryOrder $o): bool => $o->delivery_lat !== null && $o->delivery_lng !== null)->count(),
                'missing_coords' => $orders->filter(fn (DeliveryOrder $o): bool => $o->delivery_lat === null || $o->delivery_lng === null)->count(),
                'vehicles' => Vehicle::query()->where('status', Vehicle::STATUS_ACTIVE)->count(),
                'drivers' => Driver::query()->where('status', Driver::STATUS_AVAILABLE)->count(),
            ],
        ]);
    }

    public function store(StoreRoutePlanRequest $request, RouteOptimizationService $optimizer): RedirectResponse
    {
        $data = $request->validated();

        $plan = RoutePlan::query()->create([
            'code' => RoutePlan::nextCode(),
            'status' => RoutePlan::STATUS_DRAFT,
            'objective' => $data['objective'],
            'planned_date' => $data['planned_date'],
            'depot_address' => $data['depot_address'] ?? null,
            'depot_lat' => $data['depot_lat'],
            'depot_lng' => $data['depot_lng'],
            'created_by' => $request->user()?->id,
            'params' => [
                'delivery_order_ids' => $data['delivery_order_ids'] ?? null,
            ],
        ]);

        $optimizer->optimize($plan, $data['delivery_order_ids'] ?? null);

        return redirect()
            ->route('module.routing.plans.show', $plan)
            ->with('success', "Plan {$plan->code} optimized.");
    }

    public function show(Request $request, RoutePlan $plan): Response
    {
        $plan->load([
            'creator:id,name',
            'routes.vehicle:id,name,plate_number,capacity_kg,cost_per_km',
            'routes.driver:id,name',
            'routes.stops.deliveryOrder:id,code,partner_id',
            'routes.stops.deliveryOrder.partner:id,name',
        ]);

        return Inertia::render('Modules/Routing/Plans/Show', [
            'plan' => $plan,
            'vehicles' => Vehicle::query()
                ->where('status', Vehicle::STATUS_ACTIVE)
                ->orderBy('name')
                ->get(['id', 'name', 'plate_number', 'capacity_kg', 'cost_per_km']),
            'drivers' => Driver::query()
                ->where('status', Driver::STATUS_AVAILABLE)
                ->orderBy('name')
                ->get(['id', 'name']),
            'can' => [
                'optimize' => $request->user()?->hasPermissionFor('routing', 'optimize') ?? false,
                'apply' => $request->user()?->hasPermissionFor('routing', 'apply') ?? false,
                'update' => $request->user()?->hasPermissionFor('routing', 'update') ?? false,
                'delete' => $request->user()?->hasPermissionFor('routing', 'delete') ?? false,
            ],
        ]);
    }

    public function optimize(RoutePlan $plan, RouteOptimizationService $optimizer): RedirectResponse
    {
        if (in_array($plan->status, [RoutePlan::STATUS_APPLIED, RoutePlan::STATUS_CANCELLED], true)) {
            return back()->with('error', 'Cannot re-optimize an applied or cancelled plan.');
        }

        $ids = $plan->params['delivery_order_ids'] ?? null;
        $optimizer->optimize($plan, is_array($ids) ? $ids : null);

        return back()->with('success', 'Plan re-optimized.');
    }

    public function apply(RoutePlan $plan, RoutePlanApplier $applier): RedirectResponse
    {
        try {
            $applier->apply($plan);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Trips created and delivery orders assigned.');
    }

    public function cancel(RoutePlan $plan): RedirectResponse
    {
        if ($plan->status === RoutePlan::STATUS_APPLIED) {
            return back()->with('error', 'An applied plan cannot be cancelled.');
        }

        $plan->update(['status' => RoutePlan::STATUS_CANCELLED]);

        return back()->with('success', 'Plan cancelled.');
    }

    public function updateRoute(
        UpdateRoutePlanRouteRequest $request,
        RoutePlan $plan,
        RoutePlanRoute $routePlanRoute,
    ): RedirectResponse {
        if ($routePlanRoute->route_plan_id !== $plan->id) {
            abort(404);
        }

        if ($plan->status !== RoutePlan::STATUS_OPTIMIZED) {
            return back()->with('error', 'Only optimized plans can be edited.');
        }

        $routePlanRoute->update($request->validated());

        return back()->with('success', 'Route assignment updated.');
    }
}
