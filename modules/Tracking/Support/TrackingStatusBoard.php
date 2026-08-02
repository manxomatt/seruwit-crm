<?php

namespace Modules\Tracking\Support;

use Illuminate\Support\Facades\Schema;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Models\TrackingGeofence;
use Modules\Tracking\Models\VehiclePosition;

/**
 * Tracking overview: device pairing, live motion mix, geofences, and poll health.
 */
class TrackingStatusBoard
{
    private const STALE_MINUTES = 15;

    private const MOVING_SPEED_KPH = 3.0;

    /**
     * @return array<string, mixed>
     */
    public function build(int $recentLimit = 8): array
    {
        $config = TrackingConfig::current();
        $staleBefore = now()->subMinutes(self::STALE_MINUTES);

        $devices = GpsDevice::query()
            ->with('vehicle:id,name,plate_number')
            ->orderByDesc('last_recorded_at')
            ->get();

        $paired = 0;
        $unpaired = 0;
        $withFix = 0;
        $moving = 0;
        $idle = 0;
        $stale = 0;
        $online = 0;

        foreach ($devices as $device) {
            if ($device->vehicle_id !== null) {
                $paired++;
            } else {
                $unpaired++;
            }

            if ($device->status === 'online') {
                $online++;
            }

            if (! $device->hasPosition()) {
                $stale++;

                continue;
            }

            $withFix++;

            if ($device->last_recorded_at === null || $device->last_recorded_at->lt($staleBefore)) {
                $stale++;

                continue;
            }

            if ((float) $device->last_speed_kph > self::MOVING_SPEED_KPH) {
                $moving++;
            } else {
                $idle++;
            }
        }

        $geofencesActive = 0;
        $geofencesTotal = 0;
        if (Schema::hasTable('tracking_geofences')) {
            $geofencesTotal = (int) TrackingGeofence::query()->count();
            $geofencesActive = (int) TrackingGeofence::query()->where('is_active', true)->count();
        }

        $positionsToday = 0;
        if (Schema::hasTable('vehicle_positions')) {
            $positionsToday = (int) VehiclePosition::query()
                ->whereDate('recorded_at', now()->toDateString())
                ->count();
        }

        $recent = $devices
            ->take($recentLimit)
            ->map(fn (GpsDevice $device): array => [
                'id' => $device->id,
                'name' => $device->name,
                'status' => $device->status,
                'paired' => $device->vehicle_id !== null,
                'vehicle' => $device->vehicle
                    ? [
                        'id' => $device->vehicle->id,
                        'name' => $device->vehicle->name,
                        'plate_number' => $device->vehicle->plate_number,
                    ]
                    : null,
                'last_speed_kph' => $device->last_speed_kph !== null ? (float) $device->last_speed_kph : null,
                'last_recorded_at' => $device->last_recorded_at?->toIso8601String(),
                'tone' => $this->toneFor($device, $staleBefore),
            ])
            ->values()
            ->all();

        return [
            'devices' => [
                'total' => $devices->count(),
                'paired' => $paired,
                'unpaired' => $unpaired,
                'with_fix' => $withFix,
                'online' => $online,
                'moving' => $moving,
                'idle' => $idle,
                'stale' => $stale,
            ],
            'geofences' => [
                'available' => Schema::hasTable('tracking_geofences'),
                'active' => $geofencesActive,
                'total' => $geofencesTotal,
            ],
            'activity' => [
                'positions_today' => $positionsToday,
            ],
            'config' => [
                'configured' => $config->isConfigured(),
                'provider' => $config->provider,
                'poll_enabled' => (bool) $config->poll_enabled,
                'alerts_enabled' => (bool) $config->alerts_enabled,
                'last_polled_at' => $config->last_polled_at?->toIso8601String(),
                'last_poll_error' => $config->last_poll_error,
            ],
            'recent' => $recent,
        ];
    }

    private function toneFor(GpsDevice $device, \Illuminate\Support\Carbon $staleBefore): string
    {
        if (! $device->hasPosition() || $device->last_recorded_at === null || $device->last_recorded_at->lt($staleBefore)) {
            return 'stale';
        }

        return (float) $device->last_speed_kph > self::MOVING_SPEED_KPH ? 'moving' : 'idle';
    }
}
