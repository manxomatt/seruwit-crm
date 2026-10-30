<?php

namespace Modules\RentalDispatch;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\RentalDispatch\Http\Controllers\RentalDispatchController;

/**
 * Delivery & Pickup Runner Dispatch module:
 * manages assigning drivers/runners to deliver vehicles to customers (e.g. airport/hotel)
 * and pick up vehicles upon rental completion, with real-time status and delivery fee tracking.
 */
class RentalDispatchModule implements ModuleContract
{
    public function key(): string
    {
        return 'rental-dispatch';
    }

    public function label(): string
    {
        return 'Antar-Jemput (Runner Dispatch)';
    }

    public function description(): string
    {
        return 'Manajemen penugasan runner untuk pengantaran (delivery) dan penjemputan (pickup) unit rental ke lokasi penyewa.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        return ['view', 'dispatch'];
    }

    public function requires(): array
    {
        return ['rental'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Antar-Jemput (Dispatch)',
            'slug' => 'rental-dispatch',
            'icon' => 'truck',
            'route_name' => 'rental.dispatch.index',
            'permission_module' => 'rental-dispatch',
            'permission_action' => 'dispatch',
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
        // Primary routes (matching rental.dispatch.* for 100% backward compatibility)
        Route::get('/rental/dispatch', [RentalDispatchController::class, 'index'])
            ->middleware('permission:rental-dispatch|rental,dispatch|view')
            ->name('rental.dispatch.index');

        Route::post('/rental/{rental}/dispatch', [RentalDispatchController::class, 'store'])
            ->whereNumber('rental')
            ->middleware('permission:rental-dispatch|rental,dispatch')
            ->name('rental.dispatch.store');

        Route::post('/rental/{rental}/dispatch/auto-generate', [RentalDispatchController::class, 'autoGenerate'])
            ->whereNumber('rental')
            ->middleware('permission:rental-dispatch|rental,dispatch')
            ->name('rental.dispatch.auto_generate');

        Route::patch('/rental/dispatch/{dispatch}/assign', [RentalDispatchController::class, 'assign'])
            ->whereNumber('dispatch')
            ->middleware('permission:rental-dispatch|rental,dispatch')
            ->name('rental.dispatch.assign');

        Route::patch('/rental/dispatch/{dispatch}/status', [RentalDispatchController::class, 'updateStatus'])
            ->whereNumber('dispatch')
            ->middleware('permission:rental-dispatch|rental,dispatch')
            ->name('rental.dispatch.status');

        // Route aliases for standalone /rental-dispatches
        Route::get('/rental-dispatches', [RentalDispatchController::class, 'index'])
            ->middleware('permission:rental-dispatch|rental,dispatch|view')
            ->name('rental-dispatches.index');
    }
}
