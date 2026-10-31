<?php

namespace Modules\FixedAssets;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\FixedAssets\Http\Controllers\FixedAssetController;

/**
 * Fixed Assets & Depreciation module: capital asset register, straight-line
 * monthly depreciation runs, and automated GL acquisition/depreciation journals.
 */
class FixedAssetsModule implements ModuleContract
{
    public function key(): string
    {
        return 'fixed-assets';
    }

    public function label(): string
    {
        return 'Aset Tetap & Penyusutan';
    }

    public function description(): string
    {
        return 'Register aset tetap (kendaraan, peralatan, properti), nilai buku, dan penyusutan bulanan otomatis ke jurnal umum.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function permissions(): array
    {
        return [
            'view',
            'create',
            'update',
            'delete',
            'depreciate',
            'manage_assets',
        ];
    }

    public function requires(): array
    {
        return ['accounting'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Aset Tetap',
            'slug' => 'fixed-assets',
            'icon' => 'cube',
            'route_name' => 'fixed-assets.index',
            'permission_module' => 'fixed-assets',
            'permission_action' => 'view',
            'sort_order' => 15,
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
        Route::middleware(['auth', 'permission:fixed-assets|accounting,view'])->prefix('fixed-assets')->name('fixed-assets.')->group(function (): void {
            Route::get('/', [FixedAssetController::class, 'index'])->name('index');
            Route::get('/create', [FixedAssetController::class, 'create'])
                ->middleware('permission:fixed-assets|accounting,manage_assets')
                ->name('create');
            Route::post('/', [FixedAssetController::class, 'store'])
                ->middleware('permission:fixed-assets|accounting,manage_assets')
                ->name('store');
            Route::post('/depreciate', [FixedAssetController::class, 'depreciate'])
                ->middleware('permission:fixed-assets|accounting,manage_assets')
                ->name('depreciate');
        });
    }
}
