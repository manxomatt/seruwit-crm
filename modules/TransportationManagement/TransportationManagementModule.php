<?php

namespace Modules\TransportationManagement;

use App\Modules\ModuleContract;
use Illuminate\Support\Facades\Route;
use Modules\TransportationManagement\Http\Controllers\CalendarController;
use Modules\TransportationManagement\Http\Controllers\ReportController;
use Modules\TransportationManagement\Http\Controllers\TripCheckpointController;
use Modules\TransportationManagement\Http\Controllers\TripController;
use Modules\TransportationManagement\Http\Controllers\TripItemController;
use Modules\TransportationManagement\Http\Controllers\TripScheduleController;

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
     * Trips are dispatched for a Fleet vehicle and driver bound for a
     * Customer and may carry a cargo manifest of Products — Transportation
     * cannot stand on its own without any of them.
     */
    public function requires(): array
    {
        return ['fleet', 'customers', 'products'];
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

        Route::post('/transportation/trips/{trip}/items', [TripItemController::class, 'store'])->middleware('permission:transportation,create')->name('transportation.trips.items.store');
        Route::delete('/transportation/trips/{trip}/items/{item}', [TripItemController::class, 'destroy'])->middleware('permission:transportation,delete')->name('transportation.trips.items.destroy');

        Route::get('/transportation/reports', [ReportController::class, 'index'])->middleware('permission:transportation,view')->name('transportation.reports.index');

        Route::get('/transportation/calendar', [CalendarController::class, 'index'])->middleware('permission:transportation,view')->name('transportation.calendar.index');

        Route::get('/transportation/schedules', [TripScheduleController::class, 'index'])->middleware('permission:transportation,view')->name('transportation.schedules.index');
        Route::get('/transportation/schedules/create', [TripScheduleController::class, 'create'])->middleware('permission:transportation,create')->name('transportation.schedules.create');
        Route::post('/transportation/schedules', [TripScheduleController::class, 'store'])->middleware('permission:transportation,create')->name('transportation.schedules.store');
        Route::post('/transportation/schedules/generate', [TripScheduleController::class, 'generate'])->middleware('permission:transportation,create')->name('transportation.schedules.generate');
        Route::get('/transportation/schedules/{schedule}', [TripScheduleController::class, 'show'])->middleware('permission:transportation,view')->name('transportation.schedules.show');
        Route::get('/transportation/schedules/{schedule}/edit', [TripScheduleController::class, 'edit'])->middleware('permission:transportation,update')->name('transportation.schedules.edit');
        Route::patch('/transportation/schedules/{schedule}', [TripScheduleController::class, 'update'])->middleware('permission:transportation,update')->name('transportation.schedules.update');
        Route::delete('/transportation/schedules/{schedule}', [TripScheduleController::class, 'destroy'])->middleware('permission:transportation,delete')->name('transportation.schedules.destroy');
    }
}
