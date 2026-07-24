<?php

namespace Modules\Outbound;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Outbound\Http\Controllers\PackController;
use Modules\Outbound\Http\Controllers\PickListController;

/**
 * Warehouse pick / pack outbound for delivery orders.
 *
 * Generates pick lists from DOs, confirms picks per location/batch,
 * packs with labels, then dispatches stock out before the trip leaves.
 */
class OutboundModule implements ModuleContract
{
    public function key(): string
    {
        return 'outbound';
    }

    public function label(): string
    {
        return 'Outbound';
    }

    public function description(): string
    {
        return 'Pick lists, per-item pick confirmation, pack & label, and stock dispatch for outbound delivery orders.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete', 'pick', 'pack', 'dispatch'];
    }

    public function requires(): array
    {
        return ['orders', 'inventory', 'products'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Outbound',
            'slug' => 'outbound',
            'icon' => 'outbound',
            'route_name' => 'outbound.pick-lists.index',
            'permission_module' => 'outbound',
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
        Route::middleware(['auth', 'permission:outbound,view'])->group(function (): void {
            Route::get('/outbound', function () {
                return redirect('/module/outbound/pick-lists');
            });

            Route::prefix('outbound')->name('outbound.')->group(function (): void {
                Route::get('/pick-lists', [PickListController::class, 'index'])->name('pick-lists.index');
                Route::get('/pick-lists/create', [PickListController::class, 'create'])->middleware('permission:outbound,create')->name('pick-lists.create');
                Route::post('/pick-lists', [PickListController::class, 'store'])->middleware('permission:outbound,create')->name('pick-lists.store');
                Route::get('/pick-lists/{pickList}', [PickListController::class, 'show'])->name('pick-lists.show');
                Route::post('/pick-lists/{pickList}/cancel', [PickListController::class, 'cancel'])->middleware('permission:outbound,delete')->name('pick-lists.cancel');
                Route::post('/pick-lists/{pickList}/items/{item}/confirm', [PickListController::class, 'confirmItem'])->middleware('permission:outbound,pick')->name('pick-lists.items.confirm');
                Route::post('/pick-lists/{pickList}/complete-picking', [PickListController::class, 'completePicking'])->middleware('permission:outbound,pick')->name('pick-lists.complete-picking');
                Route::post('/pick-lists/{pickList}/dispatch', [PickListController::class, 'dispatch'])->middleware('permission:outbound,dispatch')->name('pick-lists.dispatch');

                Route::get('/pick-lists/{pickList}/packs/create', [PackController::class, 'create'])->middleware('permission:outbound,pack')->name('packs.create');
                Route::post('/pick-lists/{pickList}/packs', [PackController::class, 'store'])->middleware('permission:outbound,pack')->name('packs.store');
                Route::get('/packs/{pack}', [PackController::class, 'show'])->name('packs.show');
                Route::get('/packs/{pack}/label', [PackController::class, 'label'])->name('packs.label');
                Route::post('/packs/{pack}/seal', [PackController::class, 'seal'])->middleware('permission:outbound,pack')->name('packs.seal');
            });
        });
    }
}
