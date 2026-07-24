<?php

namespace Modules\Receivables;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Receivables\Http\Controllers\AgingController;
use Modules\Receivables\Http\Controllers\CreditLimitController;
use Modules\Receivables\Http\Controllers\PaymentController;

/**
 * Accounts receivable: customer payments, aging, and credit-limit checks.
 *
 * Depends on Partners (customers + credit_limit) and Invoicing (open invoices)
 * without teaching those modules how payments are stored.
 */
class ReceivablesModule implements ModuleContract
{
    public function key(): string
    {
        return 'receivables';
    }

    public function label(): string
    {
        return 'Receivables';
    }

    public function description(): string
    {
        return 'AR payment management: DP, installments, settlement, aging, credit limits, and overdue alerts.';
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
        return ['partners', 'invoicing'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Receivables',
            'slug' => 'receivables',
            'icon' => 'receivables',
            'route_name' => 'receivables.payments.index',
            'permission_module' => 'receivables',
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
        Route::middleware(['auth', 'permission:receivables,view'])->group(function (): void {
            Route::get('/receivables', function () {
                return redirect('/module/receivables/payments');
            });

            Route::prefix('receivables')->name('receivables.')->group(function (): void {
                Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
                Route::get('/payments/create', [PaymentController::class, 'create'])->middleware('permission:receivables,create')->name('payments.create');
                Route::post('/payments', [PaymentController::class, 'store'])->middleware('permission:receivables,create')->name('payments.store');
                Route::get('/payments/{payment}', [PaymentController::class, 'show'])->name('payments.show');
                Route::post('/payments/{payment}/void', [PaymentController::class, 'void'])->middleware('permission:receivables,delete')->name('payments.void');

                Route::get('/aging', [AgingController::class, 'index'])->name('aging.index');
                Route::get('/credit', [CreditLimitController::class, 'index'])->name('credit.index');
            });
        });
    }
}
