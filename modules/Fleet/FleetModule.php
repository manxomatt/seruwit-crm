<?php

namespace Modules\Fleet;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Fleet\Http\Controllers\DriverController;
use Modules\Fleet\Http\Controllers\FuelLogController;
use Modules\Fleet\Http\Controllers\VehicleController;
use Modules\Fleet\Http\Controllers\VehicleMaintenanceLogController;

/**
 * Vehicle and driver records, deliberately free of any booking/dispatch
 * concept. Any module that needs to reference a vehicle or driver — currently
 * Transportation, eventually Rental — declares `requires(): ['fleet']` rather
 * than owning its own copy.
 */
class FleetModule implements ModuleContract
{
    public function key(): string
    {
        return 'fleet';
    }

    public function label(): string
    {
        return 'Fleet';
    }

    public function description(): string
    {
        return 'Vehicle and driver records shared by every module that needs them.';
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
     * Vehicle/driver photos go through the Media picker in the shared
     * ImageUploader component, so Fleet cannot stand on its own without it.
     */
    public function requires(): array
    {
        return ['media'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Fleet',
            'slug' => 'fleet',
            'icon' => 'fleet',
            'route_name' => 'fleet.vehicles.index',
            'permission_module' => 'fleet',
            'permission_action' => 'view',
            'sort_order' => 5,
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
     * Pure configuration only — no tenant is initialized yet at boot.
     */
    public function boot(): void
    {
        //
    }

    public function routes(): void
    {
        Route::get('/fleet/vehicles', [VehicleController::class, 'index'])->middleware('permission:fleet,view')->name('fleet.vehicles.index');
        Route::get('/fleet/vehicles/create', [VehicleController::class, 'create'])->middleware('permission:fleet,create')->name('fleet.vehicles.create');
        Route::post('/fleet/vehicles', [VehicleController::class, 'store'])->middleware('permission:fleet,create')->name('fleet.vehicles.store');
        Route::get('/fleet/vehicles/{vehicle}', [VehicleController::class, 'show'])->middleware('permission:fleet,view')->name('fleet.vehicles.show');
        Route::get('/fleet/vehicles/{vehicle}/edit', [VehicleController::class, 'edit'])->middleware('permission:fleet,update')->name('fleet.vehicles.edit');
        Route::patch('/fleet/vehicles/{vehicle}', [VehicleController::class, 'update'])->middleware('permission:fleet,update')->name('fleet.vehicles.update');
        Route::delete('/fleet/vehicles/{vehicle}', [VehicleController::class, 'destroy'])->middleware('permission:fleet,delete')->name('fleet.vehicles.destroy');

        Route::post('/fleet/vehicles/{vehicle}/maintenance-logs', [VehicleMaintenanceLogController::class, 'store'])->middleware('permission:fleet,create')->name('fleet.vehicles.maintenance-logs.store');
        Route::patch('/fleet/vehicles/{vehicle}/maintenance-logs/{maintenanceLog}', [VehicleMaintenanceLogController::class, 'update'])->middleware('permission:fleet,update')->name('fleet.vehicles.maintenance-logs.update');
        Route::delete('/fleet/vehicles/{vehicle}/maintenance-logs/{maintenanceLog}', [VehicleMaintenanceLogController::class, 'destroy'])->middleware('permission:fleet,delete')->name('fleet.vehicles.maintenance-logs.destroy');

        Route::post('/fleet/vehicles/{vehicle}/fuel-logs', [FuelLogController::class, 'store'])->middleware('permission:fleet,create')->name('fleet.vehicles.fuel-logs.store');
        Route::delete('/fleet/vehicles/{vehicle}/fuel-logs/{fuelLog}', [FuelLogController::class, 'destroy'])->middleware('permission:fleet,delete')->name('fleet.vehicles.fuel-logs.destroy');

        Route::get('/fleet/drivers', [DriverController::class, 'index'])->middleware('permission:fleet,view')->name('fleet.drivers.index');
        Route::get('/fleet/drivers/create', [DriverController::class, 'create'])->middleware('permission:fleet,create')->name('fleet.drivers.create');
        Route::post('/fleet/drivers', [DriverController::class, 'store'])->middleware('permission:fleet,create')->name('fleet.drivers.store');
        Route::get('/fleet/drivers/{driver}', [DriverController::class, 'show'])->middleware('permission:fleet,view')->name('fleet.drivers.show');
        Route::get('/fleet/drivers/{driver}/edit', [DriverController::class, 'edit'])->middleware('permission:fleet,update')->name('fleet.drivers.edit');
        Route::patch('/fleet/drivers/{driver}', [DriverController::class, 'update'])->middleware('permission:fleet,update')->name('fleet.drivers.update');
        Route::delete('/fleet/drivers/{driver}', [DriverController::class, 'destroy'])->middleware('permission:fleet,delete')->name('fleet.drivers.destroy');
    }
}
