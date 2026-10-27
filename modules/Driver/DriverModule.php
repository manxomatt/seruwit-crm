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
            'route_name' => 'fleet.drivers.index',
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
        // Standalone driver routes
        Route::get('/drivers', [DriverController::class, 'index'])->name('driver.drivers.index');
        Route::get('/drivers/create', [DriverController::class, 'create'])->name('driver.drivers.create');
        Route::post('/drivers', [DriverController::class, 'store'])->name('driver.drivers.store');
        Route::patch('/drivers/batch-status', [DriverController::class, 'batchUpdateStatus'])->name('driver.drivers.batch-status');
        Route::post('/drivers/batch-destroy', [DriverController::class, 'batchDestroy'])->name('driver.drivers.batch-destroy');
        Route::get('/drivers/{driver}', [DriverController::class, 'show'])->name('driver.drivers.show');
        Route::get('/drivers/{driver}/edit', [DriverController::class, 'edit'])->name('driver.drivers.edit');
        Route::patch('/drivers/{driver}', [DriverController::class, 'update'])->name('driver.drivers.update');
        Route::delete('/drivers/{driver}', [DriverController::class, 'destroy'])->name('driver.drivers.destroy');
        Route::post('/drivers/{driver}/account', [DriverAccountController::class, 'store'])->name('driver.drivers.account.store');

        // Backward compatibility routes under /fleet/drivers, gated by sub-feature kill switch
        Route::middleware('requires-module:fleet-drivers')->group(function (): void {
            Route::get('/fleet/drivers', [DriverController::class, 'index'])->name('fleet.drivers.index');
            Route::get('/fleet/drivers/create', [DriverController::class, 'create'])->name('fleet.drivers.create');
            Route::post('/fleet/drivers', [DriverController::class, 'store'])->name('fleet.drivers.store');
            Route::patch('/fleet/drivers/batch-status', [DriverController::class, 'batchUpdateStatus'])->name('fleet.drivers.batch-status');
            Route::post('/fleet/drivers/batch-destroy', [DriverController::class, 'batchDestroy'])->name('fleet.drivers.batch-destroy');
            Route::get('/fleet/drivers/{driver}', [DriverController::class, 'show'])->name('fleet.drivers.show');
            Route::get('/fleet/drivers/{driver}/edit', [DriverController::class, 'edit'])->name('fleet.drivers.edit');
            Route::patch('/fleet/drivers/{driver}', [DriverController::class, 'update'])->name('fleet.drivers.update');
            Route::delete('/fleet/drivers/{driver}', [DriverController::class, 'destroy'])->name('fleet.drivers.destroy');
            Route::post('/fleet/drivers/{driver}/account', [DriverAccountController::class, 'store'])->name('fleet.drivers.account.store');
        });
    }
}
