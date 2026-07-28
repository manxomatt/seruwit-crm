<?php

namespace Modules\Accounting;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Accounting\Http\Controllers\AccountController;
use Modules\Accounting\Http\Controllers\AccountingDashboardController;
use Modules\Accounting\Http\Controllers\CompanyBankAccountController;
use Modules\Accounting\Http\Controllers\FiscalPeriodController;
use Modules\Accounting\Http\Controllers\JournalEntryController;
use Modules\Accounting\Http\Controllers\TrialBalanceController;

/**
 * General ledger foundation: chart of accounts, fiscal periods, journals, and
 * trial balance. Operational documents stay in their own modules; this one
 * owns the books they will eventually post into.
 */
class AccountingModule implements ModuleContract
{
    public function key(): string
    {
        return 'accounting';
    }

    public function label(): string
    {
        return 'Accounting';
    }

    public function description(): string
    {
        return 'Chart of accounts, fiscal periods, manual journals, and trial balance.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function permissions(): array
    {
        return ['view', 'manage_coa', 'journal', 'post', 'period', 'bank'];
    }

    public function requires(): array
    {
        return ['partners'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Accounting',
            'slug' => 'accounting',
            'icon' => 'accounting',
            'route_name' => 'accounting.dashboard',
            'permission_module' => 'accounting',
            'permission_action' => 'view',
            'sort_order' => 12,
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
        Route::middleware(['auth', 'permission:accounting,view'])->group(function (): void {
            Route::prefix('accounting')->name('accounting.')->group(function (): void {
                Route::get('/', [AccountingDashboardController::class, 'index'])->name('dashboard');

                Route::get('/accounts', [AccountController::class, 'index'])->name('accounts.index');
                Route::get('/accounts/create', [AccountController::class, 'create'])
                    ->middleware('permission:accounting,manage_coa')
                    ->name('accounts.create');
                Route::post('/accounts', [AccountController::class, 'store'])
                    ->middleware('permission:accounting,manage_coa')
                    ->name('accounts.store');
                Route::get('/accounts/{account}/edit', [AccountController::class, 'edit'])
                    ->middleware('permission:accounting,manage_coa')
                    ->name('accounts.edit');
                Route::patch('/accounts/{account}', [AccountController::class, 'update'])
                    ->middleware('permission:accounting,manage_coa')
                    ->name('accounts.update');

                Route::get('/periods', [FiscalPeriodController::class, 'index'])->name('periods.index');
                Route::post('/periods/{period}/soft-close', [FiscalPeriodController::class, 'softClose'])
                    ->middleware('permission:accounting,period')
                    ->name('periods.soft-close');
                Route::post('/periods/{period}/hard-close', [FiscalPeriodController::class, 'hardClose'])
                    ->middleware('permission:accounting,period')
                    ->name('periods.hard-close');
                Route::post('/periods/{period}/reopen', [FiscalPeriodController::class, 'reopen'])
                    ->middleware('permission:accounting,period')
                    ->name('periods.reopen');
                Route::post('/years', [FiscalPeriodController::class, 'ensureYear'])
                    ->middleware('permission:accounting,period')
                    ->name('years.ensure');

                Route::get('/journals', [JournalEntryController::class, 'index'])->name('journals.index');
                Route::get('/journals/create', [JournalEntryController::class, 'create'])
                    ->middleware('permission:accounting,journal')
                    ->name('journals.create');
                Route::post('/journals', [JournalEntryController::class, 'store'])
                    ->middleware('permission:accounting,journal')
                    ->name('journals.store');
                Route::get('/journals/{journal}', [JournalEntryController::class, 'show'])->name('journals.show');
                Route::get('/journals/{journal}/edit', [JournalEntryController::class, 'edit'])
                    ->middleware('permission:accounting,journal')
                    ->name('journals.edit');
                Route::patch('/journals/{journal}', [JournalEntryController::class, 'update'])
                    ->middleware('permission:accounting,journal')
                    ->name('journals.update');
                Route::delete('/journals/{journal}', [JournalEntryController::class, 'destroy'])
                    ->middleware('permission:accounting,journal')
                    ->name('journals.destroy');
                Route::post('/journals/{journal}/post', [JournalEntryController::class, 'post'])
                    ->middleware('permission:accounting,post')
                    ->name('journals.post');

                Route::get('/reports/trial-balance', [TrialBalanceController::class, 'show'])
                    ->name('reports.trial-balance');

                Route::get('/bank-accounts', [CompanyBankAccountController::class, 'index'])
                    ->name('bank-accounts.index');
                Route::get('/bank-accounts/create', [CompanyBankAccountController::class, 'create'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-accounts.create');
                Route::post('/bank-accounts', [CompanyBankAccountController::class, 'store'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-accounts.store');
                Route::get('/bank-accounts/{bankAccount}/edit', [CompanyBankAccountController::class, 'edit'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-accounts.edit');
                Route::patch('/bank-accounts/{bankAccount}', [CompanyBankAccountController::class, 'update'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-accounts.update');
                Route::put('/payment-method-maps', [CompanyBankAccountController::class, 'updateMaps'])
                    ->middleware('permission:accounting,bank')
                    ->name('payment-method-maps.update');
            });
        });
    }
}
