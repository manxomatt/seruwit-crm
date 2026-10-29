<?php

namespace Modules\FleetCompliance;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\FleetCompliance\Http\Controllers\FleetComplianceController;

/**
 * FleetCompliance module: vehicle compliance tracking (annual STNK,
 * 5-year plate renewal, insurance, KIR inspections) and renewal logs.
 */
class FleetComplianceModule implements ModuleContract
{
    public function key(): string
    {
        return 'fleet-compliance';
    }

    public function label(): string
    {
        return 'Kepatuhan Armada';
    }

    public function description(): string
    {
        return 'Matriks pemantauan jatuh tempo STNK tahunan, ganti plat 5 tahunan, KIR, polis asuransi armada, dan pencatatan perpanjangan.';
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
            'renew',
        ];
    }

    public function requires(): array
    {
        return ['fleet'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Kepatuhan Armada',
            'slug' => 'fleet-compliance',
            'icon' => 'document',
            'route_name' => 'fleet-compliance.index',
            'permission_module' => 'fleet-compliance',
            'permission_action' => 'view',
            'sort_order' => 10,
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
        // Primary routes for fleet-compliance (singular)
        Route::get('/fleet-compliance', [FleetComplianceController::class, 'index'])
            ->middleware('permission:fleet-compliance,view')
            ->name('fleet-compliance.index');

        Route::post('/fleet-compliance/vehicles/{vehicle}/renew', [FleetComplianceController::class, 'renew'])
            ->middleware('permission:fleet-compliance,renew')
            ->name('fleet-compliance.renew');

        Route::post('/fleet-compliance/vehicles/{vehicle}/compliance/renew', [FleetComplianceController::class, 'renew'])
            ->middleware('permission:fleet-compliance,renew')
            ->name('fleet-compliance.vehicles.renew');

        // Primary routes for fleet-compliances (plural alias)
        Route::get('/fleet-compliances', [FleetComplianceController::class, 'index'])
            ->middleware('permission:fleet-compliance,view')
            ->name('fleet-compliances.index');

        Route::post('/fleet-compliances/vehicles/{vehicle}/renew', [FleetComplianceController::class, 'renew'])
            ->middleware('permission:fleet-compliance,renew')
            ->name('fleet-compliances.renew');

        Route::post('/fleet-compliances/vehicles/{vehicle}/compliance/renew', [FleetComplianceController::class, 'renew'])
            ->middleware('permission:fleet-compliance,renew')
            ->name('fleet-compliances.vehicles.renew');

        // Backward compatibility routes for legacy fleet.compliance.* and documents.compliance.*
        Route::get('/fleet/compliance', [FleetComplianceController::class, 'index'])
            ->middleware('permission:fleet-compliance|document-compliance|fleet,view')
            ->name('fleet.compliance.index');

        Route::post('/fleet/vehicles/{vehicle}/compliance/renew', [FleetComplianceController::class, 'renew'])
            ->middleware('permission:fleet-compliance|document-compliance|fleet,renew')
            ->name('fleet.compliance.renew');

        Route::get('/documents/compliance', [FleetComplianceController::class, 'index'])
            ->middleware('permission:fleet-compliance|document-compliance|document,view')
            ->name('documents.compliance.index');
    }
}
