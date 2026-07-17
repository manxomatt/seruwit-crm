<?php

namespace Modules\TransportationManagement;

use App\Modules\ModuleContract;
use Illuminate\Support\Facades\Route;
use Modules\TransportationManagement\Http\Controllers\ReportController;
use Modules\TransportationManagement\Http\Controllers\TripCheckpointController;
use Modules\TransportationManagement\Http\Controllers\TripController;

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
        return 'Trip dispatch, checkpoint tracking, and cost/utilization reports for the Fleet module\'s vehicles and drivers.';
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete'];
    }

    /**
     * Trips are dispatched for a Fleet vehicle and driver, and Reports
     * aggregate across Fleet's own tables — Transportation cannot stand on
     * its own without it.
     */
    public function requires(): array
    {
        return ['fleet'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Transportation',
            'slug' => 'transportation',
            'icon' => 'transportation',
            'route_name' => 'transportation.trips.index',
            'permission_module' => 'transportation',
            'permission_action' => 'view',
            'sort_order' => 6,
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
        Route::redirect('/transportation', '/transportation/trips');

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
