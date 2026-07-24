<?php

namespace Modules\DriverScoring\Listeners;

use App\Modules\Facades\Modules;
use Modules\DriverScoring\Models\DriverScoringSetting;
use Modules\DriverScoring\Support\DrivingEventRecorder;
use Modules\Tracking\Events\VehiclePositionsRecorded;

/**
 * Scores driving behaviour from fresh Traccar telemetry without Tracking
 * knowing this module exists.
 */
class DetectDrivingEvents
{
    public function __construct(private readonly DrivingEventRecorder $recorder) {}

    public function handle(VehiclePositionsRecorded $event): void
    {
        if (! Modules::available('scoring')) {
            return;
        }

        $byVehicle = $event->byVehicle();
        if ($byVehicle === []) {
            return;
        }

        $settings = DriverScoringSetting::current();

        foreach ($byVehicle as $vehicleId => $positions) {
            $this->recorder->processVehicle(
                (int) $vehicleId,
                $positions,
                $settings,
            );
        }
    }
}
