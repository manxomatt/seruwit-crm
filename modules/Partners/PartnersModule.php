<?php

namespace Modules\Partners;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Partners\Http\Controllers\LocationController;
use Modules\Partners\Http\Controllers\PartnerAddressController;
use Modules\Partners\Http\Controllers\PartnerBankAccountController;
use Modules\Partners\Http\Controllers\PartnerController;
use Modules\Partners\Http\Controllers\PartnerDashboardController;
use Modules\Partners\Http\Controllers\PartnerIndustryController;
use Modules\Partners\Http\Controllers\PartnerTypeController;

class PartnersModule implements ModuleContract
{
    public function key(): string
    {
        return 'partners';
    }

    public function label(): string
    {
        return 'Contacts';
    }

    public function description(): string
    {
        return 'Unified contact management for customers, vendors, suppliers, and custom contact types.';
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
            'name' => 'Contacts',
            'slug' => 'partners',
            'icon' => 'customers',
            'route_name' => 'partners.dashboard',
            'permission_module' => 'partners',
            'permission_action' => 'view',
            'sort_order' => 7,
        ];
    }

    public function migrationsPath(): string
    {
        // Core: migrations live under database/migrations(+ /tenant).
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
        Route::get('/partners', [PartnerDashboardController::class, 'index'])->middleware('permission:partners,view')->name('partners.dashboard');
        Route::get('/partners/list', [PartnerController::class, 'index'])->middleware('permission:partners,view')->name('partners.index');
        Route::get('/partners/export', [PartnerController::class, 'export'])->middleware('permission:partners,view')->name('partners.export');
        Route::get('/partners/import/template', [PartnerController::class, 'importTemplate'])->middleware('permission:partners,create')->name('partners.import.template');
        Route::post('/partners/import', [PartnerController::class, 'import'])->middleware('permission:partners,create')->name('partners.import');
        Route::get('/partners/create', [PartnerController::class, 'create'])->middleware('permission:partners,create')->name('partners.create');
        Route::post('/partners', [PartnerController::class, 'store'])->middleware('permission:partners,create')->name('partners.store');

        Route::get('/partners/locations', [LocationController::class, 'index'])->middleware('permission:partners,view')->name('partners.locations.index');
        Route::post('/partners/locations', [LocationController::class, 'store'])->middleware('permission:partners,create')->name('partners.locations.store');
        Route::patch('/partners/locations/{location}', [LocationController::class, 'update'])->middleware('permission:partners,update')->name('partners.locations.update');
        Route::delete('/partners/locations/{location}', [LocationController::class, 'destroy'])->middleware('permission:partners,delete')->name('partners.locations.destroy');

        Route::get('/partners/industries', [PartnerIndustryController::class, 'index'])->middleware('permission:partners,view')->name('partners.industries.index');
        Route::post('/partners/industries', [PartnerIndustryController::class, 'store'])->middleware('permission:partners,create')->name('partners.industries.store');
        Route::patch('/partners/industries/{industry}', [PartnerIndustryController::class, 'update'])->middleware('permission:partners,update')->name('partners.industries.update');
        Route::delete('/partners/industries/{industry}', [PartnerIndustryController::class, 'destroy'])->middleware('permission:partners,delete')->name('partners.industries.destroy');

        Route::get('/partners/types', [PartnerTypeController::class, 'index'])->middleware('permission:partners,view')->name('partners.types.index');
        Route::post('/partners/types', [PartnerTypeController::class, 'store'])->middleware('permission:partners,create')->name('partners.types.store');
        Route::patch('/partners/types/{type}', [PartnerTypeController::class, 'update'])->middleware('permission:partners,update')->name('partners.types.update');
        Route::delete('/partners/types/{type}', [PartnerTypeController::class, 'destroy'])->middleware('permission:partners,delete')->name('partners.types.destroy');

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
