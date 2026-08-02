<?php

namespace Modules\Payables;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Payables\Http\Controllers\BillPaymentController;
use Modules\Payables\Http\Controllers\PayablesDashboardController;
use Modules\Payables\Http\Controllers\SupplierBillController;

class PayablesModule implements ModuleContract
{
    public function key(): string
    {
        return 'payables';
    }

    public function label(): string
    {
        return 'Payables';
    }

    public function description(): string
    {
        return 'Accounts payable: supplier bills from GRN and bill payments.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete'];
    }

    public function requires(): array
    {
        return ['partners', 'purchasing'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Payables',
            'slug' => 'payables',
            'icon' => 'payables',
            'route_name' => 'payables.dashboard',
            'permission_module' => 'payables',
            'permission_action' => 'view',
            'sort_order' => 93,
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
        Route::middleware(['auth', 'permission:payables,view'])->group(function (): void {
            Route::get('/payables', [PayablesDashboardController::class, 'index'])->name('payables.dashboard');

            Route::prefix('payables')->name('payables.')->group(function (): void {
                Route::get('/bills', [SupplierBillController::class, 'index'])->name('bills.index');
                Route::get('/bills/{bill}', [SupplierBillController::class, 'show'])->name('bills.show');
                Route::post('/bills/{bill}/issue', [SupplierBillController::class, 'issue'])->middleware('permission:payables,update')->name('bills.issue');
                Route::post('/bills/{bill}/void', [SupplierBillController::class, 'void'])->middleware('permission:payables,delete')->name('bills.void');
                Route::patch('/bills/{bill}/lines/{line}', [SupplierBillController::class, 'updateLine'])->middleware('permission:payables,update')->name('bills.lines.update');
                Route::post('/grn/{grn}/bill', [SupplierBillController::class, 'storeFromGrn'])->middleware('permission:payables,create')->name('grn.bill');

                Route::get('/payments', [BillPaymentController::class, 'index'])->name('payments.index');
                Route::get('/payments/create', [BillPaymentController::class, 'create'])->middleware('permission:payables,create')->name('payments.create');
                Route::post('/payments', [BillPaymentController::class, 'store'])->middleware('permission:payables,create')->name('payments.store');
                Route::get('/payments/{payment}', [BillPaymentController::class, 'show'])->name('payments.show');
                Route::post('/payments/{payment}/void', [BillPaymentController::class, 'void'])->middleware('permission:payables,delete')->name('payments.void');
            });
        });
    }
}
