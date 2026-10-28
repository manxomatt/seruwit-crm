<?php

namespace Modules\Driver;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Driver\Http\Controllers\DriverAccountController;
use Modules\Driver\Http\Controllers\DriverController;

/**
 * Driver management foundation module: handles driver profiles, licenses,
 * emergency contacts, logins, and operational availability.
 *
 * Sits in the Foundation tier alongside Fleet and Partners, so consumer modules
 * (Rental, Shuttle, Transportation, Orders, DriverScoring) can reference drivers
 * without tight coupling to the vehicle asset itself.
 */
class DriverModule implements ModuleContract
{
    public function key(): string
    {
        return 'driver';
    }

    public function label(): string
    {
        return 'Pengemudi';
    }

    public function description(): string
    {
        return 'Manajemen profil pengemudi, klasifikasi & masa berlaku SIM, akun login sopir, dan status ketersediaan.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function permissions(): array
    {
        return [
            'view',
            'create',
            'update',
            'delete',
        ];
    }

    public function requires(): array
    {
        return [];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Pengemudi',
            'slug' => 'driver',
            'icon' => 'driver',
            'route_name' => 'drivers.index',
            'permission_module' => 'driver',
            'permission_action' => 'view',
            'sort_order' => 4,
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
        // Primary standalone routes: /drivers/*
        Route::get('/drivers', [DriverController::class, 'index'])->middleware('permission:driver|fleet,view')->name('drivers.index');
        Route::get('/drivers/create', [DriverController::class, 'create'])->middleware('permission:driver|fleet,create')->name('drivers.create');
        Route::post('/drivers', [DriverController::class, 'store'])->middleware('permission:driver|fleet,create')->name('drivers.store');
        Route::patch('/drivers/batch-status', [DriverController::class, 'batchUpdateStatus'])->middleware('permission:driver|fleet,update')->name('drivers.batch-status');
        Route::post('/drivers/batch-destroy', [DriverController::class, 'batchDestroy'])->middleware('permission:driver|fleet,delete')->name('drivers.batch-destroy');
        Route::get('/drivers/{driver}', [DriverController::class, 'show'])->middleware('permission:driver|fleet,view')->name('drivers.show');
        Route::get('/drivers/{driver}/edit', [DriverController::class, 'edit'])->middleware('permission:driver|fleet,update')->name('drivers.edit');
        Route::patch('/drivers/{driver}', [DriverController::class, 'update'])->middleware('permission:driver|fleet,update')->name('drivers.update');
        Route::delete('/drivers/{driver}', [DriverController::class, 'destroy'])->middleware('permission:driver|fleet,delete')->name('drivers.destroy');
        Route::post('/drivers/{driver}/account', [DriverAccountController::class, 'store'])->middleware('permission:driver|fleet,update')->name('drivers.account.store');

        // Backward compatibility routes & names
        Route::get('/fleet/drivers', [DriverController::class, 'index'])->middleware('permission:driver|fleet,view')->name('fleet.drivers.index');
        Route::get('/fleet/drivers/create', [DriverController::class, 'create'])->middleware('permission:driver|fleet,create')->name('fleet.drivers.create');
        Route::post('/fleet/drivers', [DriverController::class, 'store'])->middleware('permission:driver|fleet,create')->name('fleet.drivers.store');
        Route::patch('/fleet/drivers/batch-status', [DriverController::class, 'batchUpdateStatus'])->middleware('permission:driver|fleet,update')->name('fleet.drivers.batch-status');
        Route::post('/fleet/drivers/batch-destroy', [DriverController::class, 'batchDestroy'])->middleware('permission:driver|fleet,delete')->name('fleet.drivers.batch-destroy');
        Route::get('/fleet/drivers/{driver}', [DriverController::class, 'show'])->middleware('permission:driver|fleet,view')->name('fleet.drivers.show');
        Route::get('/fleet/drivers/{driver}/edit', [DriverController::class, 'edit'])->middleware('permission:driver|fleet,update')->name('fleet.drivers.edit');
        Route::patch('/fleet/drivers/{driver}', [DriverController::class, 'update'])->middleware('permission:driver|fleet,update')->name('fleet.drivers.update');
        Route::delete('/fleet/drivers/{driver}', [DriverController::class, 'destroy'])->middleware('permission:driver|fleet,delete')->name('fleet.drivers.destroy');
        Route::post('/fleet/drivers/{driver}/account', [DriverAccountController::class, 'store'])->middleware('permission:driver|fleet,update')->name('fleet.drivers.account.store');
    }
}
