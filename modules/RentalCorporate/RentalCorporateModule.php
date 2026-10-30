<?php

namespace Modules\RentalCorporate;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\RentalCorporate\Http\Controllers\RentalCorporateContractController;

/**
 * B2B Corporate Contracts module: handles corporate master agreements,
 * credit limits, vehicle allocations, SLA replacements, and consolidated monthly billing.
 */
class RentalCorporateModule implements ModuleContract
{
    public function key(): string
    {
        return 'rental-corporate';
    }

    public function label(): string
    {
        return 'Kontrak Korporat B2B';
    }

    public function description(): string
    {
        return 'Kontrak sewa korporat B2B, limit kredit, SLA penggantian unit, dan konsolidasi invoice bulanan.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return ['view', 'bookings', 'finance'];
    }

    public function requires(): array
    {
        return ['rental', 'partners', 'invoicing'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Kontrak Korporat B2B',
            'slug' => 'rental-corporate',
            'icon' => 'building',
            'route_name' => 'rental.corporate.index',
            'permission_module' => 'rental-corporate',
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
        // Primary routes for Corporate Contracts (matching rental.corporate.* for backward compatibility)
        Route::get('/rental/corporate-contracts', [RentalCorporateContractController::class, 'index'])
            ->middleware('permission:rental-corporate|rental,view')
            ->name('rental.corporate.index');

        Route::get('/rental/corporate-contracts/create', [RentalCorporateContractController::class, 'create'])
            ->middleware('permission:rental-corporate|rental,bookings')
            ->name('rental.corporate.create');

        Route::post('/rental/corporate-contracts', [RentalCorporateContractController::class, 'store'])
            ->middleware('permission:rental-corporate|rental,bookings')
            ->name('rental.corporate.store');

        Route::get('/rental/corporate-contracts/{contract}', [RentalCorporateContractController::class, 'show'])
            ->whereNumber('contract')
            ->middleware('permission:rental-corporate|rental,view')
            ->name('rental.corporate.show');

        Route::get('/rental/corporate-contracts/{contract}/edit', [RentalCorporateContractController::class, 'edit'])
            ->whereNumber('contract')
            ->middleware('permission:rental-corporate|rental,bookings')
            ->name('rental.corporate.edit');

        Route::put('/rental/corporate-contracts/{contract}', [RentalCorporateContractController::class, 'update'])
            ->whereNumber('contract')
            ->middleware('permission:rental-corporate|rental,bookings')
            ->name('rental.corporate.update');

        Route::post('/rental/corporate-contracts/{contract}/attach-rentals', [RentalCorporateContractController::class, 'attachRentals'])
            ->whereNumber('contract')
            ->middleware('permission:rental-corporate|rental,bookings')
            ->name('rental.corporate.attach_rentals');

        Route::post('/rental/corporate-contracts/{contract}/consolidate-invoice', [RentalCorporateContractController::class, 'consolidateInvoice'])
            ->whereNumber('contract')
            ->middleware('permission:rental-corporate|rental,finance')
            ->name('rental.corporate.consolidate_invoice');

        // Route aliases for standalone /rental-corporate/contracts
        Route::get('/rental-corporate/contracts', [RentalCorporateContractController::class, 'index'])
            ->middleware('permission:rental-corporate|rental,view')
            ->name('rental-corporate.contracts.index');

        Route::get('/rental-corporate/contracts/{contract}', [RentalCorporateContractController::class, 'show'])
            ->whereNumber('contract')
            ->middleware('permission:rental-corporate|rental,view')
            ->name('rental-corporate.contracts.show');
    }
}
