<?php

namespace Modules\Inventory;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Inventory\Http\Controllers\StockLevelController;
use Modules\Inventory\Http\Controllers\StockMovementController;
use Modules\Inventory\Http\Controllers\StockOpnameController;
use Modules\Inventory\Http\Controllers\WarehouseController;

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
        return [];
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
            Route::prefix('inventory')->name('inventory.')->group(function (): void {
                // Warehouses
                Route::get('/warehouses', [WarehouseController::class, 'index'])->name('warehouses.index');
                Route::post('/warehouses', [WarehouseController::class, 'store'])->middleware('permission:inventory,create')->name('warehouses.store');
                Route::get('/warehouses/{warehouse}', [WarehouseController::class, 'show'])->name('warehouses.show');
                Route::patch('/warehouses/{warehouse}', [WarehouseController::class, 'update'])->middleware('permission:inventory,update')->name('warehouses.update');
                Route::delete('/warehouses/{warehouse}', [WarehouseController::class, 'destroy'])->middleware('permission:inventory,update')->name('warehouses.destroy');

                // Stock Levels
                Route::get('/stock-levels', [StockLevelController::class, 'index'])->name('stock-levels.index');

                // Stock Movements (ledger)
                Route::get('/stock-movements', [StockMovementController::class, 'index'])->name('stock-movements.index');

                // Stock Opnames
                Route::get('/stock-opnames', [StockOpnameController::class, 'index'])->name('stock-opnames.index');
                Route::post('/stock-opnames', [StockOpnameController::class, 'store'])->middleware('permission:inventory,create')->name('stock-opnames.store');
                Route::get('/stock-opnames/{opname}', [StockOpnameController::class, 'show'])->name('stock-opnames.show');
                Route::patch('/stock-opnames/{opname}', [StockOpnameController::class, 'update'])->middleware('permission:inventory,update')->name('stock-opnames.update');
                Route::post('/stock-opnames/{opname}/finalize', [StockOpnameController::class, 'finalize'])->middleware('permission:inventory,adjust')->name('stock-opnames.finalize');
            });
        });
    }

    public function boot(): void {}
}
