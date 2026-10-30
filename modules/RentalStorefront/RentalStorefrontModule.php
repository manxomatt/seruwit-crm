<?php

namespace Modules\RentalStorefront;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;

/**
 * Public Rental Storefront & Customer Self-Service Portal module:
 * manages public web booking engine, vehicle showcase catalog, payment gateway checkout,
 * booking self-tracking, customer auth, and customer profile portal.
 */
class RentalStorefrontModule implements ModuleContract
{
    public function key(): string
    {
        return 'rental-storefront';
    }

    public function label(): string
    {
        return 'Website Booking & Portal Mandiri (Storefront)';
    }

    public function description(): string
    {
        return 'Katalog dan website reservasi online publik, payment gateway konsumen, tracking pemesanan mandiri, dan portal akun penyewa.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return ['view', 'manage_storefront'];
    }

    public function requires(): array
    {
        return ['rental'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Storefront & Portal Online',
            'slug' => 'rental-storefront',
            'icon' => 'globe-alt',
            'route_name' => 'rental.settings.index',
            'permission_module' => 'rental-storefront',
            'permission_action' => 'manage_storefront',
            'sort_order' => 14,
        ];
    }

    public function migrationsPath(): string
    {
        return __DIR__.'/Database/Migrations';
    }

    public function viewsPath(): ?string
    {
        return __DIR__.'/resources/views';
    }

    public function boot(): void
    {
        //
    }

    public function routes(): void
    {
        Route::get('/rental-storefront/settings', function () {
            return redirect()->route('module.rental.settings.index');
        })->middleware('permission:rental-storefront|rental,manage_storefront|settings')
            ->name('rental-storefront.settings');
    }
}
