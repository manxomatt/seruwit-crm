<?php

namespace Modules\TradePromotions;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\TradePromotions\Http\Controllers\PromoAwardController;
use Modules\TradePromotions\Http\Controllers\PromoProgramController;
use Modules\TradePromotions\Http\Controllers\PromoRealizationController;
use Modules\TradePromotions\Http\Controllers\PromoReportController;

/**
 * Trade promotion programs for FMCG principals: volume discount, free goods,
 * and rebates with active periods and realization vs target.
 */
class TradePromotionsModule implements ModuleContract
{
    public function key(): string
    {
        return 'promotions';
    }

    public function label(): string
    {
        return 'Trade Promotions';
    }

    public function description(): string
    {
        return 'Distributor promo programs — volume discount, free goods, rebate — with active periods and realization vs target.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete', 'settle'];
    }

    public function requires(): array
    {
        return ['partners', 'products', 'inventory'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Trade Promotions',
            'slug' => 'promotions',
            'icon' => 'promotions',
            'route_name' => 'promotions.programs.index',
            'permission_module' => 'promotions',
            'permission_action' => 'view',
            'sort_order' => 8,
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
        // Soft realization is triggered from the UI / sync endpoint so Orders
        // stays unaware of this module. No hard listener required for v1.
    }

    public function routes(): void
    {
        Route::middleware(['auth', 'permission:promotions,view'])->group(function (): void {
            Route::get('/promotions', function () {
                return redirect('/module/promotions/programs');
            });

            Route::prefix('promotions')->name('promotions.')->group(function (): void {
                Route::get('/programs', [PromoProgramController::class, 'index'])->name('programs.index');
                Route::get('/programs/create', [PromoProgramController::class, 'create'])->middleware('permission:promotions,create')->name('programs.create');
                Route::post('/programs', [PromoProgramController::class, 'store'])->middleware('permission:promotions,create')->name('programs.store');
                Route::get('/programs/{program}', [PromoProgramController::class, 'show'])->name('programs.show');
                Route::get('/programs/{program}/edit', [PromoProgramController::class, 'edit'])->middleware('permission:promotions,update')->name('programs.edit');
                Route::patch('/programs/{program}', [PromoProgramController::class, 'update'])->middleware('permission:promotions,update')->name('programs.update');
                Route::post('/programs/{program}/activate', [PromoProgramController::class, 'activate'])->middleware('permission:promotions,update')->name('programs.activate');
                Route::post('/programs/{program}/close', [PromoProgramController::class, 'close'])->middleware('permission:promotions,update')->name('programs.close');
                Route::delete('/programs/{program}', [PromoProgramController::class, 'destroy'])->middleware('permission:promotions,delete')->name('programs.destroy');

                Route::get('/realizations', [PromoRealizationController::class, 'index'])->name('realizations.index');
                Route::post('/programs/{program}/sync', [PromoRealizationController::class, 'sync'])->middleware('permission:promotions,update')->name('programs.sync');

                Route::get('/reports', [PromoReportController::class, 'index'])->name('reports.index');

                Route::post('/awards/{award}/settle', [PromoAwardController::class, 'settle'])->middleware('permission:promotions,settle')->name('awards.settle');
            });
        });
    }
}
