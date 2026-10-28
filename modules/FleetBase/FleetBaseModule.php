<?php

namespace Modules\FleetBase;

use App\Models\User;
use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\FleetBase\AI\Contracts\FleetBaseAiGeneratorServiceInterface;
use Modules\FleetBase\AI\Services\GeminiFleetBaseAiGeneratorService;
use Modules\FleetBase\Http\Controllers\FleetBaseAiGenerateController;
use Modules\FleetBase\Http\Controllers\FleetBaseController;
use Modules\FleetBase\Models\FleetBase;

/**
 * Master Pool / Depo foundation module: handles operational bases, depots,
 * staging hubs, branch offices, and staff/manager assignment.
 *
 * Sits in the Foundation tier alongside Fleet, Driver, and Partners, so consumer
 * modules (Fleet, Rental, Shuttle, Transportation, Inventory/Logistics) can
 * reference bases without tight coupling to vehicle assets.
 */
class FleetBaseModule implements ModuleContract
{
    public function key(): string
    {
        return 'fleet-base';
    }

    public function label(): string
    {
        return 'Pool & Depo';
    }

    public function description(): string
    {
        return 'Manajemen master pool, depo, cabang operasional armada/logistik, dan alokasi kepala pool serta staf.';
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
        ];
    }

    public function requires(): array
    {
        return [];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Pool & Depo',
            'slug' => 'fleet-base',
            'icon' => 'fleet-base',
            'route_name' => 'fleet-bases.index',
            'permission_module' => 'fleet-base',
            'permission_action' => 'view',
            'sort_order' => 6,
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
        User::resolveRelationUsing(
            'fleetBases',
            fn (User $user) => $user->belongsToMany(FleetBase::class, 'user_fleet_base')->withTimestamps(),
        );

        if (! app()->bound(FleetBaseAiGeneratorServiceInterface::class)) {
            app()->bind(
                FleetBaseAiGeneratorServiceInterface::class,
                GeminiFleetBaseAiGeneratorService::class
            );
        }
    }

    public function routes(): void
    {
        // Primary standalone routes: /fleet-bases/*
        Route::get('/fleet-bases', [FleetBaseController::class, 'index'])->middleware('permission:fleet-base|fleet,view')->name('fleet-bases.index');
        Route::get('/fleet-bases/create', [FleetBaseController::class, 'create'])->middleware('permission:fleet-base|fleet,create')->name('fleet-bases.create');
        Route::post('/fleet-bases', [FleetBaseController::class, 'store'])->middleware('permission:fleet-base|fleet,create')->name('fleet-bases.store');
        Route::post('/fleet-bases/ai-generate', [FleetBaseAiGenerateController::class, 'generate'])->middleware('permission:fleet-base|fleet,create')->name('fleet-bases.ai-generate');
        Route::patch('/fleet-bases/batch-status', [FleetBaseController::class, 'batchUpdateStatus'])->middleware('permission:fleet-base|fleet,update')->name('fleet-bases.batch-status');
        Route::post('/fleet-bases/batch-destroy', [FleetBaseController::class, 'batchDestroy'])->middleware('permission:fleet-base|fleet,delete')->name('fleet-bases.batch-destroy');
        Route::get('/fleet-bases/{fleetBase}', [FleetBaseController::class, 'show'])->middleware('permission:fleet-base|fleet,view')->name('fleet-bases.show');
        Route::get('/fleet-bases/{fleetBase}/edit', [FleetBaseController::class, 'edit'])->middleware('permission:fleet-base|fleet,update')->name('fleet-bases.edit');
        Route::patch('/fleet-bases/{fleetBase}', [FleetBaseController::class, 'update'])->middleware('permission:fleet-base|fleet,update')->name('fleet-bases.update');
        Route::delete('/fleet-bases/{fleetBase}', [FleetBaseController::class, 'destroy'])->middleware('permission:fleet-base|fleet,delete')->name('fleet-bases.destroy');

        // Backward compatibility routes & names: /fleet/bases/*
        Route::get('/fleet/bases', [FleetBaseController::class, 'index'])->middleware('permission:fleet-base|fleet,view')->name('fleet.bases.index');
        Route::get('/fleet/bases/create', [FleetBaseController::class, 'create'])->middleware('permission:fleet-base|fleet,create')->name('fleet.bases.create');
        Route::post('/fleet/bases', [FleetBaseController::class, 'store'])->middleware('permission:fleet-base|fleet,create')->name('fleet.bases.store');
        Route::post('/fleet/bases/ai-generate', [FleetBaseAiGenerateController::class, 'generate'])->middleware('permission:fleet-base|fleet,create')->name('fleet.bases.ai-generate');
        Route::patch('/fleet/bases/batch-status', [FleetBaseController::class, 'batchUpdateStatus'])->middleware('permission:fleet-base|fleet,update')->name('fleet.bases.batch-status');
        Route::post('/fleet/bases/batch-destroy', [FleetBaseController::class, 'batchDestroy'])->middleware('permission:fleet-base|fleet,delete')->name('fleet.bases.batch-destroy');
        Route::get('/fleet/bases/{fleetBase}', [FleetBaseController::class, 'show'])->middleware('permission:fleet-base|fleet,view')->name('fleet.bases.show');
        Route::get('/fleet/bases/{fleetBase}/edit', [FleetBaseController::class, 'edit'])->middleware('permission:fleet-base|fleet,update')->name('fleet.bases.edit');
        Route::patch('/fleet/bases/{fleetBase}', [FleetBaseController::class, 'update'])->middleware('permission:fleet-base|fleet,update')->name('fleet.bases.update');
        Route::delete('/fleet/bases/{fleetBase}', [FleetBaseController::class, 'destroy'])->middleware('permission:fleet-base|fleet,delete')->name('fleet.bases.destroy');
    }
}
