<?php

namespace Modules\ExecutiveDashboard;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\ExecutiveDashboard\Http\Controllers\ExecutiveDashboardController;

/**
 * Executive BI dashboard: OTD, fleet utilization, AR aging, inventory turnover,
 * and revenue per route — aggregated from installed operational modules.
 */
class ExecutiveDashboardModule implements ModuleContract
{
    public function key(): string
    {
        return 'bi';
    }

    public function label(): string
    {
        return 'Dashboard Eksekutif';
    }

    public function description(): string
    {
        return 'Executive BI — OTD rate, fleet utilization, aging AR, inventory turnover, and revenue per route.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return ['view'];
    }

    public function requires(): array
    {
        // Soft dependencies: KPIs appear when source modules are available.
        return [];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Dashboard Eksekutif',
            'slug' => 'bi',
            'icon' => 'bi',
            'route_name' => 'bi.dashboard',
            'permission_module' => 'bi',
            'permission_action' => 'view',
            'sort_order' => 1,
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
        // Aggregation only — no listeners.
    }

    public function routes(): void
    {
        Route::middleware(['auth', 'permission:bi,view'])->group(function (): void {
            Route::get('/bi', [ExecutiveDashboardController::class, 'index'])->name('bi.dashboard');
        });
    }
}
