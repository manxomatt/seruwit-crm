<?php

namespace Modules\TransportationManagement;

use App\Modules\ModuleContract;
use Illuminate\Support\Facades\Route;
use Modules\TransportationManagement\Http\Controllers\DriverController;
use Modules\TransportationManagement\Http\Controllers\FuelLogController;
use Modules\TransportationManagement\Http\Controllers\ReportController;
use Modules\TransportationManagement\Http\Controllers\TripCheckpointController;
use Modules\TransportationManagement\Http\Controllers\TripController;
use Modules\TransportationManagement\Http\Controllers\VehicleController;
use Modules\TransportationManagement\Http\Controllers\VehicleMaintenanceLogController;

class TransportationManagementModule implements ModuleContract
{
    public function key(): string
    {
        return 'transportation';
    }

    public function label(): string
    {
        return 'Transportation';
    }

    public function description(): string
    {
        return 'Fleet, driver, and trip dispatch management with checkpoint tracking and cost reports.';
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete'];
    }

    /**
     * Vehicle/driver photos go through the Media picker in the shared
     * ImageUploader component, so Transportation cannot stand on its own
     * without Media.
     */
    public function requires(): array
    {
        return ['media'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Transportation',
            'slug' => 'transportation',
            'icon' => 'transportation',
            'route_name' => 'transportation.vehicles.index',
            'permission_module' => 'transportation',
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
     * Pure configuration only — no tenant is initialized yet at boot, so this
     * module has nothing to register beyond what routes() and permissions()
     * already cover.
     */
    public function boot(): void
    {
        //
    }

    public function routes(): void
    {
        Route::redirect('/transportation', '/transportation/vehicles');

        Route::get('/transportation/vehicles', [VehicleController::class, 'index'])->middleware('permission:transportation,view')->name('transportation.vehicles.index');
        Route::get('/transportation/vehicles/create', [VehicleController::class, 'create'])->middleware('permission:transportation,create')->name('transportation.vehicles.create');
        Route::post('/transportation/vehicles', [VehicleController::class, 'store'])->middleware('permission:transportation,create')->name('transportation.vehicles.store');
        Route::get('/transportation/vehicles/{vehicle}', [VehicleController::class, 'show'])->middleware('permission:transportation,view')->name('transportation.vehicles.show');
        Route::get('/transportation/vehicles/{vehicle}/edit', [VehicleController::class, 'edit'])->middleware('permission:transportation,update')->name('transportation.vehicles.edit');
        Route::patch('/transportation/vehicles/{vehicle}', [VehicleController::class, 'update'])->middleware('permission:transportation,update')->name('transportation.vehicles.update');
        Route::delete('/transportation/vehicles/{vehicle}', [VehicleController::class, 'destroy'])->middleware('permission:transportation,delete')->name('transportation.vehicles.destroy');

        Route::post('/transportation/vehicles/{vehicle}/maintenance-logs', [VehicleMaintenanceLogController::class, 'store'])->middleware('permission:transportation,create')->name('transportation.vehicles.maintenance-logs.store');
        Route::patch('/transportation/vehicles/{vehicle}/maintenance-logs/{maintenanceLog}', [VehicleMaintenanceLogController::class, 'update'])->middleware('permission:transportation,update')->name('transportation.vehicles.maintenance-logs.update');
        Route::delete('/transportation/vehicles/{vehicle}/maintenance-logs/{maintenanceLog}', [VehicleMaintenanceLogController::class, 'destroy'])->middleware('permission:transportation,delete')->name('transportation.vehicles.maintenance-logs.destroy');

        Route::post('/transportation/vehicles/{vehicle}/fuel-logs', [FuelLogController::class, 'store'])->middleware('permission:transportation,create')->name('transportation.vehicles.fuel-logs.store');
        Route::delete('/transportation/vehicles/{vehicle}/fuel-logs/{fuelLog}', [FuelLogController::class, 'destroy'])->middleware('permission:transportation,delete')->name('transportation.vehicles.fuel-logs.destroy');

        Route::get('/transportation/drivers', [DriverController::class, 'index'])->middleware('permission:transportation,view')->name('transportation.drivers.index');
        Route::get('/transportation/drivers/create', [DriverController::class, 'create'])->middleware('permission:transportation,create')->name('transportation.drivers.create');
        Route::post('/transportation/drivers', [DriverController::class, 'store'])->middleware('permission:transportation,create')->name('transportation.drivers.store');
        Route::get('/transportation/drivers/{driver}', [DriverController::class, 'show'])->middleware('permission:transportation,view')->name('transportation.drivers.show');
        Route::get('/transportation/drivers/{driver}/edit', [DriverController::class, 'edit'])->middleware('permission:transportation,update')->name('transportation.drivers.edit');
        Route::patch('/transportation/drivers/{driver}', [DriverController::class, 'update'])->middleware('permission:transportation,update')->name('transportation.drivers.update');
        Route::delete('/transportation/drivers/{driver}', [DriverController::class, 'destroy'])->middleware('permission:transportation,delete')->name('transportation.drivers.destroy');

        Route::get('/transportation/trips', [TripController::class, 'index'])->middleware('permission:transportation,view')->name('transportation.trips.index');
        Route::get('/transportation/trips/create', [TripController::class, 'create'])->middleware('permission:transportation,create')->name('transportation.trips.create');
        Route::post('/transportation/trips', [TripController::class, 'store'])->middleware('permission:transportation,create')->name('transportation.trips.store');
        Route::get('/transportation/trips/{trip}', [TripController::class, 'show'])->middleware('permission:transportation,view')->name('transportation.trips.show');
        Route::patch('/transportation/trips/{trip}', [TripController::class, 'update'])->middleware('permission:transportation,update')->name('transportation.trips.update');
        Route::delete('/transportation/trips/{trip}', [TripController::class, 'destroy'])->middleware('permission:transportation,delete')->name('transportation.trips.destroy');
        Route::post('/transportation/trips/{trip}/start', [TripController::class, 'start'])->middleware('permission:transportation,update')->name('transportation.trips.start');
        Route::post('/transportation/trips/{trip}/complete', [TripController::class, 'complete'])->middleware('permission:transportation,update')->name('transportation.trips.complete');
        Route::post('/transportation/trips/{trip}/cancel', [TripController::class, 'cancel'])->middleware('permission:transportation,update')->name('transportation.trips.cancel');

        Route::post('/transportation/trips/{trip}/checkpoints', [TripCheckpointController::class, 'store'])->middleware('permission:transportation,create')->name('transportation.trips.checkpoints.store');
        Route::delete('/transportation/trips/{trip}/checkpoints/{checkpoint}', [TripCheckpointController::class, 'destroy'])->middleware('permission:transportation,delete')->name('transportation.trips.checkpoints.destroy');

        Route::get('/transportation/reports', [ReportController::class, 'index'])->middleware('permission:transportation,view')->name('transportation.reports.index');
    }
}
