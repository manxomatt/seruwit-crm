<?php

namespace Modules\Routing;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Routing\Http\Controllers\RoutePlanController;

/**
 * Route Optimization Engine — capacitated VRP for automatic driver + vehicle
 * assignment that minimises distance / fuel cost across confirmed delivery orders.
 */
class RoutingModule implements ModuleContract
{
    public function key(): string
    {
        return 'routing';
    }

    public function label(): string
    {
        return 'Route Optimization';
    }

    public function description(): string
    {
        return 'VRP engine: auto-assign drivers and vehicles to multi-stop routes while minimising distance and fuel cost.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete', 'optimize', 'apply'];
    }

    public function requires(): array
    {
        return ['transportation', 'orders'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Route Optimization',
            'slug' => 'routing',
            'icon' => 'routing',
            'route_name' => 'routing.plans.index',
            'permission_module' => 'routing',
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
        Route::middleware(['auth', 'permission:routing,view'])->group(function (): void {
            Route::get('/routing', function () {
                return redirect('/module/routing/plans');
            });

            Route::prefix('routing')->name('routing.')->group(function (): void {
                Route::get('/plans', [RoutePlanController::class, 'index'])->name('plans.index');
                Route::get('/plans/create', [RoutePlanController::class, 'create'])->middleware('permission:routing,create')->name('plans.create');
                Route::post('/plans', [RoutePlanController::class, 'store'])->middleware('permission:routing,create')->name('plans.store');
                Route::get('/plans/{plan}', [RoutePlanController::class, 'show'])->name('plans.show');
                Route::post('/plans/{plan}/optimize', [RoutePlanController::class, 'optimize'])->middleware('permission:routing,optimize')->name('plans.optimize');
                Route::post('/plans/{plan}/apply', [RoutePlanController::class, 'apply'])->middleware('permission:routing,apply')->name('plans.apply');
                Route::post('/plans/{plan}/cancel', [RoutePlanController::class, 'cancel'])->middleware('permission:routing,delete')->name('plans.cancel');
                Route::patch('/plans/{plan}/routes/{routePlanRoute}', [RoutePlanController::class, 'updateRoute'])->middleware('permission:routing,update')->name('plans.routes.update');
            });
        });
    }
}
