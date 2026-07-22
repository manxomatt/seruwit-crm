<?php

namespace Modules\Inventory;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Inventory\Http\Controllers\StockLevelController;
use Modules\Inventory\Http\Controllers\StockMovementController;
use Modules\Inventory\Http\Controllers\StockOpnameController;
use Modules\Inventory\Http\Controllers\WarehouseController;
use Modules\Inventory\Http\Controllers\WarehouseLocationController;

class InventoryModule implements ModuleContract
{
    public function key(): string
    {
        return 'inventory';
    }

    public function label(): string
    {
        return 'Inventory';
    }

    public function description(): string
    {
        return 'Warehouse & stock management, movement tracking, low-stock alerts';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function requires(): array
    {
        return ['products'];
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'adjust'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Inventory',
            'slug' => 'inventory',
            'icon' => 'archive',
            'route_name' => 'inventory.warehouses.index',
            'sort_order' => 90,
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

    public function routes(): void
    {
        Route::middleware(['auth', 'permission:inventory,view'])->group(function (): void {
            Route::get('/inventory', function () {
                return redirect('/module/inventory/warehouses');
            });

            Route::prefix('inventory')->name('inventory.')->group(function (): void {
                // Warehouse Locations (before wildcard)
                Route::get('/warehouses/{warehouse}/locations/create', [WarehouseLocationController::class, 'create'])->middleware('permission:inventory,create')->name('warehouses.locations.create');
                Route::post('/warehouses/{warehouse}/locations', [WarehouseLocationController::class, 'store'])->middleware('permission:inventory,create')->name('warehouses.locations.store');
                Route::get('/warehouses/{warehouse}/locations/{location}/edit', [WarehouseLocationController::class, 'edit'])->middleware('permission:inventory,update')->name('warehouses.locations.edit');
                Route::patch('/warehouses/{warehouse}/locations/{location}', [WarehouseLocationController::class, 'update'])->middleware('permission:inventory,update')->name('warehouses.locations.update');
                Route::delete('/warehouses/{warehouse}/locations/{location}', [WarehouseLocationController::class, 'destroy'])->middleware('permission:inventory,update')->name('warehouses.locations.destroy');

                // Warehouses
                Route::get('/warehouses', [WarehouseController::class, 'index'])->name('warehouses.index');
                Route::get('/warehouses/create', [WarehouseController::class, 'create'])->middleware('permission:inventory,create')->name('warehouses.create');
                Route::post('/warehouses', [WarehouseController::class, 'store'])->middleware('permission:inventory,create')->name('warehouses.store');
                Route::get('/warehouses/{warehouse}', [WarehouseController::class, 'show'])->name('warehouses.show');
                Route::patch('/warehouses/{warehouse}', [WarehouseController::class, 'update'])->middleware('permission:inventory,update')->name('warehouses.update');
                Route::delete('/warehouses/{warehouse}', [WarehouseController::class, 'destroy'])->middleware('permission:inventory,update')->name('warehouses.destroy');

                // Stock Levels
                Route::get('/stock-levels', [StockLevelController::class, 'index'])->name('stock-levels.index');

                // Stock Movements (ledger)
                Route::get('/stock-movements', [StockMovementController::class, 'index'])->name('stock-movements.index');
                Route::get('/stock-movements/create', [StockMovementController::class, 'create'])->middleware('permission:inventory,adjust')->name('stock-movements.create');
                Route::post('/stock-movements', [StockMovementController::class, 'store'])->middleware('permission:inventory,adjust')->name('stock-movements.store');

                // Stock Opnames
                Route::get('/stock-opnames', [StockOpnameController::class, 'index'])->name('stock-opnames.index');
                Route::get('/stock-opnames/create', [StockOpnameController::class, 'create'])->middleware('permission:inventory,create')->name('stock-opnames.create');
                Route::post('/stock-opnames', [StockOpnameController::class, 'store'])->middleware('permission:inventory,create')->name('stock-opnames.store');
                Route::get('/stock-opnames/{opname}', [StockOpnameController::class, 'show'])->name('stock-opnames.show');
                Route::patch('/stock-opnames/{opname}/counts', [StockOpnameController::class, 'updateCounts'])->middleware('permission:inventory,update')->name('stock-opnames.counts');
                Route::post('/stock-opnames/{opname}/finalize', [StockOpnameController::class, 'finalize'])->middleware('permission:inventory,adjust')->name('stock-opnames.finalize');
            });
        });
    }

    public function boot(): void {}
}
