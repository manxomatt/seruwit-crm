<?php

namespace Modules\Collections;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Collections\Http\Controllers\CollectionDashboardController;
use Modules\Collections\Http\Controllers\PostDatedCheckController;

class CollectionsModule implements ModuleContract
{
    public function key(): string
    {
        return 'collections';
    }

    public function label(): string
    {
        return 'Penagihan AR & Giro (Collections)';
    }

    public function description(): string
    {
        return 'Otomasi penagihan piutang (dunning reminder WhatsApp), pencatatan janji bayar, serta manajemen bilyet giro & cek mundur (PDC).';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function permissions(): array
    {
        return [
            'view',
            'remind',
            'manage_pdc',
            'delete',
        ];
    }

    public function requires(): array
    {
        return ['partners', 'invoicing', 'receivables'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Penagihan & Giro',
            'slug' => 'collections',
            'icon' => 'clipboard-document-check',
            'route_name' => 'collections.dashboard',
            'permission_module' => 'collections',
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
        Route::get('/collections', [CollectionDashboardController::class, 'index'])
            ->middleware('permission:collections,view')
            ->name('collections.dashboard');

        Route::post('/collections/remind/{invoice}', [CollectionDashboardController::class, 'sendReminder'])
            ->whereNumber('invoice')
            ->middleware('permission:collections,remind')
            ->name('collections.remind');

        Route::post('/collections/promises', [CollectionDashboardController::class, 'storePromise'])
            ->middleware('permission:collections,remind')
            ->name('collections.promises.store');

        Route::post('/collections/promises/{promise}/fulfill', [CollectionDashboardController::class, 'fulfillPromise'])
            ->whereNumber('promise')
            ->middleware('permission:collections,remind')
            ->name('collections.promises.fulfill');

        Route::get('/collections/pdc', [PostDatedCheckController::class, 'index'])
            ->middleware('permission:collections,view')
            ->name('collections.pdc.index');

        Route::post('/collections/pdc', [PostDatedCheckController::class, 'store'])
            ->middleware('permission:collections,manage_pdc')
            ->name('collections.pdc.store');

        Route::post('/collections/pdc/{pdc}/deposit', [PostDatedCheckController::class, 'deposit'])
            ->whereNumber('pdc')
            ->middleware('permission:collections,manage_pdc')
            ->name('collections.pdc.deposit');

        Route::post('/collections/pdc/{pdc}/clear', [PostDatedCheckController::class, 'clear'])
            ->whereNumber('pdc')
            ->middleware('permission:collections,manage_pdc')
            ->name('collections.pdc.clear');

        Route::post('/collections/pdc/{pdc}/bounce', [PostDatedCheckController::class, 'bounce'])
            ->whereNumber('pdc')
            ->middleware('permission:collections,manage_pdc')
            ->name('collections.pdc.bounce');

        Route::delete('/collections/pdc/{pdc}', [PostDatedCheckController::class, 'destroy'])
            ->whereNumber('pdc')
            ->middleware('permission:collections,delete')
            ->name('collections.pdc.destroy');
    }
}
