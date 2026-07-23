<?php

namespace Modules\Billing;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Billing\Http\Controllers\OrderChargeController;
use Modules\Billing\Http\Controllers\OrderInvoiceController;
use Modules\Billing\Http\Controllers\TariffController;
use Modules\Billing\Http\Controllers\TripAllowanceController;
use Modules\Billing\Models\OrderCharge;
use Modules\Billing\Models\TripAllowance;
use Modules\Billing\Observers\DeliveryOrderObserver;
use Modules\Orders\Models\DeliveryOrder;
use Modules\TransportationManagement\Models\Trip;

/**
 * The logistics side of getting paid: what a delivery costs, and what cash a
 * driver is given for the trip.
 *
 * The invoice document itself deliberately lives in Invoicing, one tier down.
 * This module priced orders *and* owned invoices until the two were split,
 * which meant a tenant could not invoice anything without running logistics —
 * everything here speaks of tariffs, routes and delivery orders, and none of it
 * would have made sense to travel or field sales.
 */
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
        return 'Route tariffs, pricing for delivered orders, and driver trip allowances (uang jalan). Invoices themselves come from Invoicing.';
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
     * Tariffs price delivery orders and trip allowances attach to Transportation
     * trips, so Billing cannot stand on its own without Orders, whose own
     * requirement chain (transportation → fleet, partners, products) is
     * installed transitively. Invoicing supplies the document those prices are
     * written onto — a Vertical depending on a Foundation module, the direction
     * the tiers are meant to run.
     */
    public function requires(): array
    {
        return ['orders', 'invoicing'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Billing',
            'slug' => 'billing',
            'icon' => 'billing',
            'route_name' => 'billing.charges.index',
            'permission_module' => 'billing',
            'permission_action' => 'view',
            'sort_order' => 8,
        ];
    }

    public function migrationsPath(): string
    {
        return __DIR__.'/Database/Migrations';
    }

    /**
     * The one Blade view this module had was the invoice PDF, which went to
     * Invoicing along with the document it renders.
     */
    public function viewsPath(): ?string
    {
        return null;
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
        Route::redirect('/billing', '/billing/charges');

        // Raising an invoice from delivered orders. The document that comes out
        // belongs to Invoicing, so these hand off to its pages once written —
        // there is no invoice list or detail view here.
        Route::get('/billing/invoices/create', [OrderInvoiceController::class, 'create'])->middleware('permission:billing,create')->name('billing.invoices.create');
        Route::post('/billing/invoices', [OrderInvoiceController::class, 'store'])->middleware('permission:billing,create')->name('billing.invoices.store');
        Route::post('/billing/invoices/{invoice}/orders', [OrderInvoiceController::class, 'attach'])->middleware('permission:billing,update')->name('billing.invoices.orders.store');

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
