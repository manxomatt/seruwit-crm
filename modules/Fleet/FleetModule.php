<?php

namespace Modules\Fleet;

use App\Models\User;
use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Fleet\Http\Controllers\DriverAccountController;
use Modules\Fleet\Http\Controllers\DriverController;
use Modules\Fleet\Http\Controllers\FleetBaseAiGenerateController;
use Modules\Fleet\Http\Controllers\FleetBaseController;
use Modules\Fleet\Http\Controllers\FleetDashboardController;
use Modules\Fleet\Http\Controllers\FuelAnalyticsController;
use Modules\Fleet\Http\Controllers\FuelLogController;
use Modules\Fleet\Http\Controllers\VehicleAiGenerateController;
use Modules\Fleet\Http\Controllers\VehicleController;
use Modules\Fleet\Http\Controllers\VehicleMaintenanceLogController;
use Modules\Fleet\Models\FleetBase;

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
        return 'Vehicle and driver records with fuel analytics, status board, consumption, and anomaly detection — shared by Transportation and other modules.';
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
            'route_name' => 'fleet.dashboard',
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
        User::resolveRelationUsing(
            'fleetBases',
            fn (User $user) => $user->belongsToMany(FleetBase::class, 'user_fleet_base')->withTimestamps(),
        );
    }

    public function routes(): void
    {
        Route::get('/fleet', [FleetDashboardController::class, 'index'])->middleware('permission:fleet,view')->name('fleet.dashboard');

        Route::get('/fleet/bases', [FleetBaseController::class, 'index'])->middleware('permission:fleet,view')->name('fleet.bases.index');
        Route::get('/fleet/bases/create', [FleetBaseController::class, 'create'])->middleware('permission:fleet,create')->name('fleet.bases.create');
        Route::post('/fleet/bases', [FleetBaseController::class, 'store'])->middleware('permission:fleet,create')->name('fleet.bases.store');
        Route::post('/fleet/bases/ai-generate', [FleetBaseAiGenerateController::class, 'generate'])->middleware('permission:fleet,create')->name('fleet.bases.ai-generate');
        Route::patch('/fleet/bases/batch-status', [FleetBaseController::class, 'batchUpdateStatus'])->middleware('permission:fleet,update')->name('fleet.bases.batch-status');
        Route::post('/fleet/bases/batch-destroy', [FleetBaseController::class, 'batchDestroy'])->middleware('permission:fleet,delete')->name('fleet.bases.batch-destroy');
        Route::get('/fleet/bases/{fleetBase}', [FleetBaseController::class, 'show'])->middleware('permission:fleet,view')->name('fleet.bases.show');
        Route::get('/fleet/bases/{fleetBase}/edit', [FleetBaseController::class, 'edit'])->middleware('permission:fleet,update')->name('fleet.bases.edit');
        Route::patch('/fleet/bases/{fleetBase}', [FleetBaseController::class, 'update'])->middleware('permission:fleet,update')->name('fleet.bases.update');
        Route::delete('/fleet/bases/{fleetBase}', [FleetBaseController::class, 'destroy'])->middleware('permission:fleet,delete')->name('fleet.bases.destroy');

        Route::get('/fleet/vehicles', [VehicleController::class, 'index'])->middleware('permission:fleet,view')->name('fleet.vehicles.index');
        Route::get('/fleet/vehicles/create', [VehicleController::class, 'create'])->middleware('permission:fleet,create')->name('fleet.vehicles.create');
        Route::post('/fleet/vehicles', [VehicleController::class, 'store'])->middleware('permission:fleet,create')->name('fleet.vehicles.store');
        Route::post('/fleet/vehicles/ai-generate', [VehicleAiGenerateController::class, 'generate'])->middleware('permission:fleet,create')->name('fleet.vehicles.ai-generate');
        Route::patch('/fleet/vehicles/batch-status', [VehicleController::class, 'batchUpdateStatus'])->middleware('permission:fleet,update')->name('fleet.vehicles.batch-status');
        Route::post('/fleet/vehicles/batch-destroy', [VehicleController::class, 'batchDestroy'])->middleware('permission:fleet,delete')->name('fleet.vehicles.batch-destroy');
        Route::get('/fleet/vehicles/{vehicle}', [VehicleController::class, 'show'])->middleware('permission:fleet,view')->name('fleet.vehicles.show');
        Route::get('/fleet/vehicles/{vehicle}/edit', [VehicleController::class, 'edit'])->middleware('permission:fleet,update')->name('fleet.vehicles.edit');
        Route::patch('/fleet/vehicles/{vehicle}', [VehicleController::class, 'update'])->middleware('permission:fleet,update')->name('fleet.vehicles.update');
        Route::delete('/fleet/vehicles/{vehicle}', [VehicleController::class, 'destroy'])->middleware('permission:fleet,delete')->name('fleet.vehicles.destroy');

        Route::post('/fleet/vehicles/{vehicle}/maintenance-logs', [VehicleMaintenanceLogController::class, 'store'])->middleware('permission:fleet,create')->name('fleet.vehicles.maintenance-logs.store');
        Route::patch('/fleet/vehicles/{vehicle}/maintenance-logs/{maintenanceLog}', [VehicleMaintenanceLogController::class, 'update'])->middleware('permission:fleet,update')->name('fleet.vehicles.maintenance-logs.update');
        Route::delete('/fleet/vehicles/{vehicle}/maintenance-logs/{maintenanceLog}', [VehicleMaintenanceLogController::class, 'destroy'])->middleware('permission:fleet,delete')->name('fleet.vehicles.maintenance-logs.destroy');

        Route::get('/fleet/fuel', [FuelLogController::class, 'index'])->middleware('permission:fleet,view')->name('fleet.fuel.index');
        Route::get('/fleet/fuel/analytics', [FuelAnalyticsController::class, 'index'])->middleware('permission:fleet,view')->name('fleet.fuel.analytics');
        Route::post('/fleet/vehicles/{vehicle}/fuel-logs', [FuelLogController::class, 'store'])->middleware('permission:fleet,create')->name('fleet.vehicles.fuel-logs.store');
        Route::delete('/fleet/vehicles/{vehicle}/fuel-logs/{fuelLog}', [FuelLogController::class, 'destroy'])->middleware('permission:fleet,delete')->name('fleet.vehicles.fuel-logs.destroy');

        Route::get('/fleet/drivers', [DriverController::class, 'index'])->middleware('permission:fleet,view')->name('fleet.drivers.index');
        Route::get('/fleet/drivers/create', [DriverController::class, 'create'])->middleware('permission:fleet,create')->name('fleet.drivers.create');
        Route::post('/fleet/drivers', [DriverController::class, 'store'])->middleware('permission:fleet,create')->name('fleet.drivers.store');
        Route::patch('/fleet/drivers/batch-status', [DriverController::class, 'batchUpdateStatus'])->middleware('permission:fleet,update')->name('fleet.drivers.batch-status');
        Route::post('/fleet/drivers/batch-destroy', [DriverController::class, 'batchDestroy'])->middleware('permission:fleet,delete')->name('fleet.drivers.batch-destroy');
        Route::get('/fleet/drivers/{driver}', [DriverController::class, 'show'])->middleware('permission:fleet,view')->name('fleet.drivers.show');
        Route::get('/fleet/drivers/{driver}/edit', [DriverController::class, 'edit'])->middleware('permission:fleet,update')->name('fleet.drivers.edit');
        Route::patch('/fleet/drivers/{driver}', [DriverController::class, 'update'])->middleware('permission:fleet,update')->name('fleet.drivers.update');
        Route::delete('/fleet/drivers/{driver}', [DriverController::class, 'destroy'])->middleware('permission:fleet,delete')->name('fleet.drivers.destroy');

        Route::post('/fleet/drivers/{driver}/account', [DriverAccountController::class, 'store'])->middleware('permission:fleet,update')->name('fleet.drivers.account.store');
    }
}
