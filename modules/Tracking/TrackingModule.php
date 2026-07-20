<?php

namespace Modules\Tracking;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Console\Application as Artisan;
use Illuminate\Support\Facades\Route;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Console\Commands\TrackingPoll;
use Modules\Tracking\Console\Commands\TrackingPrune;
use Modules\Tracking\Http\Controllers\GpsDeviceController;
use Modules\Tracking\Http\Controllers\TrackingConfigController;
use Modules\Tracking\Http\Controllers\TrackingMapController;
use Modules\Tracking\Models\GpsDevice;

/**
 * GPS telemetry for Fleet vehicles, pulled from a Traccar server: device
 * pairing, position history, and the live fleet map.
 *
 * Foundation rather than Vertical because tracking a vehicle is useful to any
 * business line that puts vehicles to work — logistics dispatch today, rental
 * later. That placement is also what forbids this module from knowing anything
 * about trips: consumers subscribe to VehiclePositionsRecorded instead.
 */
class TrackingModule implements ModuleContract
{
    public function key(): string
    {
        return 'tracking';
    }

    public function label(): string
    {
        return 'Tracking';
    }

    public function description(): string
    {
        return 'Live GPS tracking for fleet vehicles via Traccar: device pairing, position history, and automatic odometer.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete'];
    }

    /**
     * A GPS device is only meaningful once paired to a vehicle, so Tracking
     * cannot stand on its own without Fleet.
     */
    public function requires(): array
    {
        return ['fleet'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Tracking',
            'slug' => 'tracking',
            'icon' => 'tracking',
            'route_name' => 'tracking.map',
            'permission_module' => 'tracking',
            'permission_action' => 'view',
            'sort_order' => 9,
        ];
    }

    public function migrationsPath(): string
    {
        return __DIR__.'/Database/Migrations';
    }

    public function viewsPath(): ?string
    {
        return null;
    }

    /**
     * Attaches this module's relation to Fleet's Vehicle so that Fleet needs no
     * knowledge of Tracking, and registers this module's console commands.
     * Registration only; no tenant is initialized yet at boot, so nothing here
     * may query. Callers of the relation must gate on
     * Modules::available('tracking') — the relation is registered for every
     * process, but the table only exists where the module is installed.
     */
    public function boot(): void
    {
        Vehicle::resolveRelationUsing('gpsDevice', fn (Vehicle $vehicle) => $vehicle->hasOne(GpsDevice::class));

        // Laravel only auto-discovers app/Console/Commands, so a module's
        // commands would otherwise never exist.
        Artisan::starting(fn (Artisan $artisan) => $artisan->resolveCommands([
            TrackingPoll::class,
            TrackingPrune::class,
        ]));
    }

    public function routes(): void
    {
        Route::redirect('/tracking', '/tracking/map');

        Route::get('/tracking/map', [TrackingMapController::class, 'index'])->middleware('permission:tracking,view')->name('tracking.map');

        Route::get('/tracking/devices', [GpsDeviceController::class, 'index'])->middleware('permission:tracking,view')->name('tracking.devices.index');
        Route::post('/tracking/devices/sync', [GpsDeviceController::class, 'sync'])->middleware('permission:tracking,create')->name('tracking.devices.sync');
        Route::patch('/tracking/devices/{device}/pair', [GpsDeviceController::class, 'pair'])->middleware('permission:tracking,update')->name('tracking.devices.pair');
        Route::delete('/tracking/devices/{device}/pair', [GpsDeviceController::class, 'unpair'])->middleware('permission:tracking,update')->name('tracking.devices.unpair');
        Route::delete('/tracking/devices/{device}', [GpsDeviceController::class, 'destroy'])->middleware('permission:tracking,delete')->name('tracking.devices.destroy');

        Route::get('/tracking/settings', [TrackingConfigController::class, 'edit'])->middleware('permission:tracking,view')->name('tracking.settings.edit');
        Route::patch('/tracking/settings', [TrackingConfigController::class, 'update'])->middleware('permission:tracking,update')->name('tracking.settings.update');
        Route::post('/tracking/settings/test', [TrackingConfigController::class, 'test'])->middleware('permission:tracking,update')->name('tracking.settings.test');
    }
}
