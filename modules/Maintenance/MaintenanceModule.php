<?php

namespace Modules\Maintenance;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Console\Application as Artisan;
use Illuminate\Support\Facades\Route;
use Modules\Maintenance\Console\Commands\MaintenanceScanDue;
use Modules\Maintenance\Http\Controllers\BayCalendarController;
use Modules\Maintenance\Http\Controllers\MaintenanceAiPredictiveController;
use Modules\Maintenance\Http\Controllers\MaintenanceAnalyticsController;
use Modules\Maintenance\Http\Controllers\MaintenanceBayController;
use Modules\Maintenance\Http\Controllers\MaintenanceCategoryController;
use Modules\Maintenance\Http\Controllers\MaintenanceController;
use Modules\Maintenance\Http\Controllers\MaintenanceScheduleController;
use Modules\Maintenance\Http\Controllers\MaintenanceSettingsController;
use Modules\Maintenance\Http\Controllers\WipBoardController;
use Modules\Maintenance\Http\Controllers\WorkOrderChecklistController;
use Modules\Maintenance\Http\Controllers\WorkOrderController;
use Modules\Maintenance\Http\Controllers\WorkOrderPdfController;

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

    public function tier(): ModuleTier
    {
        return ModuleTier::Foundation;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete', 'approve', 'assign', 'manage_bays'];
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
        return __DIR__.'/resources/views';
    }

    public function boot(): void
    {
        Artisan::starting(fn (Artisan $artisan) => $artisan->resolveCommands([
            MaintenanceScanDue::class,
        ]));
    }

    public function routes(): void
    {
        // Dashboard
        Route::get('/maintenance', [MaintenanceController::class, 'index'])
            ->middleware('permission:maintenance,view')
            ->name('maintenance.index');

        // WIP Board
        Route::get('/maintenance/wip', [WipBoardController::class, 'index'])
            ->middleware('permission:maintenance,view')
            ->name('maintenance.wip.index');

        Route::patch('/maintenance/wip/{workOrder}', [WipBoardController::class, 'updateCard'])
            ->name('maintenance.wip.update');

        Route::get('/maintenance/calendar', [BayCalendarController::class, 'index'])
            ->middleware('permission:maintenance,view')
            ->name('maintenance.calendar.index');

        Route::get('/maintenance/analytics', [MaintenanceAnalyticsController::class, 'index'])
            ->middleware('permission:maintenance,view')
            ->name('maintenance.analytics.index');

        // AI Predictive Maintenance & Anomaly Detection
        Route::post('/maintenance/ai-predictive/analyze', [MaintenanceAiPredictiveController::class, 'analyze'])
            ->middleware('permission:maintenance,view')
            ->name('maintenance.ai_predictive_analyze');
        Route::post('/maintenance/ai-predictive/vehicle/{vehicle}', [MaintenanceAiPredictiveController::class, 'diagnoseVehicle'])
            ->middleware('permission:maintenance,view')
            ->name('maintenance.ai_predictive_vehicle');
        Route::post('/maintenance/ai-predictive/create-work-order', [MaintenanceAiPredictiveController::class, 'createWorkOrder'])
            ->middleware('permission:maintenance,create')
            ->name('maintenance.ai_predictive_create_wo');

        Route::get('/maintenance/settings', [MaintenanceSettingsController::class, 'edit'])
            ->middleware('permission:maintenance,update')
            ->name('maintenance.settings.edit');

        Route::patch('/maintenance/settings', [MaintenanceSettingsController::class, 'update'])
            ->middleware('permission:maintenance,update')
            ->name('maintenance.settings.update');

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

        Route::get('/maintenance/work-orders/{workOrder}/job-card', [WorkOrderPdfController::class, 'jobCard'])
            ->middleware('permission:maintenance,view')
            ->name('maintenance.work-orders.job-card');

        Route::get('/maintenance/work-orders/{workOrder}/edit', [WorkOrderController::class, 'edit'])
            ->middleware('permission:maintenance,update')
            ->name('maintenance.work-orders.edit');

        Route::patch('/maintenance/work-orders/{workOrder}', [WorkOrderController::class, 'update'])
            ->middleware('permission:maintenance,update')
            ->name('maintenance.work-orders.update');

        Route::patch('/maintenance/work-orders/{workOrder}/status', [WorkOrderController::class, 'updateStatus'])
            ->name('maintenance.work-orders.update-status');

        Route::delete('/maintenance/work-orders/{workOrder}', [WorkOrderController::class, 'destroy'])
            ->middleware('permission:maintenance,delete')
            ->name('maintenance.work-orders.destroy');

        Route::post('/maintenance/work-orders/{workOrder}/checklist', [WorkOrderChecklistController::class, 'store'])
            ->name('maintenance.work-orders.checklist.store');

        Route::patch('/maintenance/work-orders/{workOrder}/checklist/{checklistItem}', [WorkOrderChecklistController::class, 'update'])
            ->name('maintenance.work-orders.checklist.update');

        Route::delete('/maintenance/work-orders/{workOrder}/checklist/{checklistItem}', [WorkOrderChecklistController::class, 'destroy'])
            ->name('maintenance.work-orders.checklist.destroy');

        // Bays
        Route::get('/maintenance/bays', [MaintenanceBayController::class, 'index'])
            ->middleware('permission:maintenance,view')
            ->name('maintenance.bays.index');

        Route::post('/maintenance/bays', [MaintenanceBayController::class, 'store'])
            ->name('maintenance.bays.store');

        Route::patch('/maintenance/bays/{bay}', [MaintenanceBayController::class, 'update'])
            ->name('maintenance.bays.update');

        Route::delete('/maintenance/bays/{bay}', [MaintenanceBayController::class, 'destroy'])
            ->name('maintenance.bays.destroy');

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
