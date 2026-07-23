<?php

namespace Modules\Rental;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Rental\Http\Controllers\RentalActionController;
use Modules\Rental\Http\Controllers\RentalController;
use Modules\Rental\Http\Controllers\RentalRateController;

/**
 * Vehicle rental management: booking, checkout, return, damage reporting, and
 * pricing tariffs.
 *
 * A Vertical module that depends on Fleet for vehicles and drivers, Partners for
 * customers, and Invoicing for billing. Fleet stays ignorant of Rental; the
 * availability check flows downward via Rental::vehicleAvailabilityReasons().
 *
 * When Transportation is also installed, StoreRentalRequest checks for trip
 * conflicts via Modules::available('transportation') so the two Verticals share
 * Fleet without double-booking.
 */
class RentalModule implements ModuleContract
{
    public function key(): string
    {
        return 'rental';
    }

    public function label(): string
    {
        return 'Rental';
    }

    public function description(): string
    {
        return 'Vehicle rental management: bookings, checkout, returns, damage reports, and tariff rates.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete', 'approve'];
    }

    public function requires(): array
    {
        return ['fleet', 'partners', 'invoicing'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Rental',
            'slug' => 'rental',
            'icon' => 'key',
            'route_name' => 'rental.index',
            'permission_module' => 'rental',
            'permission_action' => 'view',
            'sort_order' => 11,
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
        Route::redirect('/rental', '/rental/list');

        // Tariff rates
        Route::get('/rental/rates', [RentalRateController::class, 'index'])->middleware('permission:rental,view')->name('rental.rates.index');
        Route::post('/rental/rates', [RentalRateController::class, 'store'])->middleware('permission:rental,create')->name('rental.rates.store');
        Route::patch('/rental/rates/{rate}', [RentalRateController::class, 'update'])->middleware('permission:rental,update')->name('rental.rates.update');
        Route::delete('/rental/rates/{rate}', [RentalRateController::class, 'destroy'])->middleware('permission:rental,delete')->name('rental.rates.destroy');

        // Rentals CRUD
        Route::get('/rental/list', [RentalController::class, 'index'])->middleware('permission:rental,view')->name('rental.index');
        Route::get('/rental/create', [RentalController::class, 'create'])->middleware('permission:rental,create')->name('rental.create');
        Route::post('/rental', [RentalController::class, 'store'])->middleware('permission:rental,create')->name('rental.store');
        Route::get('/rental/{rental}', [RentalController::class, 'show'])->middleware('permission:rental,view')->name('rental.show');
        Route::get('/rental/{rental}/edit', [RentalController::class, 'edit'])->middleware('permission:rental,update')->name('rental.edit');
        Route::patch('/rental/{rental}', [RentalController::class, 'update'])->middleware('permission:rental,update')->name('rental.update');
        Route::delete('/rental/{rental}', [RentalController::class, 'destroy'])->middleware('permission:rental,delete')->name('rental.destroy');

        // Lifecycle actions
        Route::post('/rental/{rental}/confirm', [RentalActionController::class, 'confirm'])->middleware('permission:rental,approve')->name('rental.confirm');
        Route::post('/rental/{rental}/checkout', [RentalActionController::class, 'checkout'])->middleware('permission:rental,update')->name('rental.checkout');
        Route::post('/rental/{rental}/return', [RentalActionController::class, 'return'])->middleware('permission:rental,update')->name('rental.return');
        Route::post('/rental/{rental}/complete', [RentalActionController::class, 'complete'])->middleware('permission:rental,approve')->name('rental.complete');
        Route::post('/rental/{rental}/cancel', [RentalActionController::class, 'cancel'])->middleware('permission:rental,update')->name('rental.cancel');
        Route::post('/rental/{rental}/extend', [RentalActionController::class, 'extend'])->middleware('permission:rental,update')->name('rental.extend');
        Route::post('/rental/{rental}/damages', [RentalActionController::class, 'storeDamage'])->middleware('permission:rental,update')->name('rental.damages.store');
        Route::delete('/rental/{rental}/damages/{damage}', [RentalActionController::class, 'destroyDamage'])->middleware('permission:rental,update')->name('rental.damages.destroy');
    }
}
