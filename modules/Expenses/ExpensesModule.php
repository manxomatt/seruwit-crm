<?php

namespace Modules\Expenses;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Expenses\Http\Controllers\CashAdvanceController;
use Modules\Expenses\Http\Controllers\ExpenseCategoryController;
use Modules\Expenses\Http\Controllers\ExpenseClaimController;
use Modules\Expenses\Http\Controllers\ExpenseDashboardController;

/**
 * Operational Expenses, Petty Cash & Cash Advances module: direct operational
 * expenses (fuel, tolls, parking, maintenance, STNK/KIR), petty cash vouchers,
 * driver/employee cash advances (kasbon & uang jalan), and LPJ settlement with
 * automated GL journal & BankBookService posting.
 */
class ExpensesModule implements ModuleContract
{
    public function key(): string
    {
        return 'expenses';
    }

    public function label(): string
    {
        return 'Pengeluaran & Kasbon';
    }

    public function description(): string
    {
        return 'Manajemen pengeluaran operasional langsung (BBM, tol, parkir, servis, pajak STNK), kas kecil (petty cash), serta kasbon & uang jalan dengan pertanggungjawaban (LPJ) otomatis ke jurnal umum.';
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
            'post',
            'disburse',
            'settle',
        ];
    }

    public function requires(): array
    {
        return ['accounting'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Pengeluaran & Kasbon',
            'slug' => 'expenses',
            'icon' => 'receipt-refund',
            'route_name' => 'expenses.dashboard',
            'permission_module' => 'expenses',
            'permission_action' => 'view',
            'sort_order' => 17,
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
        Route::middleware(['auth', 'permission:expenses|accounting,view'])->prefix('expenses')->name('expenses.')->group(function (): void {
            Route::get('/', [ExpenseDashboardController::class, 'index'])->name('dashboard');
            Route::get('/dashboard', [ExpenseDashboardController::class, 'index'])->name('dashboard.index');

            Route::get('/claims', [ExpenseClaimController::class, 'index'])->name('claims.index');
            Route::get('/claims/create', [ExpenseClaimController::class, 'create'])
                ->middleware('permission:expenses|accounting,create')
                ->name('claims.create');
            Route::post('/claims', [ExpenseClaimController::class, 'store'])
                ->middleware('permission:expenses|accounting,create')
                ->name('claims.store');
            Route::get('/claims/{claim}', [ExpenseClaimController::class, 'show'])
                ->whereNumber('claim')
                ->name('claims.show');
            Route::post('/claims/{claim}/post', [ExpenseClaimController::class, 'post'])
                ->whereNumber('claim')
                ->middleware('permission:expenses|accounting,post')
                ->name('claims.post');
            Route::post('/claims/{claim}/void', [ExpenseClaimController::class, 'void'])
                ->whereNumber('claim')
                ->middleware('permission:expenses|accounting,delete')
                ->name('claims.void');

            Route::get('/advances', [CashAdvanceController::class, 'index'])->name('advances.index');
            Route::get('/advances/create', [CashAdvanceController::class, 'create'])
                ->middleware('permission:expenses|accounting,create')
                ->name('advances.create');
            Route::post('/advances', [CashAdvanceController::class, 'store'])
                ->middleware('permission:expenses|accounting,create')
                ->name('advances.store');
            Route::get('/advances/{advance}', [CashAdvanceController::class, 'show'])
                ->whereNumber('advance')
                ->name('advances.show');
            Route::post('/advances/{advance}/disburse', [CashAdvanceController::class, 'disburse'])
                ->whereNumber('advance')
                ->middleware('permission:expenses|accounting,disburse')
                ->name('advances.disburse');
            Route::post('/advances/{advance}/settle', [CashAdvanceController::class, 'settle'])
                ->whereNumber('advance')
                ->middleware('permission:expenses|accounting,settle')
                ->name('advances.settle');
            Route::post('/advances/{advance}/void', [CashAdvanceController::class, 'void'])
                ->whereNumber('advance')
                ->middleware('permission:expenses|accounting,delete')
                ->name('advances.void');

            Route::get('/categories', [ExpenseCategoryController::class, 'index'])->name('categories.index');
            Route::post('/categories', [ExpenseCategoryController::class, 'store'])
                ->middleware('permission:expenses|accounting,create')
                ->name('categories.store');
            Route::patch('/categories/{category}', [ExpenseCategoryController::class, 'update'])
                ->whereNumber('category')
                ->middleware('permission:expenses|accounting,update')
                ->name('categories.update');
        });
    }
}
