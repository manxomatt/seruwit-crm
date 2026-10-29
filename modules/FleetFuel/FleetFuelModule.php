<?php

namespace Modules\FleetFuel;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\FleetFuel\Http\Controllers\FuelAnalyticsController;
use Modules\FleetFuel\Http\Controllers\FuelLogController;

/**
 * FleetFuel module: vehicle fuel logs, consumption calculation,
 * anomaly detection (overfill, efficiency drop), and fleet fuel analytics.
 */
class FleetFuelModule implements ModuleContract
{
    public function key(): string
    {
        return 'fleet-fuel';
    }

    public function label(): string
    {
        return 'Bahan Bakar & Efisiensi';
    }

    public function description(): string
    {
        return 'Pencatatan konsumsi BBM armada, deteksi anomali/kebocoran BBM, dan analitik efisiensi km/liter.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return [
            'view',
            'create',
            'update',
            'delete',
        ];
    }

    public function requires(): array
    {
        return ['fleet'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Bahan Bakar (BBM)',
            'slug' => 'fleet-fuel',
            'icon' => 'fleet-fuel',
            'route_name' => 'fleet-fuel.index',
            'permission_module' => 'fleet-fuel',
            'permission_action' => 'view',
            'sort_order' => 9,
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
        // Primary routes for fleet-fuel (singular)
        Route::get('/fleet-fuel', [FuelLogController::class, 'index'])
            ->middleware('permission:fleet-fuel,view')
            ->name('fleet-fuel.index');

        Route::get('/fleet-fuel/analytics', [FuelAnalyticsController::class, 'index'])
            ->middleware('permission:fleet-fuel,view')
            ->name('fleet-fuel.analytics');

        Route::post('/fleet-fuel/vehicles/{vehicle}/logs', [FuelLogController::class, 'store'])
            ->middleware('permission:fleet-fuel,create')
            ->name('fleet-fuel.vehicles.logs.store');

        Route::delete('/fleet-fuel/vehicles/{vehicle}/logs/{fuelLog}', [FuelLogController::class, 'destroy'])
            ->middleware('permission:fleet-fuel,delete')
            ->name('fleet-fuel.vehicles.logs.destroy');

        // Primary routes for fleet-fuels (plural alias)
        Route::get('/fleet-fuels', [FuelLogController::class, 'index'])
            ->middleware('permission:fleet-fuel,view')
            ->name('fleet-fuels.index');

        Route::get('/fleet-fuels/analytics', [FuelAnalyticsController::class, 'index'])
            ->middleware('permission:fleet-fuel,view')
            ->name('fleet-fuels.analytics');

        // Backward compatibility routes for legacy fleet.fuel.* and vehicle fuel-logs
        Route::get('/fleet/fuel', [FuelLogController::class, 'index'])
            ->middleware('permission:fleet-fuel|fleet,view')
            ->name('fleet.fuel.index');

        Route::get('/fleet/fuel/analytics', [FuelAnalyticsController::class, 'index'])
            ->middleware('permission:fleet-fuel|fleet,view')
            ->name('fleet.fuel.analytics');

        Route::post('/fleet/vehicles/{vehicle}/fuel-logs', [FuelLogController::class, 'store'])
            ->middleware('permission:fleet-fuel|fleet,create')
            ->name('fleet.vehicles.fuel-logs.store');

        Route::delete('/fleet/vehicles/{vehicle}/fuel-logs/{fuelLog}', [FuelLogController::class, 'destroy'])
            ->middleware('permission:fleet-fuel|fleet,delete')
            ->name('fleet.vehicles.fuel-logs.destroy');
    }
}
