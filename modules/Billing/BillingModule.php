<?php

namespace Modules\Billing;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Billing\Http\Controllers\InvoiceController;
use Modules\Billing\Http\Controllers\InvoicePdfController;
use Modules\Billing\Http\Controllers\OrderChargeController;
use Modules\Billing\Http\Controllers\TariffController;
use Modules\Billing\Http\Controllers\TripAllowanceController;
use Modules\Billing\Models\OrderCharge;
use Modules\Billing\Models\TripAllowance;
use Modules\Billing\Observers\DeliveryOrderObserver;
use Modules\Orders\Models\DeliveryOrder;
use Modules\TransportationManagement\Models\Trip;

class BillingModule implements ModuleContract
{
    public function key(): string
    {
        return 'billing';
    }

    public function label(): string
    {
        return 'Billing';
    }

    public function description(): string
    {
        return 'Route tariffs, customer invoices for delivered orders, and driver trip allowances (uang jalan).';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete'];
    }

    /**
     * Tariffs price delivery orders, invoices bundle them, and trip allowances
     * attach to Transportation trips — Billing cannot stand on its own without
     * Orders, whose own requirement chain (transportation → fleet, customers,
     * products) is installed transitively.
     */
    public function requires(): array
    {
        return ['orders'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Billing',
            'slug' => 'billing',
            'icon' => 'billing',
            'route_name' => 'billing.invoices.index',
            'permission_module' => 'billing',
            'permission_action' => 'view',
            'sort_order' => 8,
        ];
    }

    public function migrationsPath(): string
    {
        return __DIR__.'/Database/Migrations';
    }

    public function viewsPath(): string
    {
        return __DIR__.'/resources/views';
    }

    /**
     * Attaches this module's relations and observers to upstream models, so
     * Orders and Transportation need no knowledge of Billing. Registration
     * only — no queries run here (no tenant is initialized yet at boot); the
     * observer gates on Modules::available('billing') at call time, and
     * callers of the relations must do the same.
     */
    public function boot(): void
    {
        DeliveryOrder::resolveRelationUsing('charge', fn (DeliveryOrder $order) => $order->hasOne(OrderCharge::class));
        Trip::resolveRelationUsing('allowance', fn (Trip $trip) => $trip->hasOne(TripAllowance::class));

        DeliveryOrder::observe(DeliveryOrderObserver::class);
    }

    public function routes(): void
    {
        Route::redirect('/billing', '/billing/invoices');

        Route::get('/billing/invoices', [InvoiceController::class, 'index'])->middleware('permission:billing,view')->name('billing.invoices.index');
        Route::get('/billing/invoices/create', [InvoiceController::class, 'create'])->middleware('permission:billing,create')->name('billing.invoices.create');
        Route::post('/billing/invoices', [InvoiceController::class, 'store'])->middleware('permission:billing,create')->name('billing.invoices.store');
        Route::get('/billing/invoices/{invoice}', [InvoiceController::class, 'show'])->middleware('permission:billing,view')->name('billing.invoices.show');
        Route::patch('/billing/invoices/{invoice}', [InvoiceController::class, 'update'])->middleware('permission:billing,update')->name('billing.invoices.update');
        Route::delete('/billing/invoices/{invoice}', [InvoiceController::class, 'destroy'])->middleware('permission:billing,delete')->name('billing.invoices.destroy');
        Route::post('/billing/invoices/{invoice}/charges', [InvoiceController::class, 'attachCharge'])->middleware('permission:billing,update')->name('billing.invoices.charges.store');
        Route::delete('/billing/invoices/{invoice}/charges/{charge}', [InvoiceController::class, 'detachCharge'])->middleware('permission:billing,update')->name('billing.invoices.charges.destroy');
        Route::post('/billing/invoices/{invoice}/issue', [InvoiceController::class, 'issue'])->middleware('permission:billing,update')->name('billing.invoices.issue');
        Route::post('/billing/invoices/{invoice}/pay', [InvoiceController::class, 'pay'])->middleware('permission:billing,update')->name('billing.invoices.pay');
        Route::post('/billing/invoices/{invoice}/void', [InvoiceController::class, 'void'])->middleware('permission:billing,update')->name('billing.invoices.void');
        Route::get('/billing/invoices/{invoice}/pdf', [InvoicePdfController::class, 'show'])->middleware('permission:billing,view')->name('billing.invoices.pdf');

        Route::get('/billing/charges', [OrderChargeController::class, 'index'])->middleware('permission:billing,view')->name('billing.charges.index');
        Route::patch('/billing/charges/{order}', [OrderChargeController::class, 'update'])->middleware('permission:billing,update')->name('billing.charges.update');

        Route::get('/billing/tariffs', [TariffController::class, 'index'])->middleware('permission:billing,view')->name('billing.tariffs.index');
        Route::post('/billing/tariffs', [TariffController::class, 'store'])->middleware('permission:billing,create')->name('billing.tariffs.store');
        Route::patch('/billing/tariffs/{tariff}', [TariffController::class, 'update'])->middleware('permission:billing,update')->name('billing.tariffs.update');
        Route::delete('/billing/tariffs/{tariff}', [TariffController::class, 'destroy'])->middleware('permission:billing,delete')->name('billing.tariffs.destroy');

        Route::get('/billing/allowances', [TripAllowanceController::class, 'index'])->middleware('permission:billing,view')->name('billing.allowances.index');
        Route::get('/billing/allowances/create', [TripAllowanceController::class, 'create'])->middleware('permission:billing,create')->name('billing.allowances.create');
        Route::post('/billing/allowances', [TripAllowanceController::class, 'store'])->middleware('permission:billing,create')->name('billing.allowances.store');
        Route::get('/billing/allowances/{allowance}', [TripAllowanceController::class, 'show'])->middleware('permission:billing,view')->name('billing.allowances.show');
        Route::delete('/billing/allowances/{allowance}', [TripAllowanceController::class, 'destroy'])->middleware('permission:billing,delete')->name('billing.allowances.destroy');
        Route::post('/billing/allowances/{allowance}/expenses', [TripAllowanceController::class, 'storeExpense'])->middleware('permission:billing,update')->name('billing.allowances.expenses.store');
        Route::delete('/billing/allowances/{allowance}/expenses/{expense}', [TripAllowanceController::class, 'destroyExpense'])->middleware('permission:billing,update')->name('billing.allowances.expenses.destroy');
        Route::post('/billing/allowances/{allowance}/settle', [TripAllowanceController::class, 'settle'])->middleware('permission:billing,update')->name('billing.allowances.settle');
    }
}
