<?php

namespace Modules\Routing\Support;

use Illuminate\Support\Facades\DB;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Support\DeliveryOrderTripAssignment;
use Modules\Routing\Models\RoutePlan;
use Modules\Routing\Models\RoutePlanRoute;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;
use RuntimeException;

/**
 * Materialises an optimized plan into scheduled Trips and assigned DOs.
 */
class RoutePlanApplier
{
    public function apply(RoutePlan $plan): RoutePlan
    {
        if ($plan->status !== RoutePlan::STATUS_OPTIMIZED) {
            throw new RuntimeException(__('routing.errors.only_optimized_applicable'));
        }

        $plan->loadMissing(['routes.stops', 'routes.vehicle', 'routes.driver']);

        if ($plan->routes->isEmpty()) {
            throw new RuntimeException(__('routing.errors.no_routes_to_apply'));
        }

        foreach ($plan->routes as $route) {
            if (! $route->vehicle_id || ! $route->driver_id) {
                throw new RuntimeException(__('routing.errors.route_needs_vehicle_driver'));
            }
        }

        return DB::transaction(function () use ($plan): RoutePlan {
            foreach ($plan->routes as $route) {
                $this->applyRoute($plan, $route);
            }

            $plan->update([
                'status' => RoutePlan::STATUS_APPLIED,
                'applied_at' => now(),
            ]);

            return $plan->fresh(['routes.stops', 'routes.vehicle', 'routes.driver']);
        });
    }

    private function applyRoute(RoutePlan $plan, RoutePlanRoute $route): void
    {
        $last = $route->stops->last();
        $startsAt = $plan->planned_date->copy()->setTime(8, 0);
        $distance = $route->estimated_distance_km !== null ? (float) $route->estimated_distance_km : null;
        $endsAt = Trip::estimateEndAt($startsAt, $distance);

        $trip = Trip::query()->create([
            'code' => Trip::nextCode(),
            'vehicle_id' => $route->vehicle_id,
            'driver_id' => $route->driver_id,
            'origin' => $plan->depot_address ?: sprintf('Depot (%.5f, %.5f)', $plan->depot_lat, $plan->depot_lng),
            'destination' => $last?->address ?? ($plan->depot_address ?: 'Depot'),
            'cargo_notes' => sprintf('Route plan %s · route #%d', $plan->code, $route->sequence),
            'scheduled_at' => $startsAt,
            'scheduled_end_at' => $endsAt,
            'distance_km' => $route->estimated_distance_km,
            'status' => Trip::STATUS_SCHEDULED,
        ]);

        $assignment = app(DeliveryOrderTripAssignment::class);

        foreach ($route->stops as $stop) {
            /** @var DeliveryOrder $order */
            $order = DeliveryOrder::query()->lockForUpdate()->findOrFail($stop->delivery_order_id);

            if ($order->status !== DeliveryOrder::STATUS_CONFIRMED) {
                throw new RuntimeException(__('routing.errors.order_not_confirmed', ['code' => $order->code]));
            }

            $assignment->assign($order, $trip, [
                'address' => $stop->address,
                'lat' => $stop->lat,
                'lng' => $stop->lng,
            ]);
        }

        // Routing plans always start at the depot — stamp those coords onto the
        // shared pickup stop when the order itself has no warehouse geo.
        $trip->stops()
            ->where('type', TripStop::TYPE_PICKUP)
            ->whereNull('lat')
            ->update([
                'lat' => $plan->depot_lat,
                'lng' => $plan->depot_lng,
            ]);

        $route->update(['trip_id' => $trip->id]);
    }
}
