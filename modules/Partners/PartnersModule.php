<?php

namespace Modules\Partners;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Partners\Http\Controllers\PartnerAddressController;
use Modules\Partners\Http\Controllers\PartnerBankAccountController;
use Modules\Partners\Http\Controllers\PartnerController;

class PartnersModule implements ModuleContract
{
    public function key(): string
    {
        return 'partners';
    }

    public function label(): string
    {
        return 'Partners';
    }

    public function description(): string
    {
        return 'Unified contact management for customers, vendors, and suppliers.';
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
        return [];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Partners',
            'slug' => 'partners',
            'icon' => 'customers',
            'route_name' => 'partners.index',
            'permission_module' => 'partners',
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

    public function boot(): void
    {
        //
    }

    public function routes(): void
    {
        Route::redirect('/partners', '/partners/list');

        Route::get('/partners/list', [PartnerController::class, 'index'])->middleware('permission:partners,view')->name('partners.index');
        Route::get('/partners/create', [PartnerController::class, 'create'])->middleware('permission:partners,create')->name('partners.create');
        Route::post('/partners', [PartnerController::class, 'store'])->middleware('permission:partners,create')->name('partners.store');
        Route::get('/partners/{partner}', [PartnerController::class, 'show'])->middleware('permission:partners,view')->name('partners.show');
        Route::get('/partners/{partner}/edit', [PartnerController::class, 'edit'])->middleware('permission:partners,update')->name('partners.edit');
        Route::patch('/partners/{partner}', [PartnerController::class, 'update'])->middleware('permission:partners,update')->name('partners.update');
        Route::delete('/partners/{partner}', [PartnerController::class, 'destroy'])->middleware('permission:partners,delete')->name('partners.destroy');

        Route::post('/partners/{partner}/addresses', [PartnerAddressController::class, 'store'])->middleware('permission:partners,update')->name('partners.addresses.store');
        Route::delete('/partners/{partner}/addresses/{address}', [PartnerAddressController::class, 'destroy'])->middleware('permission:partners,update')->name('partners.addresses.destroy');

        Route::post('/partners/{partner}/bank-accounts', [PartnerBankAccountController::class, 'store'])->middleware('permission:partners,update')->name('partners.bank-accounts.store');
        Route::delete('/partners/{partner}/bank-accounts/{bankAccount}', [PartnerBankAccountController::class, 'destroy'])->middleware('permission:partners,update')->name('partners.bank-accounts.destroy');
    }
}
