<?php

namespace Modules\Routing\Support;

use Illuminate\Support\Facades\DB;
use Modules\Orders\Models\DeliveryOrder;
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
            throw new RuntimeException('Only an optimized plan can be applied.');
        }

        $plan->loadMissing(['routes.stops', 'routes.vehicle', 'routes.driver']);

        if ($plan->routes->isEmpty()) {
            throw new RuntimeException('Plan has no routes to apply.');
        }

        foreach ($plan->routes as $route) {
            if (! $route->vehicle_id || ! $route->driver_id) {
                throw new RuntimeException('Every route needs a vehicle and driver before apply.');
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
        $first = $route->stops->first();
        $last = $route->stops->last();

        $trip = Trip::query()->create([
            'code' => Trip::nextCode(),
            'vehicle_id' => $route->vehicle_id,
            'driver_id' => $route->driver_id,
            'origin' => $plan->depot_address ?: sprintf('Depot (%.5f, %.5f)', $plan->depot_lat, $plan->depot_lng),
            'destination' => $last?->address ?? ($plan->depot_address ?: 'Depot'),
            'cargo_notes' => sprintf('Route plan %s · route #%d', $plan->code, $route->sequence),
            'scheduled_at' => $plan->planned_date->copy()->setTime(8, 0),
            'distance_km' => $route->estimated_distance_km,
            'status' => Trip::STATUS_SCHEDULED,
        ]);

        $sequence = 1;
        foreach ($route->stops as $stop) {
            /** @var DeliveryOrder $order */
            $order = DeliveryOrder::query()->lockForUpdate()->findOrFail($stop->delivery_order_id);

            if ($order->status !== DeliveryOrder::STATUS_CONFIRMED) {
                throw new RuntimeException("Order {$order->code} is no longer confirmed.");
            }

            $trip->stops()->create([
                'sequence' => $sequence++,
                'type' => TripStop::TYPE_DROPOFF,
                'address' => $stop->address,
                'lat' => $stop->lat,
                'lng' => $stop->lng,
                'delivery_order_id' => $order->id,
                'status' => TripStop::STATUS_PENDING,
            ]);

            $order->update([
                'trip_id' => $trip->id,
                'status' => DeliveryOrder::STATUS_ASSIGNED,
            ]);
        }

        $route->update(['trip_id' => $trip->id]);
    }
}
