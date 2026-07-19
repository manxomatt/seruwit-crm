<?php

namespace Modules\Invoicing;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Invoicing\Http\Controllers\InvoiceController;
use Modules\Invoicing\Http\Controllers\InvoiceLineController;
use Modules\Invoicing\Http\Controllers\InvoicePdfController;

/**
 * Customer invoices as a plain financial document: a header, a set of lines,
 * and a draft → issued → paid lifecycle, deliberately free of any notion of
 * *what* is being billed.
 *
 * That absence is the point. Invoicing was split out of Billing because Billing
 * priced delivery orders, which welded invoicing to logistics and would have
 * left Travel or Field Sales unable to bill anything. A line carries a
 * description, an amount, and an optional polymorphic `source` pointing back at
 * whatever the selling module raised it for — an order charge today, a booking
 * later — so each business line invoices through the same document without this
 * module ever learning their vocabulary.
 */
class InvoicingModule implements ModuleContract
{
    public function key(): string
    {
        return 'invoicing';
    }

    public function label(): string
    {
        return 'Invoicing';
    }

    public function description(): string
    {
        return 'Customer invoices with lines, a draft/issued/paid lifecycle, and printable PDFs, shared by every module that bills.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete'];
    }

    /**
     * An invoice is addressed to a Customer and needs nothing else — the modules
     * that raise its lines depend on Invoicing, never the other way round.
     */
    public function requires(): array
    {
        return ['customers'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Invoicing',
            'slug' => 'invoicing',
            'icon' => 'invoicing',
            'route_name' => 'invoicing.invoices.index',
            'permission_module' => 'invoicing',
            'permission_action' => 'view',
            'sort_order' => 11,
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
     * Pure configuration only — no tenant is initialized yet at boot. Modules
     * that bill attach themselves to Invoicing, so there is nothing to hook the
     * other way.
     */
    public function boot(): void
    {
        //
    }

    public function routes(): void
    {
        Route::redirect('/invoicing', '/invoicing/invoices');

        Route::get('/invoicing/invoices', [InvoiceController::class, 'index'])->middleware('permission:invoicing,view')->name('invoicing.invoices.index');
        Route::get('/invoicing/invoices/create', [InvoiceController::class, 'create'])->middleware('permission:invoicing,create')->name('invoicing.invoices.create');
        Route::post('/invoicing/invoices', [InvoiceController::class, 'store'])->middleware('permission:invoicing,create')->name('invoicing.invoices.store');
        Route::get('/invoicing/invoices/{invoice}', [InvoiceController::class, 'show'])->middleware('permission:invoicing,view')->name('invoicing.invoices.show');
        Route::patch('/invoicing/invoices/{invoice}', [InvoiceController::class, 'update'])->middleware('permission:invoicing,update')->name('invoicing.invoices.update');
        Route::delete('/invoicing/invoices/{invoice}', [InvoiceController::class, 'destroy'])->middleware('permission:invoicing,delete')->name('invoicing.invoices.destroy');

        Route::post('/invoicing/invoices/{invoice}/issue', [InvoiceController::class, 'issue'])->middleware('permission:invoicing,update')->name('invoicing.invoices.issue');
        Route::post('/invoicing/invoices/{invoice}/pay', [InvoiceController::class, 'pay'])->middleware('permission:invoicing,update')->name('invoicing.invoices.pay');
        Route::post('/invoicing/invoices/{invoice}/void', [InvoiceController::class, 'void'])->middleware('permission:invoicing,update')->name('invoicing.invoices.void');

        Route::get('/invoicing/invoices/{invoice}/pdf', [InvoicePdfController::class, 'show'])->middleware('permission:invoicing,view')->name('invoicing.invoices.pdf');

        Route::post('/invoicing/invoices/{invoice}/lines', [InvoiceLineController::class, 'store'])->middleware('permission:invoicing,update')->name('invoicing.invoices.lines.store');
        Route::delete('/invoicing/invoices/{invoice}/lines/{line}', [InvoiceLineController::class, 'destroy'])->middleware('permission:invoicing,update')->name('invoicing.invoices.lines.destroy');
    }
}
