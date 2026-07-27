<?php

namespace Modules\Pos;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Pos\Http\Controllers\PosSaleController;
use Modules\Pos\Http\Controllers\PosShiftController;
use Modules\Pos\Http\Controllers\TerminalController;

/**
 * Point of Sale for store cashiers — atomic sale + stock out, not SO→GIN.
 */
class PosModule implements ModuleContract
{
    public function key(): string
    {
        return 'pos';
    }

    public function label(): string
    {
        return 'POS';
    }

    public function description(): string
    {
        return 'Cashier terminal for store sales: scan, pay, stock out, and shift reconciliation.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function permissions(): array
    {
        return ['view', 'sell', 'open_shift', 'close_shift', 'void', 'refund'];
    }

    public function requires(): array
    {
        return ['products', 'inventory'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'POS',
            'slug' => 'pos',
            'icon' => 'pos',
            'route_name' => 'pos.terminal',
            'permission_module' => 'pos',
            'permission_action' => 'view',
            'sort_order' => 9,
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
        Route::middleware(['auth', 'permission:pos,view'])->group(function (): void {
            Route::prefix('pos')->name('pos.')->group(function (): void {
                Route::get('/terminal', [TerminalController::class, 'show'])->name('terminal');
                Route::get('/products/search', [TerminalController::class, 'searchProducts'])
                    ->middleware('permission:pos,sell')
                    ->name('products.search');

                Route::get('/shifts', [PosShiftController::class, 'index'])->name('shifts.index');
                Route::post('/shifts', [PosShiftController::class, 'store'])
                    ->middleware('permission:pos,open_shift')
                    ->name('shifts.store');
                Route::get('/shifts/{shift}', [PosShiftController::class, 'show'])->name('shifts.show');
                Route::post('/shifts/{shift}/close', [PosShiftController::class, 'close'])
                    ->middleware('permission:pos,close_shift')
                    ->name('shifts.close');

                Route::get('/sales', [PosSaleController::class, 'index'])->name('sales.index');
                Route::post('/sales', [PosSaleController::class, 'store'])
                    ->middleware('permission:pos,sell')
                    ->name('sales.store');
                Route::get('/sales/{sale}', [PosSaleController::class, 'show'])->name('sales.show');
                Route::post('/sales/{sale}/void', [PosSaleController::class, 'voidSale'])
                    ->middleware('permission:pos,void')
                    ->name('sales.void');
            });
        });
    }
}
