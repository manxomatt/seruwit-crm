<?php

namespace Modules\Tracking\Support;

use App\Modules\Facades\Modules;
use App\Notifications\GenericNotification;
use App\Support\Geo;
use App\Support\NotificationRecipients;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\TrackingAlertState;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Models\TrackingGeofence;

class TrackingAlertScanner
{
    public function __construct(private readonly TrackingConfig $config) {}

    /**
     * @param  array<int, array<int, PositionPayload>>  $byVehicle
     */
    public function scanPositions(array $byVehicle): void
    {
        if (! $this->config->alerts_enabled || ! Schema::hasTable('tracking_alert_states')) {
            return;
        }

        $activeRentalVehicleIds = $this->activeRentalVehicleIds();
        $geofences = Schema::hasTable('tracking_geofences')
            ? TrackingGeofence::query()->where('is_active', true)->get()
            : collect();

        foreach ($byVehicle as $vehicleId => $positions) {
            $latest = end($positions);

            if (! $latest instanceof PositionPayload) {
                continue;
            }

            $this->checkOverspeed((int) $vehicleId, $latest);
            $this->checkIdle((int) $vehicleId, $latest, $activeRentalVehicleIds);
            $this->checkGeofences((int) $vehicleId, $latest, $geofences, $activeRentalVehicleIds);
        }
    }

    public function scanStaleDevices(): void
    {
        if (! $this->config->alerts_enabled || ! Schema::hasTable('tracking_alert_states')) {
            return;
        }

        $staleBefore = now()->subMinutes(max(1, (int) $this->config->alert_stale_minutes));

        $devices = GpsDevice::query()
            ->with('vehicle:id,name,plate_number')
            ->whereNotNull('vehicle_id')
            ->whereNotNull('last_recorded_at')
            ->where('last_recorded_at', '<', $staleBefore)
            ->get();

        foreach ($devices as $device) {
            $this->notifyOnce(
                kind: 'stale',
                key: 'stale:device:'.$device->id,
                vehicleId: $device->vehicle_id,
                deviceId: $device->id,
                title: __('tracking.alerts.stale_title'),
                body: __('tracking.alerts.stale_body', [
                    'vehicle' => $device->vehicle
                        ? $device->vehicle->name.' ('.$device->vehicle->plate_number.')'
                        : $device->name,
                    'minutes' => (int) $this->config->alert_stale_minutes,
                ]),
                url: route('module.tracking.map', absolute: false),
            );
        }
    }

    private function checkOverspeed(int $vehicleId, PositionPayload $position): void
    {
        $limit = (float) $this->config->alert_speed_kph;

        if ($position->speedKph < $limit) {
            return;
        }

        $vehicle = Vehicle::query()->find($vehicleId);

        $this->notifyOnce(
            kind: 'overspeed',
            key: 'overspeed:vehicle:'.$vehicleId,
            vehicleId: $vehicleId,
            deviceId: null,
            title: __('tracking.alerts.overspeed_title'),
            body: __('tracking.alerts.overspeed_body', [
                'vehicle' => $vehicle ? $vehicle->name.' ('.$vehicle->plate_number.')' : '#'.$vehicleId,
                'speed' => round($position->speedKph),
                'limit' => (int) $limit,
            ]),
            url: route('module.tracking.map', absolute: false),
        );
    }

    /**
     * @param  list<int>  $activeRentalVehicleIds
     */
    private function checkIdle(int $vehicleId, PositionPayload $position, array $activeRentalVehicleIds): void
    {
        // Idle alerts are rental-scoped: only units currently on hire.
        if (! Modules::available('rental') || ! in_array($vehicleId, $activeRentalVehicleIds, true)) {
            return;
        }

        $key = 'idle:vehicle:'.$vehicleId;
        $state = TrackingAlertState::query()->firstOrNew(['alert_key' => $key], [
            'kind' => 'idle',
            'vehicle_id' => $vehicleId,
        ]);

        if ($position->speedKph > 3) {
            $state->idle_since = null;
            $state->save();

            return;
        }

        $state->idle_since ??= now();
        $state->vehicle_id = $vehicleId;
        $state->kind = 'idle';
        $state->save();

        $idleMinutes = $state->idle_since?->diffInMinutes(now()) ?? 0;

        if ($idleMinutes < (int) $this->config->alert_idle_minutes) {
            return;
        }

        $vehicle = Vehicle::query()->find($vehicleId);

        $this->notifyOnce(
            kind: 'idle',
            key: $key,
            vehicleId: $vehicleId,
            deviceId: null,
            title: __('tracking.alerts.idle_title'),
            body: __('tracking.alerts.idle_body', [
                'vehicle' => $vehicle ? $vehicle->name.' ('.$vehicle->plate_number.')' : '#'.$vehicleId,
                'minutes' => (int) $this->config->alert_idle_minutes,
            ]),
            url: route('module.tracking.map', absolute: false),
            existing: $state,
        );
    }

