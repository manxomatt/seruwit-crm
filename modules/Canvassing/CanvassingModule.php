<?php

namespace Modules\Canvassing;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Canvassing\Http\Controllers\CanvassingPlanController;
use Modules\Canvassing\Http\Controllers\CanvassingPortalController;
use Modules\Canvassing\Http\Controllers\CanvassingTargetController;
use Modules\Canvassing\Http\Controllers\CanvassingVisitController;
use Modules\Canvassing\Http\Controllers\SalespersonController;

/**
 * Field sales monitoring: track salespeople check-ins, visit outcomes, daily
 * plans, and performance targets.
 *
 * A Vertical module that depends on Partners for prospect/customer records.
 * Salespeople can use the mobile portal (/canvassing/portal/*) with the
 * 'checkin' permission; admin staff use the standard panel with 'view'/'create'.
 */
class CanvassingModule implements ModuleContract
{
    public function key(): string
    {
        return 'canvassing';
    }

    public function label(): string
    {
        return 'Canvassing';
    }

    public function description(): string
    {
        return 'Field sales monitoring: manage salespeople, track visits, check-ins, and performance targets.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete', 'checkin'];
    }

    public function requires(): array
    {
        return ['partners'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Canvassing',
            'slug' => 'canvassing',
            'icon' => 'map-pin',
            'route_name' => 'canvassing.index',
            'permission_module' => 'canvassing',
            'permission_action' => 'view',
            'sort_order' => 12,
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
        // Admin dashboard
        Route::get('/canvassing', [SalespersonController::class, 'dashboard'])->middleware('permission:canvassing,view')->name('canvassing.index');

        // Salespeople CRUD
        Route::get('/canvassing/salespeople', [SalespersonController::class, 'index'])->middleware('permission:canvassing,view')->name('canvassing.salespeople.index');
        Route::get('/canvassing/salespeople/create', [SalespersonController::class, 'create'])->middleware('permission:canvassing,create')->name('canvassing.salespeople.create');
        Route::post('/canvassing/salespeople', [SalespersonController::class, 'store'])->middleware('permission:canvassing,create')->name('canvassing.salespeople.store');
        Route::get('/canvassing/salespeople/{salesperson}', [SalespersonController::class, 'show'])->middleware('permission:canvassing,view')->name('canvassing.salespeople.show');
        Route::get('/canvassing/salespeople/{salesperson}/edit', [SalespersonController::class, 'edit'])->middleware('permission:canvassing,update')->name('canvassing.salespeople.edit');
        Route::patch('/canvassing/salespeople/{salesperson}', [SalespersonController::class, 'update'])->middleware('permission:canvassing,update')->name('canvassing.salespeople.update');
        Route::delete('/canvassing/salespeople/{salesperson}', [SalespersonController::class, 'destroy'])->middleware('permission:canvassing,delete')->name('canvassing.salespeople.destroy');

        // Visits (admin view)
        Route::get('/canvassing/visits', [CanvassingVisitController::class, 'index'])->middleware('permission:canvassing,view')->name('canvassing.visits.index');
        Route::get('/canvassing/visits/{visit}', [CanvassingVisitController::class, 'show'])->middleware('permission:canvassing,view')->name('canvassing.visits.show');

        // Plans (admin view)
        Route::get('/canvassing/plans', [CanvassingPlanController::class, 'index'])->middleware('permission:canvassing,view')->name('canvassing.plans.index');
        Route::post('/canvassing/plans', [CanvassingPlanController::class, 'store'])->middleware('permission:canvassing,create')->name('canvassing.plans.store');
        Route::patch('/canvassing/plans/{plan}', [CanvassingPlanController::class, 'update'])->middleware('permission:canvassing,update')->name('canvassing.plans.update');
        Route::delete('/canvassing/plans/{plan}', [CanvassingPlanController::class, 'destroy'])->middleware('permission:canvassing,delete')->name('canvassing.plans.destroy');

        // Targets
        Route::post('/canvassing/targets', [CanvassingTargetController::class, 'store'])->middleware('permission:canvassing,create')->name('canvassing.targets.store');
        Route::patch('/canvassing/targets/{target}', [CanvassingTargetController::class, 'update'])->middleware('permission:canvassing,update')->name('canvassing.targets.update');
        Route::delete('/canvassing/targets/{target}', [CanvassingTargetController::class, 'destroy'])->middleware('permission:canvassing,delete')->name('canvassing.targets.destroy');

        // Mobile portal (salesperson-facing)
        Route::middleware('permission:canvassing,checkin')->group(function (): void {
            Route::get('/canvassing/portal/today', [CanvassingPortalController::class, 'today'])->name('canvassing.portal.today');
            Route::get('/canvassing/portal/checkin', [CanvassingPortalController::class, 'checkInForm'])->name('canvassing.portal.checkin');
            Route::post('/canvassing/portal/checkin', [CanvassingPortalController::class, 'checkIn'])->name('canvassing.portal.checkin.store');
            Route::get('/canvassing/portal/visits/{visit}', [CanvassingPortalController::class, 'visitDetail'])->name('canvassing.portal.visits.show');
            Route::post('/canvassing/portal/visits/{visit}/checkout', [CanvassingPortalController::class, 'checkOut'])->name('canvassing.portal.visits.checkout');
        });
    }
}
