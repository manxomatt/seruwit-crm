<?php

namespace Modules\CashBank;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\CashBank\Http\Controllers\BankReconciliationController;
use Modules\CashBank\Http\Controllers\BankTransactionController;
use Modules\CashBank\Http\Controllers\CompanyBankAccountController;

/**
 * Cash & Bank management module: company bank & cash accounts, payment method
 * account mapping, manual bank book transactions, and bank statement reconciliations.
 */
class CashBankModule implements ModuleContract
{
    public function key(): string
    {
        return 'cash-bank';
    }

    public function label(): string
    {
        return 'Kas & Bank';
    }

    public function description(): string
    {
        return 'Manajemen rekening kas & bank perusahaan, mutasi buku bank, pemetaan metode pembayaran, dan rekonsiliasi rekening koran.';
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
            'reconcile',
            'bank',
        ];
    }

    public function requires(): array
    {
        return ['accounting'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Kas & Bank',
            'slug' => 'cash-bank',
            'icon' => 'banknotes',
            'route_name' => 'cash-bank.accounts.index',
            'permission_module' => 'cash-bank',
            'permission_action' => 'view',
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
        Route::middleware(['auth', 'permission:cash-bank|accounting,view'])->prefix('cash-bank')->name('cash-bank.')->group(function (): void {
            Route::get('/', [CompanyBankAccountController::class, 'index'])->name('index');
            Route::get('/accounts', [CompanyBankAccountController::class, 'index'])->name('accounts.index');
            Route::get('/bank-accounts', [CompanyBankAccountController::class, 'index'])->name('bank-accounts.index');
            Route::get('/accounts/create', [CompanyBankAccountController::class, 'create'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('accounts.create');
            Route::post('/accounts', [CompanyBankAccountController::class, 'store'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('accounts.store');
            Route::get('/accounts/{bankAccount}/edit', [CompanyBankAccountController::class, 'edit'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('accounts.edit');
            Route::patch('/accounts/{bankAccount}', [CompanyBankAccountController::class, 'update'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('accounts.update');
            Route::put('/payment-method-maps', [CompanyBankAccountController::class, 'updateMaps'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('payment-method-maps.update');

            Route::get('/transactions', [BankTransactionController::class, 'index'])->name('transactions.index');
            Route::get('/transactions/create', [BankTransactionController::class, 'create'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('transactions.create');
            Route::post('/transactions', [BankTransactionController::class, 'store'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('transactions.store');
            Route::post('/transactions/clear', [BankTransactionController::class, 'clear'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('transactions.clear');
            Route::post('/transactions/unclear', [BankTransactionController::class, 'unclear'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('transactions.unclear');

            Route::get('/reconciliations', [BankReconciliationController::class, 'index'])->name('reconciliations.index');
            Route::get('/reconciliations/create', [BankReconciliationController::class, 'create'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('reconciliations.create');
            Route::post('/reconciliations', [BankReconciliationController::class, 'store'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('reconciliations.store');
            Route::get('/reconciliations/{bankReconciliation}', [BankReconciliationController::class, 'show'])
                ->name('reconciliations.show');
            Route::post('/reconciliations/{bankReconciliation}/import', [BankReconciliationController::class, 'import'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('reconciliations.import');
            Route::post('/reconciliations/{bankReconciliation}/lines/{line}/match', [BankReconciliationController::class, 'match'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('reconciliations.match');
            Route::post('/reconciliations/{bankReconciliation}/lines/{line}/unmatch', [BankReconciliationController::class, 'unmatch'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('reconciliations.unmatch');
            Route::post('/reconciliations/{bankReconciliation}/lines/{line}/ignore', [BankReconciliationController::class, 'ignore'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('reconciliations.ignore');
            Route::post('/reconciliations/{bankReconciliation}/lines/{line}/unignore', [BankReconciliationController::class, 'unignore'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('reconciliations.unignore');
            Route::post('/reconciliations/{bankReconciliation}/lines/{line}/adjust', [BankReconciliationController::class, 'adjust'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('reconciliations.adjust');
            Route::post('/reconciliations/{bankReconciliation}/complete', [BankReconciliationController::class, 'complete'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('reconciliations.complete');
            Route::delete('/reconciliations/{bankReconciliation}', [BankReconciliationController::class, 'destroy'])
                ->middleware('permission:cash-bank|accounting,bank')
                ->name('reconciliations.destroy');
        });
    }
}
