<?php

namespace Modules\ExecutiveDashboard\Support;

use App\Modules\Facades\Modules;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;
use Modules\Billing\Models\OrderCharge;
use Modules\Fleet\Models\Vehicle;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockMovement;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Product\Models\Product;
use Modules\Receivables\Support\AgingReport;
use Modules\Routing\Models\RoutePlan;
use Modules\Routing\Models\RoutePlanRoute;
use Modules\TransportationManagement\Models\Trip;

/**
 * Aggregates executive KPIs from installed modules. Each metric is soft-gated
 * via Modules::available() so missing modules yield null sections, not errors.
 */
class ExecutiveMetricsAggregator
{
    /**
     * @param  array{start: Carbon, end: Carbon, previous_start: Carbon, previous_end: Carbon}  $range
     * @return array<string, mixed>
     */
    public function build(array $range): array
    {
        return [
            'otd' => $this->otdRate($range),
            'fleet_utilization' => $this->fleetUtilization($range),
            'aging_ar' => $this->agingAr(),
            'inventory_turnover' => $this->inventoryTurnover($range),
            'revenue_per_route' => $this->revenuePerRoute($range),
        ];
    }

    /**
     * @param  array{start: Carbon, end: Carbon, previous_start: Carbon, previous_end: Carbon}  $range
     * @return array<string, mixed>|null
     */
    public function otdRate(array $range): ?array
    {
        if (! Modules::available('orders') || ! Schema::hasTable('delivery_orders')) {
            return null;
        }

        $current = $this->otdForPeriod($range['start'], $range['end']);
        $previous = $this->otdForPeriod($range['previous_start'], $range['previous_end']);

        return [
            'rate' => $current['rate'],
            'on_time' => $current['on_time'],
            'with_sla' => $current['with_sla'],
            'late' => $current['late'],
            'delivered' => $current['delivered'],
            'previous_rate' => $previous['rate'],
            'available' => true,
        ];
    }

    /**
     * @return array{rate: float|null, on_time: int, with_sla: int, late: int, delivered: int}
     */
    private function otdForPeriod(Carbon $start, Carbon $end): array
    {
        $delivered = DeliveryOrder::query()
            ->where('status', DeliveryOrder::STATUS_DELIVERED)
            ->whereBetween('delivered_at', [$start, $end])
            ->count();

        $withSla = DeliveryOrder::query()
            ->where('status', DeliveryOrder::STATUS_DELIVERED)
            ->whereBetween('delivered_at', [$start, $end])
            ->whereNotNull('promised_at')
            ->count();

        $onTime = DeliveryOrder::query()
            ->where('status', DeliveryOrder::STATUS_DELIVERED)
            ->whereBetween('delivered_at', [$start, $end])
            ->whereNotNull('promised_at')
            ->whereColumn('delivered_at', '<=', 'promised_at')
            ->count();

        $late = max(0, $withSla - $onTime);

        return [
            'rate' => $withSla > 0 ? round(($onTime / $withSla) * 100, 1) : null,
            'on_time' => $onTime,
            'with_sla' => $withSla,
            'late' => $late,
            'delivered' => $delivered,
        ];
    }

    /**
     * Trip-day utilization: distinct (vehicle, calendar day) with a trip ÷
     * (active vehicles × days in period).
     *
     * @param  array{start: Carbon, end: Carbon, previous_start: Carbon, previous_end: Carbon}  $range
     * @return array<string, mixed>|null
     */
    public function fleetUtilization(array $range): ?array
    {
        if (! Modules::available('fleet') || ! Schema::hasTable('vehicles')) {
            return null;
        }

        $activeVehicles = Vehicle::query()->where('status', Vehicle::STATUS_ACTIVE)->count();
        $vehiclesTotal = Vehicle::query()->count();

        if (! Modules::available('transportation') || ! Schema::hasTable('trips')) {
            return [
                'rate' => null,
                'active_vehicles' => $activeVehicles,
                'vehicles_total' => $vehiclesTotal,
                'trip_days' => 0,
                'capacity_days' => 0,
                'previous_rate' => null,
                'available' => true,
                'note' => 'Install Transportation to measure trip-day utilization.',
            ];
        }

        $current = $this->utilizationForPeriod($range['start'], $range['end'], $activeVehicles);
        $previous = $this->utilizationForPeriod($range['previous_start'], $range['previous_end'], $activeVehicles);

        return [
            'rate' => $current['rate'],
            'active_vehicles' => $activeVehicles,
            'vehicles_total' => $vehiclesTotal,
            'trip_days' => $current['trip_days'],
            'capacity_days' => $current['capacity_days'],
            'previous_rate' => $previous['rate'],
            'available' => true,
        ];
    }

