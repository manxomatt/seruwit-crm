<?php

namespace Modules\Tracking\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Modules\Tracking\Support\PositionPayload;

/**
 * Fresh telemetry landed for this tenant. This is the seam that lets other
 * modules react to vehicle movement without Tracking knowing they exist —
 * Tracking sits in the Foundation tier, so it must never reference a Vertical
 * module like Transportation directly.
 *
 * It deliberately carries plain value objects and scalars rather than Eloquent
 * models, so a listener is coupled to a shape rather than to this module's
 * tables. The thresholds ride along for the same reason: a consumer can decide
 * what counts as "arrived" or "worth recording" without reading Tracking's
 * config table.
 */
class VehiclePositionsRecorded
{
    use Dispatchable;

    /**
     * @param  array<int, PositionPayload>  $positions  keyed by nothing; each carries its own vehicle id
     * @param  array<int, int>  $vehicleIdsByTraccarDeviceId  paired vehicle for each reporting device
     */
    public function __construct(
        public readonly array $positions,
        public readonly array $vehicleIdsByTraccarDeviceId,
        public readonly int $geofenceRadiusM,
        public readonly int $checkpointMinDistanceM,
        public readonly int $checkpointMinIntervalMinutes,
    ) {}

    /**
     * The positions that belong to a paired vehicle, grouped by vehicle id and
     * ordered oldest first — the shape every consumer wants.
     *
     * @return array<int, array<int, PositionPayload>>
     */
    public function byVehicle(): array
    {
        $grouped = [];

        foreach ($this->positions as $position) {
            $vehicleId = $this->vehicleIdsByTraccarDeviceId[$position->traccarDeviceId] ?? null;

            if ($vehicleId === null) {
                continue;
            }

            $grouped[$vehicleId][] = $position;
        }

        foreach ($grouped as $vehicleId => $positions) {
            usort($positions, fn (PositionPayload $a, PositionPayload $b) => $a->recordedAt <=> $b->recordedAt);
            $grouped[$vehicleId] = $positions;
        }

        return $grouped;
    }
}
