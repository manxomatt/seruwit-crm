<?php

namespace Modules\Shuttle;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Shuttle\Http\Controllers\BookingActionController;
use Modules\Shuttle\Http\Controllers\BookingController;
use Modules\Shuttle\Http\Controllers\CorridorController;
use Modules\Shuttle\Http\Controllers\DepartureActionController;
use Modules\Shuttle\Http\Controllers\DepartureController;
use Modules\Shuttle\Http\Controllers\DirectionsController;
use Modules\Shuttle\Http\Controllers\PartnerPortalController;
use Modules\Shuttle\Http\Controllers\ScheduleController;
use Modules\Shuttle\Http\Controllers\SettingsController;
use Modules\Shuttle\Http\Controllers\ShuttleDashboardController;

/**
 * Scheduled intercity shuttle travel: corridors, seat bookings, door/pool
 * pickup & dropoff, and per-departure route optimisation.
 *
 * Vertical module on Fleet + Partners + Invoicing. Does not own cargo trips —
 * Transportation/Rental conflicts are soft-checked when those modules exist.
 */
class ShuttleModule implements ModuleContract
{
    public function key(): string
    {
        return 'shuttle';
    }

    public function label(): string
    {
        return 'Travel';
    }

    public function description(): string
    {
        return 'Scheduled shuttle travel: corridors, seat bookings, door/pool stops, and route optimisation.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete', 'confirm', 'dispatch', 'optimize'];
    }

    public function requires(): array
    {
        return ['fleet', 'partners', 'invoicing'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Travel',
            'slug' => 'shuttle',
            'icon' => 'transportation',
            'route_name' => 'shuttle.dashboard',
            'permission_module' => 'shuttle',
            'permission_action' => 'view',
            'sort_order' => 13,
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

    public function boot(): void
    {
        //
    }

    public function routes(): void
    {
        Route::redirect('/shuttle', '/shuttle/dashboard');

        Route::get('/shuttle/dashboard', [ShuttleDashboardController::class, 'index'])
            ->middleware('permission:shuttle,view')
            ->name('shuttle.dashboard');

        Route::get('/shuttle/directions', DirectionsController::class)
            ->middleware('permission:shuttle,view')
            ->name('shuttle.directions');

        // Settings (general + cities + pools)
        Route::get('/shuttle/settings', [SettingsController::class, 'index'])->middleware('permission:shuttle,view')->name('shuttle.settings.index');
        Route::patch('/shuttle/settings/general', [SettingsController::class, 'updateGeneral'])->middleware('permission:shuttle,update')->name('shuttle.settings.general');
        Route::post('/shuttle/settings/cities', [SettingsController::class, 'storeCity'])->middleware('permission:shuttle,create')->name('shuttle.settings.cities.store');
        Route::patch('/shuttle/settings/cities/{city}', [SettingsController::class, 'updateCity'])->middleware('permission:shuttle,update')->name('shuttle.settings.cities.update');
        Route::delete('/shuttle/settings/cities/{city}', [SettingsController::class, 'destroyCity'])->middleware('permission:shuttle,delete')->name('shuttle.settings.cities.destroy');
        Route::post('/shuttle/settings/pools', [SettingsController::class, 'storePool'])->middleware('permission:shuttle,create')->name('shuttle.settings.pools.store');
        Route::patch('/shuttle/settings/pools/{pool}', [SettingsController::class, 'updatePool'])->middleware('permission:shuttle,update')->name('shuttle.settings.pools.update');
        Route::delete('/shuttle/settings/pools/{pool}', [SettingsController::class, 'destroyPool'])->middleware('permission:shuttle,delete')->name('shuttle.settings.pools.destroy');

        // Corridors
        Route::get('/shuttle/corridors', [CorridorController::class, 'index'])->middleware('permission:shuttle,view')->name('shuttle.corridors.index');
        Route::get('/shuttle/corridors/create', [CorridorController::class, 'create'])->middleware('permission:shuttle,create')->name('shuttle.corridors.create');
        Route::post('/shuttle/corridors', [CorridorController::class, 'store'])->middleware('permission:shuttle,create')->name('shuttle.corridors.store');
        Route::get('/shuttle/corridors/{corridor}/edit', [CorridorController::class, 'edit'])->middleware('permission:shuttle,update')->name('shuttle.corridors.edit');
        Route::patch('/shuttle/corridors/{corridor}', [CorridorController::class, 'update'])->middleware('permission:shuttle,update')->name('shuttle.corridors.update');
        Route::delete('/shuttle/corridors/{corridor}', [CorridorController::class, 'destroy'])->middleware('permission:shuttle,delete')->name('shuttle.corridors.destroy');

        // Schedules
        Route::get('/shuttle/schedules', [ScheduleController::class, 'index'])->middleware('permission:shuttle,view')->name('shuttle.schedules.index');
        Route::get('/shuttle/schedules/create', [ScheduleController::class, 'create'])->middleware('permission:shuttle,create')->name('shuttle.schedules.create');
        Route::post('/shuttle/schedules', [ScheduleController::class, 'store'])->middleware('permission:shuttle,create')->name('shuttle.schedules.store');
        Route::get('/shuttle/schedules/{schedule}/edit', [ScheduleController::class, 'edit'])->middleware('permission:shuttle,update')->name('shuttle.schedules.edit');
        Route::patch('/shuttle/schedules/{schedule}', [ScheduleController::class, 'update'])->middleware('permission:shuttle,update')->name('shuttle.schedules.update');
        Route::delete('/shuttle/schedules/{schedule}', [ScheduleController::class, 'destroy'])->middleware('permission:shuttle,delete')->name('shuttle.schedules.destroy');
        Route::post('/shuttle/schedules/{schedule}/generate', [ScheduleController::class, 'generate'])->middleware('permission:shuttle,create')->name('shuttle.schedules.generate');

        // Departures
        Route::get('/shuttle/departures', [DepartureController::class, 'index'])->middleware('permission:shuttle,view')->name('shuttle.departures.index');
        Route::get('/shuttle/departures/{departure}', [DepartureController::class, 'show'])->middleware('permission:shuttle,view')->name('shuttle.departures.show');
        Route::post('/shuttle/departures/{departure}/lock', [DepartureActionController::class, 'lock'])->middleware('permission:shuttle,update')->name('shuttle.departures.lock');
        Route::post('/shuttle/departures/{departure}/optimize', [DepartureActionController::class, 'optimize'])->middleware('permission:shuttle,optimize')->name('shuttle.departures.optimize');
        Route::post('/shuttle/departures/{departure}/dispatch', [DepartureActionController::class, 'dispatch'])->middleware('permission:shuttle,dispatch')->name('shuttle.departures.dispatch');
        Route::post('/shuttle/departures/{departure}/complete', [DepartureActionController::class, 'complete'])->middleware('permission:shuttle,dispatch')->name('shuttle.departures.complete');

        // Bookings
        Route::get('/shuttle/bookings', [BookingController::class, 'index'])->middleware('permission:shuttle,view')->name('shuttle.bookings.index');
        Route::get('/shuttle/bookings/create', [BookingController::class, 'create'])->middleware('permission:shuttle,create')->name('shuttle.bookings.create');
        Route::post('/shuttle/bookings', [BookingController::class, 'store'])->middleware('permission:shuttle,create')->name('shuttle.bookings.store');
        Route::get('/shuttle/bookings/{booking}', [BookingController::class, 'show'])->middleware('permission:shuttle,view')->name('shuttle.bookings.show');
        Route::post('/shuttle/bookings/{booking}/confirm', [BookingActionController::class, 'confirm'])->middleware('permission:shuttle,confirm')->name('shuttle.bookings.confirm');
        Route::post('/shuttle/bookings/{booking}/cancel', [BookingActionController::class, 'cancel'])->middleware('permission:shuttle,update')->name('shuttle.bookings.cancel');
        Route::post('/shuttle/bookings/{booking}/board', [BookingActionController::class, 'board'])->middleware('permission:shuttle,update')->name('shuttle.bookings.board');

        Route::middleware(['auth'])->prefix('portal')->name('portal.')->group(function (): void {
            Route::get('/shuttle/bookings', [PartnerPortalController::class, 'index'])->name('shuttle.bookings.index');
            Route::get('/shuttle/bookings/{booking}', [PartnerPortalController::class, 'show'])->name('shuttle.bookings.show');
            Route::post('/shuttle/invoices/{invoice}/pay', [PartnerPortalController::class, 'payInvoice'])->name('shuttle.invoices.pay');
        });
    }
}
