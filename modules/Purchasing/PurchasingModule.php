<?php

namespace Modules\Purchasing;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Purchasing\Http\Controllers\GoodReceiptNoteController;
use Modules\Purchasing\Http\Controllers\PurchaseOrderController;

/**
 * Purchase orders and goods receipt notes for inbound procurement.
 *
 * Depends on Partners (suppliers), Products (line items), and Inventory
 * (warehouses + StockMovementRecorder) without teaching those modules
 * anything about purchasing.
 */
class PurchasingModule implements ModuleContract
{
    public function key(): string
    {
        return 'purchasing';
    }

    public function label(): string
    {
        return 'Purchasing';
    }

    public function description(): string
    {
        return 'Purchase orders and goods receipt notes (GRN) with automatic stock inbound.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete', 'receive'];
    }

    public function requires(): array
    {
        return ['partners', 'products', 'inventory'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Purchasing',
            'slug' => 'purchasing',
            'icon' => 'purchasing',
            'route_name' => 'purchasing.purchase-orders.index',
            'permission_module' => 'purchasing',
            'permission_action' => 'view',
            'sort_order' => 91,
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
        Route::middleware(['auth', 'permission:purchasing,view'])->group(function (): void {
            Route::get('/purchasing', function () {
                return redirect('/module/purchasing/purchase-orders');
            });

            Route::prefix('purchasing')->name('purchasing.')->group(function (): void {
                Route::get('/purchase-orders', [PurchaseOrderController::class, 'index'])->name('purchase-orders.index');
                Route::get('/purchase-orders/create', [PurchaseOrderController::class, 'create'])->middleware('permission:purchasing,create')->name('purchase-orders.create');
                Route::post('/purchase-orders', [PurchaseOrderController::class, 'store'])->middleware('permission:purchasing,create')->name('purchase-orders.store');
                Route::get('/purchase-orders/{po}', [PurchaseOrderController::class, 'show'])->name('purchase-orders.show');
                Route::get('/purchase-orders/{po}/edit', [PurchaseOrderController::class, 'edit'])->middleware('permission:purchasing,update')->name('purchase-orders.edit');
                Route::patch('/purchase-orders/{po}', [PurchaseOrderController::class, 'update'])->middleware('permission:purchasing,update')->name('purchase-orders.update');
                Route::delete('/purchase-orders/{po}', [PurchaseOrderController::class, 'destroy'])->middleware('permission:purchasing,delete')->name('purchase-orders.destroy');
                Route::post('/purchase-orders/{po}/submit', [PurchaseOrderController::class, 'submit'])->middleware('permission:purchasing,update')->name('purchase-orders.submit');
                Route::post('/purchase-orders/{po}/approve', [PurchaseOrderController::class, 'approve'])->middleware('permission:purchasing,update')->name('purchase-orders.approve');
                Route::post('/purchase-orders/{po}/cancel', [PurchaseOrderController::class, 'cancel'])->middleware('permission:purchasing,update')->name('purchase-orders.cancel');
                Route::post('/purchase-orders/{po}/close', [PurchaseOrderController::class, 'close'])->middleware('permission:purchasing,update')->name('purchase-orders.close');

                Route::get('/purchase-orders/{po}/grn/create', [GoodReceiptNoteController::class, 'create'])->middleware('permission:purchasing,create')->name('purchase-orders.grn.create');
                Route::post('/purchase-orders/{po}/grn', [GoodReceiptNoteController::class, 'store'])->middleware('permission:purchasing,create')->name('purchase-orders.grn.store');
                Route::get('/grn/{grn}', [GoodReceiptNoteController::class, 'show'])->name('grn.show');
                Route::post('/grn/{grn}/confirm', [GoodReceiptNoteController::class, 'confirm'])->middleware('permission:purchasing,receive')->name('grn.confirm');
            });
        });
    }
}
