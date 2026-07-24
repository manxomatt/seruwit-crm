<?php

namespace Modules\Routing\Support;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Routing\Models\RoutePlan;
use Modules\Routing\Models\RoutePlanRoute;
use Modules\TransportationManagement\Models\Trip;

/**
 * Builds an optimized route plan from confirmed, geocoded delivery orders and
 * eligible fleet assets, then persists routes + stop sequences.
 */
class RouteOptimizationService
{
    public function __construct(private readonly FleetVrpSolver $solver) {}

    /**
     * @param  list<int>|null  $deliveryOrderIds  null = all confirmed geocoded DOs for the plan date
     */
    public function optimize(RoutePlan $plan, ?array $deliveryOrderIds = null): RoutePlan
    {
        return DB::transaction(function () use ($plan, $deliveryOrderIds): RoutePlan {
            $plan->routes()->each(function (RoutePlanRoute $route): void {
                $route->stops()->delete();
                $route->delete();
            });

            $orders = $this->eligibleOrders($plan, $deliveryOrderIds);
            $vehicles = $this->eligibleVehicles($plan->planned_date);
            $drivers = $this->eligibleDrivers($plan->planned_date);

            $stops = $orders->map(fn (DeliveryOrder $order): array => [
                'id' => $order->id,
                'lat' => (float) $order->delivery_lat,
                'lng' => (float) $order->delivery_lng,
                'demand' => (float) ($order->demand_kg ?? 1),
                'address' => $order->delivery_address,
            ])->values()->all();

            $vehicleInputs = $vehicles->map(fn (Vehicle $vehicle): array => [
                'id' => $vehicle->id,
                'capacity_kg' => $vehicle->capacity_kg !== null ? (float) $vehicle->capacity_kg : null,
                'cost_per_km' => $vehicle->cost_per_km !== null ? (float) $vehicle->cost_per_km : null,
            ])->values()->all();

            $result = $this->solver->solve(
                (float) $plan->depot_lat,
                (float) $plan->depot_lng,
                $stops,
                $vehicleInputs,
                $plan->objective,
            );

            $ordersById = $orders->keyBy('id');
            $driversQueue = $drivers->values();
            $totalDistance = 0.0;
            $totalCost = 0.0;
            $sequence = 1;

            foreach ($result['routes'] as $built) {
                $driver = $driversQueue->shift();

                $route = $plan->routes()->create([
                    'sequence' => $sequence++,
                    'vehicle_id' => $built['vehicle_id'],
                    'driver_id' => $driver?->id,
                    'load_kg' => $built['load'],
                    'estimated_distance_km' => $built['distance_km'],
                    'estimated_cost' => $built['cost'],
                ]);

                $prevLat = (float) $plan->depot_lat;
                $prevLng = (float) $plan->depot_lng;
                $stopSeq = 1;

                foreach ($built['stop_ids'] as $index => $orderId) {
                    /** @var DeliveryOrder $order */
                    $order = $ordersById->get((int) $orderId);
                    $leg = $built['leg_distances'][$index] ?? Haversine::distanceKm(
                        $prevLat,
                        $prevLng,
                        (float) $order->delivery_lat,
                        (float) $order->delivery_lng,
                    );

                    $route->stops()->create([
                        'delivery_order_id' => $order->id,
                        'sequence' => $stopSeq++,
                        'address' => $order->delivery_address,
                        'lat' => $order->delivery_lat,
                        'lng' => $order->delivery_lng,
                        'demand_kg' => $order->demand_kg ?? 1,
                        'distance_from_previous_km' => $leg,
                    ]);

                    $prevLat = (float) $order->delivery_lat;
                    $prevLng = (float) $order->delivery_lng;
                }

                $totalDistance += $built['distance_km'];
                $totalCost += $built['cost'];
            }

            $plan->update([
                'status' => RoutePlan::STATUS_OPTIMIZED,
                'total_distance_km' => round($totalDistance, 2),
                'total_cost' => round($totalCost, 2),
                'unassigned_count' => count($result['unassigned_ids']),
                'optimized_at' => now(),
                'params' => array_merge($plan->params ?? [], [
                    'vehicle_count' => $vehicles->count(),
                    'driver_count' => $drivers->count(),
                    'order_count' => $orders->count(),
                    'unassigned_ids' => $result['unassigned_ids'],
                ]),
            ]);

            return $plan->fresh(['routes.stops', 'routes.vehicle', 'routes.driver']);
        });
    }

    /**
     * @param  list<int>|null  $deliveryOrderIds
     * @return Collection<int, DeliveryOrder>
     */
    private function eligibleOrders(RoutePlan $plan, ?array $deliveryOrderIds): Collection
    {
        return DeliveryOrder::query()
            ->where('status', DeliveryOrder::STATUS_CONFIRMED)
            ->whereNotNull('delivery_lat')
            ->whereNotNull('delivery_lng')
            ->when(
                $deliveryOrderIds !== null,
                fn ($q) => $q->whereIn('id', $deliveryOrderIds),
                fn ($q) => $q->whereDate('order_date', $plan->planned_date),
            )
            ->orderBy('id')
            ->get();
    }

    /**
     * @return Collection<int, Vehicle>
     */
    private function eligibleVehicles(\DateTimeInterface|string $date): Collection
    {
        return Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->orderBy('id')
            ->get()
            ->filter(fn (Vehicle $vehicle): bool => Trip::vehicleDispatchReasons($vehicle, $date) === [])
            ->values();
    }

    /**
     * @return Collection<int, Driver>
     */
    private function eligibleDrivers(\DateTimeInterface|string $date): Collection
    {
        return Driver::query()
            ->where('status', Driver::STATUS_AVAILABLE)
            ->orderBy('id')
            ->get()
            ->filter(fn (Driver $driver): bool => Trip::driverDispatchReasons($driver, $date) === [])
            ->values();
    }
}
