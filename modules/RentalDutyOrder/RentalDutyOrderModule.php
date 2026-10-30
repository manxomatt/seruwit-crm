<?php

namespace Modules\RentalDutyOrder;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\RentalDutyOrder\Http\Controllers\RentalDutyOrderController;

/**
 * Driver Duty Orders & Cash Advance (SPPD & Kas Jalan) module:
 * manages driver assignments, cash advances, trip expense logging,
 * driver overtime calculation, and driver cash settlement.
 */
class RentalDutyOrderModule implements ModuleContract
{
    public function key(): string
    {
        return 'rental-duty-order';
    }

    public function label(): string
    {
        return 'Surat Jalan & Kas Jalan';
    }

    public function description(): string
    {
        return 'Manajemen penugasan pengemudi (SPPD), uang muka kas jalan, klaim pengeluaran di jalan, lembur (overtime), dan settlement pengemudi.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return ['view', 'dispatch', 'finance'];
    }

    public function requires(): array
    {
        return ['rental', 'driver'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Surat Jalan & Kas Jalan',
            'slug' => 'rental-duty-order',
            'icon' => 'clipboard-document-list',
            'route_name' => 'rental.duty_orders.index',
            'permission_module' => 'rental-duty-order',
            'permission_action' => 'dispatch',
            'sort_order' => 13,
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
        // Primary routes (matching rental.duty_orders.* for 100% backward compatibility)
        Route::get('/rental/duty-orders', [RentalDutyOrderController::class, 'index'])
            ->middleware('permission:rental-duty-order|rental,dispatch|view')
            ->name('rental.duty_orders.index');

        Route::get('/rental/duty-orders/create', [RentalDutyOrderController::class, 'create'])
            ->middleware('permission:rental-duty-order|rental,dispatch')
            ->name('rental.duty_orders.create');

        Route::post('/rental/duty-orders', [RentalDutyOrderController::class, 'store'])
            ->middleware('permission:rental-duty-order|rental,dispatch')
            ->name('rental.duty_orders.store');

        Route::get('/rental/duty-orders/{dutyOrder}', [RentalDutyOrderController::class, 'show'])
            ->whereNumber('dutyOrder')
            ->middleware('permission:rental-duty-order|rental,dispatch|view')
            ->name('rental.duty_orders.show');

        Route::patch('/rental/duty-orders/{dutyOrder}/status', [RentalDutyOrderController::class, 'updateStatus'])
            ->whereNumber('dutyOrder')
            ->middleware('permission:rental-duty-order|rental,dispatch')
            ->name('rental.duty_orders.status');

        Route::post('/rental/duty-orders/{dutyOrder}/expenses', [RentalDutyOrderController::class, 'addExpense'])
            ->whereNumber('dutyOrder')
            ->middleware('permission:rental-duty-order|rental,dispatch')
            ->name('rental.duty_orders.expenses.store');

        Route::delete('/rental/duty-orders/{dutyOrder}/expenses/{expense}', [RentalDutyOrderController::class, 'deleteExpense'])
            ->whereNumber('dutyOrder')
            ->whereNumber('expense')
            ->middleware('permission:rental-duty-order|rental,dispatch')
            ->name('rental.duty_orders.expenses.destroy');

        Route::post('/rental/duty-orders/{dutyOrder}/overtime', [RentalDutyOrderController::class, 'updateOvertime'])
            ->whereNumber('dutyOrder')
            ->middleware('permission:rental-duty-order|rental,dispatch')
            ->name('rental.duty_orders.overtime');

        Route::post('/rental/duty-orders/{dutyOrder}/settle', [RentalDutyOrderController::class, 'settle'])
            ->whereNumber('dutyOrder')
            ->middleware('permission:rental-duty-order|rental,finance')
            ->name('rental.duty_orders.settle');

        Route::get('/rental/duty-orders/{dutyOrder}/print', [RentalDutyOrderController::class, 'print'])
            ->whereNumber('dutyOrder')
            ->middleware('permission:rental-duty-order|rental,dispatch|view')
            ->name('rental.duty_orders.print');

        // Route aliases for standalone /rental-duty-orders/*
        Route::get('/rental-duty-orders', [RentalDutyOrderController::class, 'index'])
            ->middleware('permission:rental-duty-order|rental,dispatch|view')
            ->name('rental-duty-orders.index');

        Route::get('/rental-duty-orders/{dutyOrder}', [RentalDutyOrderController::class, 'show'])
            ->whereNumber('dutyOrder')
            ->middleware('permission:rental-duty-order|rental,dispatch|view')
            ->name('rental-duty-orders.show');
    }
}
