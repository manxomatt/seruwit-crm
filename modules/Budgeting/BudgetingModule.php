<?php

namespace Modules\Budgeting;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Budgeting\Http\Controllers\BudgetController;

/**
 * Financial Budgeting & Variance Analysis module: annual/period budgets per COA
 * account and budget vs actual realization reporting.
 */
class BudgetingModule implements ModuleContract
{
    public function key(): string
    {
        return 'budgeting';
    }

    public function label(): string
    {
        return 'Anggaran (Budgeting)';
    }

    public function description(): string
    {
        return 'Penyusunan anggaran tahunan & bulanan per akun COA serta analisis varians realisasi anggaran vs aktual.';
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
            'manage_budget',
        ];
    }

    public function requires(): array
    {
        return ['accounting'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Anggaran (Budget)',
            'slug' => 'budgeting',
            'icon' => 'chart-pie',
            'route_name' => 'budgeting.index',
            'permission_module' => 'budgeting',
            'permission_action' => 'view',
            'sort_order' => 16,
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
        Route::middleware(['auth', 'permission:budgeting|accounting,view'])->prefix('budgeting')->name('budgeting.')->group(function (): void {
            Route::get('/', [BudgetController::class, 'index'])->name('index');
            Route::get('/create', [BudgetController::class, 'create'])
                ->middleware('permission:budgeting|accounting,manage_budget')
                ->name('create');
            Route::post('/', [BudgetController::class, 'store'])
                ->middleware('permission:budgeting|accounting,manage_budget')
                ->name('store');
        });
    }
}
