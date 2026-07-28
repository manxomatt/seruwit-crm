<?php

namespace Modules\Accounting;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Console\Application as Artisan;
use Illuminate\Support\Facades\Route;
use Modules\Accounting\Console\Commands\AccountingPreflight;
use Modules\Accounting\Http\Controllers\AccountController;
use Modules\Accounting\Http\Controllers\AccountingDashboardController;
use Modules\Accounting\Http\Controllers\BalanceSheetController;
use Modules\Accounting\Http\Controllers\BankReconciliationController;
use Modules\Accounting\Http\Controllers\BankTransactionController;
use Modules\Accounting\Http\Controllers\BudgetController;
use Modules\Accounting\Http\Controllers\CashFlowController;
use Modules\Accounting\Http\Controllers\CompanyBankAccountController;
use Modules\Accounting\Http\Controllers\FiscalPeriodController;
use Modules\Accounting\Http\Controllers\FixedAssetController;
use Modules\Accounting\Http\Controllers\GeneralLedgerController;
use Modules\Accounting\Http\Controllers\JournalEntryController;
use Modules\Accounting\Http\Controllers\OpeningBalanceController;
use Modules\Accounting\Http\Controllers\PartnerStatementController;
use Modules\Accounting\Http\Controllers\ProfitAndLossController;
use Modules\Accounting\Http\Controllers\TaxCodeController;
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
        return ['view', 'manage_coa', 'journal', 'post', 'period', 'bank', 'manage_tax', 'manage_assets', 'manage_budget'];
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
        Artisan::starting(fn (Artisan $artisan) => $artisan->resolveCommands([
            AccountingPreflight::class,
        ]));
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
                Route::post('/years/close', [FiscalPeriodController::class, 'closeYear'])
                    ->middleware('permission:accounting,period')
                    ->name('years.close');
                Route::post('/years/reopen', [FiscalPeriodController::class, 'reopenYear'])
                    ->middleware('permission:accounting,period')
                    ->name('years.reopen');

                Route::get('/opening-balances', [OpeningBalanceController::class, 'create'])
                    ->middleware('permission:accounting,period')
                    ->name('opening-balances.create');
                Route::post('/opening-balances', [OpeningBalanceController::class, 'store'])
                    ->middleware('permission:accounting,period')
                    ->name('opening-balances.store');

                Route::get('/tax-codes', [TaxCodeController::class, 'index'])->name('tax-codes.index');
                Route::get('/tax-codes/create', [TaxCodeController::class, 'create'])
                    ->middleware('permission:accounting,manage_tax')
                    ->name('tax-codes.create');
                Route::post('/tax-codes', [TaxCodeController::class, 'store'])
                    ->middleware('permission:accounting,manage_tax')
                    ->name('tax-codes.store');
                Route::get('/tax-codes/{taxCode}/edit', [TaxCodeController::class, 'edit'])
                    ->middleware('permission:accounting,manage_tax')
                    ->name('tax-codes.edit');
                Route::patch('/tax-codes/{taxCode}', [TaxCodeController::class, 'update'])
                    ->middleware('permission:accounting,manage_tax')
                    ->name('tax-codes.update');

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
                Route::get('/reports/profit-loss', [ProfitAndLossController::class, 'show'])
                    ->name('reports.profit-loss');
                Route::get('/reports/balance-sheet', [BalanceSheetController::class, 'show'])
                    ->name('reports.balance-sheet');
                Route::get('/reports/cash-flow', [CashFlowController::class, 'show'])
                    ->name('reports.cash-flow');
                Route::get('/reports/general-ledger', [GeneralLedgerController::class, 'show'])
                    ->name('reports.general-ledger');
                Route::get('/reports/partner-statement', [PartnerStatementController::class, 'show'])
                    ->name('reports.partner-statement');

                Route::get('/fixed-assets', [FixedAssetController::class, 'index'])->name('fixed-assets.index');
                Route::get('/fixed-assets/create', [FixedAssetController::class, 'create'])
                    ->middleware('permission:accounting,manage_assets')
                    ->name('fixed-assets.create');
                Route::post('/fixed-assets', [FixedAssetController::class, 'store'])
                    ->middleware('permission:accounting,manage_assets')
                    ->name('fixed-assets.store');
                Route::post('/fixed-assets/depreciate', [FixedAssetController::class, 'depreciate'])
                    ->middleware('permission:accounting,manage_assets')
                    ->name('fixed-assets.depreciate');

                Route::get('/budgets', [BudgetController::class, 'index'])->name('budgets.index');
                Route::get('/budgets/create', [BudgetController::class, 'create'])
                    ->middleware('permission:accounting,manage_budget')
                    ->name('budgets.create');
                Route::post('/budgets', [BudgetController::class, 'store'])
                    ->middleware('permission:accounting,manage_budget')
                    ->name('budgets.store');

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

                Route::get('/bank-transactions', [BankTransactionController::class, 'index'])
                    ->name('bank-transactions.index');
                Route::get('/bank-transactions/create', [BankTransactionController::class, 'create'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-transactions.create');
                Route::post('/bank-transactions', [BankTransactionController::class, 'store'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-transactions.store');
                Route::post('/bank-transactions/clear', [BankTransactionController::class, 'clear'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-transactions.clear');
                Route::post('/bank-transactions/unclear', [BankTransactionController::class, 'unclear'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-transactions.unclear');

                Route::get('/bank-reconciliations', [BankReconciliationController::class, 'index'])
                    ->name('bank-reconciliations.index');
                Route::get('/bank-reconciliations/create', [BankReconciliationController::class, 'create'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-reconciliations.create');
                Route::post('/bank-reconciliations', [BankReconciliationController::class, 'store'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-reconciliations.store');
                Route::get('/bank-reconciliations/{bankReconciliation}', [BankReconciliationController::class, 'show'])
                    ->name('bank-reconciliations.show');
                Route::post('/bank-reconciliations/{bankReconciliation}/import', [BankReconciliationController::class, 'import'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-reconciliations.import');
                Route::post('/bank-reconciliations/{bankReconciliation}/lines/{line}/match', [BankReconciliationController::class, 'match'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-reconciliations.match');
                Route::post('/bank-reconciliations/{bankReconciliation}/lines/{line}/unmatch', [BankReconciliationController::class, 'unmatch'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-reconciliations.unmatch');
                Route::post('/bank-reconciliations/{bankReconciliation}/lines/{line}/ignore', [BankReconciliationController::class, 'ignore'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-reconciliations.ignore');
                Route::post('/bank-reconciliations/{bankReconciliation}/lines/{line}/unignore', [BankReconciliationController::class, 'unignore'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-reconciliations.unignore');
                Route::post('/bank-reconciliations/{bankReconciliation}/lines/{line}/adjust', [BankReconciliationController::class, 'adjust'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-reconciliations.adjust');
                Route::post('/bank-reconciliations/{bankReconciliation}/complete', [BankReconciliationController::class, 'complete'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-reconciliations.complete');
                Route::delete('/bank-reconciliations/{bankReconciliation}', [BankReconciliationController::class, 'destroy'])
                    ->middleware('permission:accounting,bank')
                    ->name('bank-reconciliations.destroy');
            });
        });
    }
}
