<?php

namespace Modules\Routing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Inventory\Models\Warehouse;
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
            ->with(['creator:id,name', 'warehouse:id,name,kind'])
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
        $warehouses = $this->outboundWarehouses();
        $warehouseId = $request->integer('warehouse_id') ?: (int) ($warehouses->first()?->id ?? 0);
        $warehouse = $warehouseId > 0
            ? $warehouses->firstWhere('id', $warehouseId)
            : null;

        if ($warehouse === null && $warehouses->isNotEmpty()) {
            $warehouse = $warehouses->first();
            $warehouseId = (int) $warehouse->id;
        }

        $orders = $warehouse !== null
            ? $this->ordersForWarehouse($warehouse, $date)
            : collect();

        return Inertia::render('Modules/Routing/Plans/Create', [
            'warehouses' => $warehouses->map(fn (Warehouse $row): array => [
                'id' => $row->id,
                'name' => $row->name,
                'kind' => $row->kind?->value ?? 'warehouse',
                'location' => $row->location,
                'latitude' => $row->latitude !== null ? (float) $row->latitude : null,
                'longitude' => $row->longitude !== null ? (float) $row->longitude : null,
                'has_coords' => $row->latitude !== null && $row->longitude !== null,
            ])->values()->all(),
            'defaults' => [
                'warehouse_id' => $warehouseId > 0 ? $warehouseId : null,
                'planned_date' => $date,
                'objective' => RoutePlan::OBJECTIVE_FUEL_COST,
                'depot_address' => $warehouse
                    ? trim($warehouse->name.($warehouse->location ? ' — '.$warehouse->location : ''))
                    : '',
                'depot_lat' => $warehouse?->latitude !== null ? (float) $warehouse->latitude : null,
                'depot_lng' => $warehouse?->longitude !== null ? (float) $warehouse->longitude : null,
            ],
            'orders' => $orders->map(fn (DeliveryOrder $order): array => [
                'id' => $order->id,
                'code' => $order->code,
                'delivery_address' => $order->delivery_address,
                'delivery_lat' => $order->delivery_lat,
                'delivery_lng' => $order->delivery_lng,
                'demand_kg' => $order->demand_kg,
                'from_gin' => $order->goods_issue_note_id !== null,
                'partner' => $order->partner
                    ? ['id' => $order->partner->id, 'name' => $order->partner->name]
                    : null,
            ])->values()->all(),
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
        $warehouse = Warehouse::query()->findOrFail($data['warehouse_id']);

        $plan = RoutePlan::query()->create([
            'code' => RoutePlan::nextCode(),
            'status' => RoutePlan::STATUS_DRAFT,
            'objective' => $data['objective'],
            'planned_date' => $data['planned_date'],
            'warehouse_id' => $warehouse->id,
            'depot_address' => $data['depot_address']
                ?: trim($warehouse->name.($warehouse->location ? ' — '.$warehouse->location : '')),
            'depot_lat' => $data['depot_lat'] ?? $warehouse->latitude,
            'depot_lng' => $data['depot_lng'] ?? $warehouse->longitude,
            'created_by' => $request->user()?->id,
            'params' => [
                'delivery_order_ids' => $data['delivery_order_ids'] ?? null,
                'warehouse_id' => $warehouse->id,
            ],
        ]);

        $optimizer->optimize($plan, $data['delivery_order_ids'] ?? null);

        return redirect()
            ->route('module.routing.plans.show', $plan)
            ->with('success', __('routing.messages.plan_optimized', ['code' => $plan->code]));
    }

    public function show(Request $request, RoutePlan $plan): Response
    {
        $plan->load([
            'creator:id,name',
            'warehouse:id,name,kind,location',
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
            return back()->with('error', __('routing.errors.cannot_reoptimize'));
        }

        $ids = $plan->params['delivery_order_ids'] ?? null;
        $optimizer->optimize($plan, is_array($ids) ? $ids : null);

        return back()->with('success', __('routing.messages.plan_re_optimized'));
    }

    public function apply(RoutePlan $plan, RoutePlanApplier $applier): RedirectResponse
    {
        try {
            $applier->apply($plan);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', __('routing.messages.trips_created'));
    }

    public function cancel(RoutePlan $plan): RedirectResponse
    {
        if ($plan->status === RoutePlan::STATUS_APPLIED) {
            return back()->with('error', __('routing.errors.applied_cannot_cancel'));
        }

        $plan->update(['status' => RoutePlan::STATUS_CANCELLED]);

        return back()->with('success', __('routing.messages.plan_cancelled'));
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
            return back()->with('error', __('routing.errors.only_optimized_editable'));
        }

        $routePlanRoute->update($request->validated());

        return back()->with('success', __('routing.messages.route_assignment_updated'));
    }

    /**
     * Active warehouses/stores that can ship outbound (excludes showroom).
     *
     * @return Collection<int, Warehouse>
     */
    private function outboundWarehouses(): Collection
    {
        return Warehouse::query()
            ->salesOutbound()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'kind', 'location', 'latitude', 'longitude', 'status']);
    }

    /**
     * Confirmed DOs for the date that belong to this warehouse (via GIN) or
     * are manual (no GIN) and thus can leave from the selected depot.
     *
     * @return Collection<int, DeliveryOrder>
     */
    private function ordersForWarehouse(Warehouse $warehouse, string $date): Collection
    {
        return DeliveryOrder::query()
            ->with('partner:id,name')
            ->where('status', DeliveryOrder::STATUS_CONFIRMED)
            ->whereDate('order_date', $date)
            ->where(function ($query) use ($warehouse): void {
                $query
                    ->whereHas('goodsIssueNote', fn ($gin) => $gin->where('warehouse_id', $warehouse->id))
                    ->orWhereNull('goods_issue_note_id');
            })
            ->orderBy('id')
            ->get([
                'id',
                'code',
                'partner_id',
                'goods_issue_note_id',
                'delivery_address',
                'delivery_lat',
                'delivery_lng',
                'demand_kg',
                'order_date',
            ]);
    }
}
