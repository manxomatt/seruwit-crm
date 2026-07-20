<?php

namespace Modules\TransportationManagement\Actions;

use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;

/**
 * The rules for moving a stop through pending → arrived → completed, kept in
 * one place because there are now two callers with very different shapes: the
 * controller, and the GPS listener that auto-arrives a stop when a vehicle
 * enters its radius. Both guard sets live here even though only arrival is
 * automated today, so the two can never drift apart.
 */
class TripStopTransitions
{
    public function arrive(Trip $trip, TripStop $stop): TransitionResult
    {
        if ($trip->status !== Trip::STATUS_IN_PROGRESS) {
            return TransitionResult::refused('Stops can only be worked while the trip is in progress.');
        }

        if ($stop->status !== TripStop::STATUS_PENDING) {
            return TransitionResult::refused('Only a pending stop can be marked as arrived.');
        }

        // Eloquent update, never a bulk query update: Orders observes stop
        // changes to keep delivery orders in step, and a mass update fires no
        // model events.
        $stop->update([
            'status' => TripStop::STATUS_ARRIVED,
            'arrived_at' => now(),
        ]);

        return TransitionResult::ok('Arrived at stop.');
    }

    public function complete(Trip $trip, TripStop $stop): TransitionResult
    {
        if ($trip->status !== Trip::STATUS_IN_PROGRESS) {
            return TransitionResult::refused('Stops can only be worked while the trip is in progress.');
        }

        if (! in_array($stop->status, [TripStop::STATUS_PENDING, TripStop::STATUS_ARRIVED], true)) {
            return TransitionResult::refused('This stop has already been completed.');
        }

        $stop->update([
            'status' => TripStop::STATUS_COMPLETED,
            'arrived_at' => $stop->arrived_at ?? now(),
            'completed_at' => now(),
        ]);

        return TransitionResult::ok('Stop completed.');
    }
}
