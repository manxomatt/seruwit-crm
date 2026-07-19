<?php

namespace Modules\Customer;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Customer\Http\Controllers\CustomerController;

/**
 * Customer records, deliberately free of any booking/dispatch concept. Any
 * module that needs to reference a customer — currently Transportation,
 * eventually Rental or a sales module — declares `requires(): ['customers']`
 * rather than owning its own copy.
 */
class CustomerModule implements ModuleContract
{
    public function key(): string
    {
        return 'customers';
    }

    public function label(): string
    {
        return 'Customers';
    }

    public function description(): string
    {
        return 'Customer records shared by every module that needs them.';
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
     * Fully standalone — no photo field, so unlike Fleet it does not even need
     * Media.
     */
    public function requires(): array
    {
        return [];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Customers',
            'slug' => 'customers',
            'icon' => 'customers',
            'route_name' => 'customers.index',
            'permission_module' => 'customers',
            'permission_action' => 'view',
            'sort_order' => 7,
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

    /**
     * Pure configuration only — no tenant is initialized yet at boot.
     */
    public function boot(): void
    {
        //
    }

    public function routes(): void
    {
        Route::get('/customers', [CustomerController::class, 'index'])->middleware('permission:customers,view')->name('customers.index');
        Route::get('/customers/create', [CustomerController::class, 'create'])->middleware('permission:customers,create')->name('customers.create');
        Route::post('/customers', [CustomerController::class, 'store'])->middleware('permission:customers,create')->name('customers.store');
        Route::get('/customers/{customer}', [CustomerController::class, 'show'])->middleware('permission:customers,view')->name('customers.show');
        Route::get('/customers/{customer}/edit', [CustomerController::class, 'edit'])->middleware('permission:customers,update')->name('customers.edit');
        Route::patch('/customers/{customer}', [CustomerController::class, 'update'])->middleware('permission:customers,update')->name('customers.update');
        Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])->middleware('permission:customers,delete')->name('customers.destroy');
    }
}