    /**
     * @param  Collection<int, TrackingGeofence>  $geofences
     * @param  list<int>  $activeRentalVehicleIds
     */
    private function checkGeofences(int $vehicleId, PositionPayload $position, Collection $geofences, array $activeRentalVehicleIds): void
    {
        foreach ($geofences as $geofence) {
            if ($geofence->active_rentals_only) {
                if (! Modules::available('rental') || ! in_array($vehicleId, $activeRentalVehicleIds, true)) {
                    continue;
                }
            }

            $inside = Geo::isWithin(
                $position->latitude,
                $position->longitude,
                (float) $geofence->latitude,
                (float) $geofence->longitude,
                (float) $geofence->radius_m,
            );

            $key = 'geofence:'.$geofence->id.':vehicle:'.$vehicleId;
            $state = TrackingAlertState::query()->firstOrNew(['alert_key' => $key], [
                'kind' => 'geofence',
                'vehicle_id' => $vehicleId,
                'meta' => ['geofence_id' => $geofence->id],
            ]);

            $wasInside = $state->exists ? $state->inside_geofence : null;
            $state->inside_geofence = $inside;
            $state->vehicle_id = $vehicleId;
            $state->kind = 'geofence';
            $state->meta = ['geofence_id' => $geofence->id];
            $state->save();

            if ($wasInside === null) {
                continue;
            }

            $exited = $wasInside && ! $inside;
            $entered = ! $wasInside && $inside;
            $shouldAlert = ($exited && in_array($geofence->alert_on, [TrackingGeofence::ALERT_EXIT, TrackingGeofence::ALERT_BOTH], true))
                || ($entered && in_array($geofence->alert_on, [TrackingGeofence::ALERT_ENTER, TrackingGeofence::ALERT_BOTH], true));

            if (! $shouldAlert) {
                continue;
            }

            $vehicle = Vehicle::query()->find($vehicleId);
            $event = $exited ? 'exit' : 'enter';

            $this->notifyOnce(
                kind: 'geofence',
                key: $key.':'.$event,
                vehicleId: $vehicleId,
                deviceId: null,
                title: __('tracking.alerts.geofence_title'),
                body: __('tracking.alerts.geofence_body', [
                    'vehicle' => $vehicle ? $vehicle->name.' ('.$vehicle->plate_number.')' : '#'.$vehicleId,
                    'zone' => $geofence->name,
                    'event' => __('tracking.geofence.events.'.$event),
                ]),
                url: route('module.tracking.geofences.index', absolute: false),
            );
        }
    }

    /**
     * @return list<int>
     */
    private function activeRentalVehicleIds(): array
    {
        if (! Modules::available('rental') || ! class_exists(\Modules\Rental\Models\Rental::class)) {
            return [];
        }

        return \Modules\Rental\Models\Rental::query()
            ->where('status', \Modules\Rental\Models\Rental::STATUS_ACTIVE)
            ->pluck('vehicle_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function notifyOnce(
        string $kind,
        string $key,
        ?int $vehicleId,
        ?int $deviceId,
        string $title,
        string $body,
        string $url,
        ?TrackingAlertState $existing = null,
    ): void {
        $state = $existing ?? TrackingAlertState::query()->firstOrNew(['alert_key' => $key], [
            'kind' => $kind,
            'vehicle_id' => $vehicleId,
            'gps_device_id' => $deviceId,
        ]);

        $cooldown = max(1, (int) $this->config->alert_cooldown_minutes);

        if ($state->last_alerted_at && $state->last_alerted_at->gt(now()->subMinutes($cooldown))) {
            return;
        }

        $recipients = NotificationRecipients::forPermission('tracking', 'view');

        if ($recipients->isEmpty()) {
            return;
        }

        Notification::send($recipients, new GenericNotification(
            title: $title,
            body: $body,
            url: $url,
            icon: 'tracking',
            type: 'warning',
        ));

        $state->kind = $kind;
        $state->vehicle_id = $vehicleId;
        $state->gps_device_id = $deviceId;
        $state->last_alerted_at = now();
        $state->save();
    }
}