    /**
     * @return array{rate: float|null, trip_days: int, capacity_days: int}
     */
    private function utilizationForPeriod(Carbon $start, Carbon $end, int $activeVehicles): array
    {
        $days = max(1, (int) $start->copy()->startOfDay()->diffInDays($end->copy()->startOfDay()) + 1);
        $capacityDays = $activeVehicles * $days;

        $tripDays = Trip::query()
            ->whereIn('status', [
                Trip::STATUS_SCHEDULED,
                Trip::STATUS_IN_PROGRESS,
                Trip::STATUS_COMPLETED,
            ])
            ->whereNotNull('vehicle_id')
            ->whereBetween('scheduled_at', [$start, $end])
            ->get(['vehicle_id', 'scheduled_at'])
            ->map(fn (Trip $trip): string => $trip->vehicle_id.'|'.$trip->scheduled_at->toDateString())
            ->unique()
            ->count();

        return [
            'rate' => $capacityDays > 0 ? round(min(100, ($tripDays / $capacityDays) * 100), 1) : null,
            'trip_days' => $tripDays,
            'capacity_days' => $capacityDays,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function agingAr(): ?array
    {
        if (! Modules::available('receivables') || ! Modules::available('invoicing') || ! Schema::hasTable('invoices')) {
            return null;
        }

        $report = AgingReport::build();
        $outstanding = round(array_sum($report['buckets']), 2);

        return [
            'buckets' => $report['buckets'],
            'overdue_count' => $report['overdue_count'],
            'overdue_amount' => $report['overdue_amount'],
            'outstanding' => $outstanding,
            'available' => true,
        ];
    }

    /**
     * COGS proxy (outbound stock × product cost) ÷ current inventory value.
     *
     * @param  array{start: Carbon, end: Carbon, previous_start: Carbon, previous_end: Carbon}  $range
     * @return array<string, mixed>|null
     */
    public function inventoryTurnover(array $range): ?array
    {
        if (! Modules::available('inventory') || ! Schema::hasTable('stock_movements') || ! Schema::hasTable('stock_levels')) {
            return null;
        }

        if (! Modules::available('products') || ! Schema::hasTable('products')) {
            return null;
        }

        $current = $this->turnoverForPeriod($range['start'], $range['end']);
        $previous = $this->turnoverForPeriod($range['previous_start'], $range['previous_end']);

        return [
            'turnover' => $current['turnover'],
            'cogs' => $current['cogs'],
            'inventory_value' => $current['inventory_value'],
            'out_qty' => $current['out_qty'],
            'previous_turnover' => $previous['turnover'],
            'available' => true,
        ];
    }

    /**
     * @return array{turnover: float|null, cogs: float, inventory_value: float, out_qty: float}
     */
    private function turnoverForPeriod(Carbon $start, Carbon $end): array
    {
        $outs = StockMovement::query()
            ->where('type', 'out')
            ->whereBetween('recorded_at', [$start, $end])
            ->get(['product_id', 'quantity']);

        $productIds = $outs->pluck('product_id')->unique()->filter()->values();
        $costs = Product::query()
            ->whereIn('id', $productIds)
            ->pluck('cost', 'id');

        $cogs = 0.0;
        $outQty = 0.0;

        foreach ($outs as $movement) {
            $qty = (float) $movement->quantity;
            $outQty += $qty;
            $cogs += $qty * (float) ($costs[$movement->product_id] ?? 0);
        }

        $inventoryValue = (float) StockLevel::query()
            ->join('products', 'products.id', '=', 'stock_levels.product_id')
            ->selectRaw('coalesce(sum(stock_levels.on_hand * coalesce(products.cost, 0)), 0) as value')
            ->value('value');

        $cogs = round($cogs, 2);
        $inventoryValue = round($inventoryValue, 2);

        return [
            'turnover' => $inventoryValue > 0 ? round($cogs / $inventoryValue, 2) : null,
            'cogs' => $cogs,
            'inventory_value' => $inventoryValue,
            'out_qty' => round($outQty, 2),
        ];
    }

    /**
     * Revenue (OrderCharge) attributed to applied route-plan routes in the period.
     *
     * @param  array{start: Carbon, end: Carbon, previous_start: Carbon, previous_end: Carbon}  $range
     * @return array<string, mixed>|null
     */
    public function revenuePerRoute(array $range): ?array
    {
        if (! Modules::available('routing') || ! Schema::hasTable('route_plans')) {
            return null;
        }

        $current = $this->routeRevenueForPeriod($range['start'], $range['end']);
        $previous = $this->routeRevenueForPeriod($range['previous_start'], $range['previous_end']);

        return [
            'average' => $current['average'],
            'total_revenue' => $current['total_revenue'],
            'route_count' => $current['route_count'],
            'previous_average' => $previous['average'],
            'routes' => $current['routes'],
            'billing_available' => Modules::available('billing') && Schema::hasTable('order_charges'),
            'available' => true,
        ];
    }

    /**
     * @return array{average: float|null, total_revenue: float, route_count: int, routes: list<array<string, mixed>>}
     */
    private function routeRevenueForPeriod(Carbon $start, Carbon $end): array
    {
        $plans = RoutePlan::query()
            ->where('status', RoutePlan::STATUS_APPLIED)
            ->where(function ($query) use ($start, $end): void {
                $query->whereBetween('planned_date', [$start->toDateString(), $end->toDateString()])
                    ->orWhereBetween('applied_at', [$start, $end]);
            })
            ->with(['routes.stops:id,route_plan_route_id,delivery_order_id', 'routes.vehicle:id,plate_number'])
            ->orderByDesc('planned_date')
            ->limit(50)
            ->get();

        $billingOn = Modules::available('billing') && Schema::hasTable('order_charges');
        $routes = [];
        $totalRevenue = 0.0;

        foreach ($plans as $plan) {
            foreach ($plan->routes as $route) {
                /** @var RoutePlanRoute $route */
                $orderIds = $route->stops->pluck('delivery_order_id')->filter()->unique()->values();
                $revenue = 0.0;

                if ($billingOn && $orderIds->isNotEmpty()) {
                    $revenue = (float) OrderCharge::query()
                        ->whereIn('delivery_order_id', $orderIds)
                        ->sum('amount');
                }

                $totalRevenue += $revenue;
                $routes[] = [
                    'route_id' => $route->id,
                    'plan_code' => $plan->code,
                    'planned_date' => $plan->planned_date?->toDateString(),
                    'vehicle' => $route->vehicle?->plate_number,
                    'stops' => $orderIds->count(),
                    'distance_km' => (float) ($route->estimated_distance_km ?? 0),
                    'revenue' => round($revenue, 2),
                ];
            }
        }

        $routeCount = count($routes);
        usort($routes, fn (array $a, array $b): int => $b['revenue'] <=> $a['revenue']);

        return [
            'average' => $routeCount > 0 ? round($totalRevenue / $routeCount, 2) : null,
            'total_revenue' => round($totalRevenue, 2),
            'route_count' => $routeCount,
            'routes' => array_slice($routes, 0, 10),
        ];
    }
}
