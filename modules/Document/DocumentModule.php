<?php

namespace Modules\Document;

use App\Modules\ModuleContract;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Route;
use Modules\Document\Http\Controllers\DocumentController;
use Modules\Document\Http\Controllers\DocumentTypeController;
use Modules\Document\Http\Controllers\DriverDocumentController;
use Modules\Document\Http\Controllers\VehicleDocumentController;
use Modules\Document\Models\Document;
use Modules\Document\Observers\DocumentObserver;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;

class DocumentModule implements ModuleContract
{
    public function key(): string
    {
        return 'document';
    }

    public function label(): string
    {
        return 'Documents';
    }

    public function description(): string
    {
        return 'Compliance document management for vehicles and drivers, with expiry tracking and automated reminders.';
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete', 'verify'];
    }

    /**
     * Fleet provides Vehicle and Driver records; Media provides file storage
     * for document scans.
     */
    public function requires(): array
    {
        return ['fleet', 'media'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Documents',
            'slug' => 'documents',
            'icon' => 'documents',
            'route_name' => 'documents.index',
            'permission_module' => 'document',
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

    /**
     * Pure configuration — no tenant is initialized yet at boot. Registers:
     *
     * 1. Morph map so documentable_type stores 'vehicle'/'driver' instead of
     *    the fully-qualified class name (stable across refactors).
     * 2. Reverse relations on Vehicle and Driver so callers can do
     *    $vehicle->documents without Fleet knowing about this module.
     * 3. DocumentObserver to keep Fleet's quick-access expiry columns in sync.
     */
    public function boot(): void
    {
        Relation::morphMap([
            'vehicle' => Vehicle::class,
            'driver' => Driver::class,
        ]);

        Vehicle::resolveRelationUsing(
            'documents',
            fn (Vehicle $vehicle) => $vehicle->morphMany(Document::class, 'documentable'),
        );

        Driver::resolveRelationUsing(
            'documents',
            fn (Driver $driver) => $driver->morphMany(Document::class, 'documentable'),
        );

        Document::observe(DocumentObserver::class);
    }

    public function routes(): void
    {
        // Control-center: all documents across all entities
        Route::get('/documents', [DocumentController::class, 'index'])
            ->middleware('permission:document,view')
            ->name('documents.index');

        // Document type administration (admin-only in the workspace)
        Route::get('/documents/types', [DocumentTypeController::class, 'index'])
            ->middleware('permission:document,update')
            ->name('documents.types.index');
        Route::post('/documents/types', [DocumentTypeController::class, 'store'])
            ->middleware('permission:document,update')
            ->name('documents.types.store');
        Route::patch('/documents/types/{type}', [DocumentTypeController::class, 'update'])
            ->middleware('permission:document,update')
            ->name('documents.types.update');
        Route::delete('/documents/types/{type}', [DocumentTypeController::class, 'destroy'])
            ->middleware('permission:document,delete')
            ->name('documents.types.destroy');

        // Vehicle documents (nested under fleet routes)
        Route::get('/fleet/vehicles/{vehicle}/documents', [VehicleDocumentController::class, 'index'])
            ->middleware('permission:document,view')
            ->name('fleet.vehicles.documents.index');
        Route::get('/fleet/vehicles/{vehicle}/documents/create', [VehicleDocumentController::class, 'create'])
            ->middleware('permission:document,create')
            ->name('fleet.vehicles.documents.create');
        Route::post('/fleet/vehicles/{vehicle}/documents', [VehicleDocumentController::class, 'store'])
            ->middleware('permission:document,create')
            ->name('fleet.vehicles.documents.store');
        Route::get('/fleet/vehicles/{vehicle}/documents/{document}', [VehicleDocumentController::class, 'show'])
            ->middleware('permission:document,view')
            ->name('fleet.vehicles.documents.show');
        Route::patch('/fleet/vehicles/{vehicle}/documents/{document}', [VehicleDocumentController::class, 'update'])
            ->middleware('permission:document,update')
            ->name('fleet.vehicles.documents.update');
        Route::delete('/fleet/vehicles/{vehicle}/documents/{document}', [VehicleDocumentController::class, 'destroy'])
            ->middleware('permission:document,delete')
            ->name('fleet.vehicles.documents.destroy');
        Route::post('/fleet/vehicles/{vehicle}/documents/{document}/verify', [VehicleDocumentController::class, 'verify'])
            ->middleware('permission:document,verify')
            ->name('fleet.vehicles.documents.verify');

        // Driver documents (mirror of vehicle)
        Route::get('/fleet/drivers/{driver}/documents', [DriverDocumentController::class, 'index'])
            ->middleware('permission:document,view')
            ->name('fleet.drivers.documents.index');
        Route::get('/fleet/drivers/{driver}/documents/create', [DriverDocumentController::class, 'create'])
            ->middleware('permission:document,create')
            ->name('fleet.drivers.documents.create');
        Route::post('/fleet/drivers/{driver}/documents', [DriverDocumentController::class, 'store'])
            ->middleware('permission:document,create')
            ->name('fleet.drivers.documents.store');
        Route::get('/fleet/drivers/{driver}/documents/{document}', [DriverDocumentController::class, 'show'])
            ->middleware('permission:document,view')
            ->name('fleet.drivers.documents.show');
        Route::patch('/fleet/drivers/{driver}/documents/{document}', [DriverDocumentController::class, 'update'])
            ->middleware('permission:document,update')
            ->name('fleet.drivers.documents.update');
        Route::delete('/fleet/drivers/{driver}/documents/{document}', [DriverDocumentController::class, 'destroy'])
            ->middleware('permission:document,delete')
            ->name('fleet.drivers.documents.destroy');
        Route::post('/fleet/drivers/{driver}/documents/{document}/verify', [DriverDocumentController::class, 'verify'])
            ->middleware('permission:document,verify')
            ->name('fleet.drivers.documents.verify');
    }
}
