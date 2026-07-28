<?php

namespace Modules\Tracking\Listeners;

use Modules\Tracking\Events\VehiclePositionsRecorded;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Support\TrackingAlertScanner;

class DetectTrackingAlerts
{
    public function handle(VehiclePositionsRecorded $event): void
    {
        $config = TrackingConfig::current();
        $scanner = new TrackingAlertScanner($config);
        $scanner->scanPositions($event->byVehicle());
        $scanner->scanStaleDevices();
    }
}
