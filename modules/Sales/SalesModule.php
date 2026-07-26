<?php

namespace Modules\Sales;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Sales\Http\Controllers\GoodsIssueNoteController;
use Modules\Sales\Http\Controllers\SalesOrderController;
use Modules\Sales\Http\Controllers\SalesPdfController;
use Modules\Sales\Http\Controllers\SalesReturnController;

/**
 * Sales orders and goods issue notes for outbound fulfillment.
 *
 * Depends on Partners (customers), Products (line items), and Inventory
 * (warehouses + StockMovementRecorder) without teaching those modules
 * anything about sales.
 */
class SalesModule implements ModuleContract
{
    public function key(): string
    {
        return 'sales';
    }

    public function label(): string
    {
        return 'Sales';
    }

    public function description(): string
    {
        return 'Sales orders and goods issue notes (GIN) with automatic stock outbound.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete', 'issue'];
    }

    public function requires(): array
    {
        return ['partners', 'products', 'inventory'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Sales',
            'slug' => 'sales',
            'icon' => 'sales',
            'route_name' => 'sales.sales-orders.index',
            'permission_module' => 'sales',
            'permission_action' => 'view',
            'sort_order' => 92,
        ];
    }

    public function migrationsPath(): string
    {
        return __DIR__.'/Database/Migrations';
    }

    public function viewsPath(): ?string
    {
        return __DIR__.'/resources/views';
    }

    public function boot(): void
    {
        //
    }

    public function routes(): void
    {
        Route::middleware(['auth', 'permission:sales,view'])->group(function (): void {
            Route::get('/sales', function () {
                return redirect('/module/sales/sales-orders');
            });

            Route::prefix('sales')->name('sales.')->group(function (): void {
                Route::get('/sales-orders', [SalesOrderController::class, 'index'])->name('sales-orders.index');
                Route::get('/sales-orders/create', [SalesOrderController::class, 'create'])->middleware('permission:sales,create')->name('sales-orders.create');
                Route::post('/sales-orders', [SalesOrderController::class, 'store'])->middleware('permission:sales,create')->name('sales-orders.store');
                Route::get('/sales-orders/{so}', [SalesOrderController::class, 'show'])->name('sales-orders.show');
                Route::get('/sales-orders/{so}/edit', [SalesOrderController::class, 'edit'])->middleware('permission:sales,update')->name('sales-orders.edit');
                Route::patch('/sales-orders/{so}', [SalesOrderController::class, 'update'])->middleware('permission:sales,update')->name('sales-orders.update');
                Route::delete('/sales-orders/{so}', [SalesOrderController::class, 'destroy'])->middleware('permission:sales,delete')->name('sales-orders.destroy');
                Route::post('/sales-orders/{so}/confirm', [SalesOrderController::class, 'confirm'])->middleware('permission:sales,update')->name('sales-orders.confirm');
                Route::post('/sales-orders/{so}/cancel', [SalesOrderController::class, 'cancel'])->middleware('permission:sales,update')->name('sales-orders.cancel');
                Route::post('/sales-orders/{so}/close', [SalesOrderController::class, 'close'])->middleware('permission:sales,update')->name('sales-orders.close');
                Route::post('/sales-orders/{so}/invoice', [SalesOrderController::class, 'invoice'])->middleware('permission:sales,create')->name('sales-orders.invoice');
                Route::get('/sales-orders/{so}/pdf', [SalesPdfController::class, 'salesOrder'])->name('sales-orders.pdf');

                Route::get('/sales-orders/{so}/gin/create', [GoodsIssueNoteController::class, 'create'])->middleware('permission:sales,create')->name('sales-orders.gin.create');
                Route::post('/sales-orders/{so}/gin', [GoodsIssueNoteController::class, 'store'])->middleware('permission:sales,create')->name('sales-orders.gin.store');
                Route::get('/gin/{gin}', [GoodsIssueNoteController::class, 'show'])->name('gin.show');
                Route::get('/gin/{gin}/pdf', [SalesPdfController::class, 'gin'])->name('gin.pdf');
                Route::post('/gin/{gin}/confirm', [GoodsIssueNoteController::class, 'confirm'])->middleware('permission:sales,issue')->name('gin.confirm');
                Route::post('/gin/{gin}/void', [GoodsIssueNoteController::class, 'void'])->middleware('permission:sales,issue')->name('gin.void');
                Route::post('/gin/{gin}/invoice', [GoodsIssueNoteController::class, 'invoice'])->middleware('permission:sales,create')->name('gin.invoice');

                Route::get('/gin/{gin}/return/create', [SalesReturnController::class, 'create'])->middleware('permission:sales,create')->name('gin.return.create');
                Route::post('/gin/{gin}/return', [SalesReturnController::class, 'store'])->middleware('permission:sales,create')->name('gin.return.store');
                Route::get('/returns/{salesReturn}', [SalesReturnController::class, 'show'])->name('returns.show');
                Route::post('/returns/{salesReturn}/confirm', [SalesReturnController::class, 'confirm'])->middleware('permission:sales,issue')->name('returns.confirm');
            });
        });
    }
}
