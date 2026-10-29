<?php

namespace Modules\FleetSettlement;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\FleetSettlement\Http\Controllers\VehicleSettlementController;

/**
 * FleetSettlement module: handles investor asset consignment, revenue sharing,
 * fixed lease settlements, maintenance deductions, and payout statements.
 */
class FleetSettlementModule implements ModuleContract
{
    public function key(): string
    {
        return 'fleet-settlement';
    }

    public function label(): string
    {
        return 'Fleet Settlement';
    }

    public function description(): string
    {
        return 'Manajemen kontrak titipan unit investor/mitra, skema bagi hasil omset/sewa tetap, dan laporan pencairan (settlement).';
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
        return ['fleet', 'partners'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Fleet Settlement',
            'slug' => 'fleet-settlement',
            'icon' => 'fleet-settlement',
            'route_name' => 'fleet-settlement.index',
            'permission_module' => 'fleet-settlement',
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
        //
    }

    public function routes(): void
    {
        // Primary routes for fleet-settlements
        Route::get('/fleet-settlements', [VehicleSettlementController::class, 'index'])
            ->middleware('permission:fleet-settlement,view')
            ->name('fleet-settlements.index');

        // Route alias for singular /fleet-settlement
        Route::get('/fleet-settlement', [VehicleSettlementController::class, 'index'])
            ->middleware('permission:fleet-settlement,view')
            ->name('fleet-settlement.index');

        Route::post('/fleet-settlements/generate', [VehicleSettlementController::class, 'generate'])
            ->middleware('permission:fleet-settlement,update')
            ->name('fleet-settlements.generate');

        Route::post('/fleet-settlement/generate', [VehicleSettlementController::class, 'generate'])
            ->middleware('permission:fleet-settlement,update')
            ->name('fleet-settlement.generate');

        Route::post('/fleet-settlements/payout', [VehicleSettlementController::class, 'savePayout'])
            ->middleware('permission:fleet-settlement,update')
            ->name('fleet-settlements.payout');

        Route::post('/fleet-settlement/payout', [VehicleSettlementController::class, 'savePayout'])
            ->middleware('permission:fleet-settlement,update')
            ->name('fleet-settlement.payout');

        Route::get('/fleet-settlements/vehicles/{vehicle}', [VehicleSettlementController::class, 'show'])
            ->middleware('permission:fleet-settlement,view')
            ->name('fleet-settlements.vehicles.show');

        Route::get('/fleet-settlement/vehicles/{vehicle}', [VehicleSettlementController::class, 'show'])
            ->middleware('permission:fleet-settlement,view')
            ->name('fleet-settlement.vehicles.show');

        // Backward compatibility routes for legacy fleet.settlements.*
        Route::get('/fleet/settlements', [VehicleSettlementController::class, 'index'])
            ->middleware('permission:fleet-settlement|fleet,view')
            ->name('fleet.settlements.index');

        Route::post('/fleet/settlements/generate', [VehicleSettlementController::class, 'generate'])
            ->middleware('permission:fleet-settlement|fleet,update')
            ->name('fleet.settlements.generate');

        Route::post('/fleet/settlements/payout', [VehicleSettlementController::class, 'savePayout'])
            ->middleware('permission:fleet-settlement|fleet,update')
            ->name('fleet.settlements.payout');

        Route::get('/fleet/vehicles/{vehicle}/settlement', [VehicleSettlementController::class, 'show'])
            ->middleware('permission:fleet-settlement|fleet,view')
            ->name('fleet.vehicles.settlement');
    }
}
