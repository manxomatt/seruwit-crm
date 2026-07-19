<?php

namespace Modules\Maintenance;

use App\Modules\ModuleContract;
use Illuminate\Support\Facades\Route;
use Modules\Maintenance\Http\Controllers\MaintenanceCategoryController;
use Modules\Maintenance\Http\Controllers\MaintenanceController;
use Modules\Maintenance\Http\Controllers\MaintenanceScheduleController;
use Modules\Maintenance\Http\Controllers\WorkOrderController;

class MaintenanceModule implements ModuleContract
{
    public function key(): string
    {
        return 'maintenance';
    }

    public function label(): string
    {
        return 'Maintenance';
    }

    public function description(): string
    {
        return 'Work order management for vehicle maintenance: scheduling, tracking, costs, and preventive service reminders.';
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete', 'approve'];
    }

    /**
     * Fleet provides Vehicle records. Maintenance cannot stand alone.
     */
    public function requires(): array
    {
        return ['fleet'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Maintenance',
            'slug' => 'maintenance',
            'icon' => 'maintenance',
            'route_name' => 'maintenance.index',
            'permission_module' => 'maintenance',
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
        // Dashboard
        Route::get('/maintenance', [MaintenanceController::class, 'index'])
            ->middleware('permission:maintenance,view')
            ->name('maintenance.index');

        // Work Orders
        Route::get('/maintenance/work-orders', [WorkOrderController::class, 'index'])
            ->middleware('permission:maintenance,view')
            ->name('maintenance.work-orders.index');

        Route::get('/maintenance/work-orders/create', [WorkOrderController::class, 'create'])
            ->middleware('permission:maintenance,create')
            ->name('maintenance.work-orders.create');

        Route::post('/maintenance/work-orders', [WorkOrderController::class, 'store'])
            ->middleware('permission:maintenance,create')
            ->name('maintenance.work-orders.store');

        Route::get('/maintenance/work-orders/{workOrder}', [WorkOrderController::class, 'show'])
            ->middleware('permission:maintenance,view')
            ->name('maintenance.work-orders.show');

        Route::get('/maintenance/work-orders/{workOrder}/edit', [WorkOrderController::class, 'edit'])
            ->middleware('permission:maintenance,update')
            ->name('maintenance.work-orders.edit');

        Route::patch('/maintenance/work-orders/{workOrder}', [WorkOrderController::class, 'update'])
            ->middleware('permission:maintenance,update')
            ->name('maintenance.work-orders.update');

        Route::delete('/maintenance/work-orders/{workOrder}', [WorkOrderController::class, 'destroy'])
            ->middleware('permission:maintenance,delete')
            ->name('maintenance.work-orders.destroy');

        // Categories
        Route::get('/maintenance/categories', [MaintenanceCategoryController::class, 'index'])
            ->middleware('permission:maintenance,view')
            ->name('maintenance.categories.index');

        Route::post('/maintenance/categories', [MaintenanceCategoryController::class, 'store'])
            ->middleware('permission:maintenance,create')
            ->name('maintenance.categories.store');

        Route::patch('/maintenance/categories/{category}', [MaintenanceCategoryController::class, 'update'])
            ->middleware('permission:maintenance,update')
            ->name('maintenance.categories.update');

        Route::delete('/maintenance/categories/{category}', [MaintenanceCategoryController::class, 'destroy'])
            ->middleware('permission:maintenance,delete')
            ->name('maintenance.categories.destroy');

        // Schedules
        Route::get('/maintenance/schedules', [MaintenanceScheduleController::class, 'index'])
            ->middleware('permission:maintenance,view')
            ->name('maintenance.schedules.index');

        Route::post('/maintenance/schedules', [MaintenanceScheduleController::class, 'store'])
            ->middleware('permission:maintenance,create')
            ->name('maintenance.schedules.store');

        Route::patch('/maintenance/schedules/{schedule}', [MaintenanceScheduleController::class, 'update'])
            ->middleware('permission:maintenance,update')
            ->name('maintenance.schedules.update');

        Route::delete('/maintenance/schedules/{schedule}', [MaintenanceScheduleController::class, 'destroy'])
            ->middleware('permission:maintenance,delete')
            ->name('maintenance.schedules.destroy');
    }
}
