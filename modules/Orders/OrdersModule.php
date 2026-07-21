<?php

namespace Modules\Orders;

use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Orders\Http\Controllers\DeliveryOrderController;
use Modules\Orders\Http\Controllers\DriverPortalController;
use Modules\Orders\Http\Controllers\OrderItemController;
use Modules\Orders\Http\Controllers\PodController;
use Modules\Orders\Http\Controllers\SuratJalanController;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Observers\TripObserver;
use Modules\Orders\Observers\TripStopObserver;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;

class OrdersModule implements ModuleContract
{
    public function key(): string
    {
        return 'orders';
    }

    public function label(): string
    {
        return 'Orders';
    }

    public function description(): string
    {
        return 'Customer delivery orders with trip consolidation, delivery stops, and printable surat jalan.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Vertical;
    }

    public function permissions(): array
    {
        // 'deliver' is the driver capability: submitting a POD and completing a
        // dropoff. Kept distinct from 'update' so a driver never gains the
        // dispatch-mutation power that transportation,update carries.
        return ['view', 'create', 'update', 'delete', 'deliver'];
    }

    /**
     * A delivery order is fulfilled by a Transportation trip and its stops —
     * Orders cannot stand on its own without them. Transportation's own
     * requirements (fleet, customers, products) are installed transitively.
     */
    public function requires(): array
    {
        return ['transportation'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Orders',
            'slug' => 'orders',
            'icon' => 'orders',
            'route_name' => 'orders.index',
            'permission_module' => 'orders',
            'permission_action' => 'view',
            'sort_order' => 7,
        ];
    }

    public function migrationsPath(): string
    {
        return __DIR__.'/Database/Migrations';
    }

    public function viewsPath(): string
    {
        return __DIR__.'/resources/views';
    }

    /**
     * Attaches this module's relations and observers to Transportation's
     * models, so Transportation needs no knowledge of Orders. Registration
     * only — no queries run here (no tenant is initialized yet at boot); the
     * observers gate on Modules::available('orders') at call time, and callers
     * of the relations must do the same.
     */
    public function boot(): void
    {
        Trip::resolveRelationUsing('deliveryOrders', fn (Trip $trip) => $trip->hasMany(DeliveryOrder::class));
        TripStop::resolveRelationUsing('deliveryOrder', fn (TripStop $stop) => $stop->belongsTo(DeliveryOrder::class));

        Trip::observe(TripObserver::class);
        TripStop::observe(TripStopObserver::class);
    }

    public function routes(): void
    {
        Route::get('/orders', [DeliveryOrderController::class, 'index'])->middleware('permission:orders,view')->name('orders.index');
        Route::get('/orders/create', [DeliveryOrderController::class, 'create'])->middleware('permission:orders,create')->name('orders.create');
        Route::post('/orders', [DeliveryOrderController::class, 'store'])->middleware('permission:orders,create')->name('orders.store');
        Route::get('/orders/{order}', [DeliveryOrderController::class, 'show'])->middleware('permission:orders,view')->name('orders.show');
        Route::get('/orders/{order}/edit', [DeliveryOrderController::class, 'edit'])->middleware('permission:orders,update')->name('orders.edit');
        Route::patch('/orders/{order}', [DeliveryOrderController::class, 'update'])->middleware('permission:orders,update')->name('orders.update');
        Route::delete('/orders/{order}', [DeliveryOrderController::class, 'destroy'])->middleware('permission:orders,delete')->name('orders.destroy');
        Route::post('/orders/{order}/confirm', [DeliveryOrderController::class, 'confirm'])->middleware('permission:orders,update')->name('orders.confirm');
        Route::post('/orders/{order}/cancel', [DeliveryOrderController::class, 'cancel'])->middleware('permission:orders,update')->name('orders.cancel');
        Route::post('/orders/{order}/assign-trip', [DeliveryOrderController::class, 'assignTrip'])->middleware('permission:orders,update')->name('orders.assign-trip');
        Route::post('/orders/{order}/unassign-trip', [DeliveryOrderController::class, 'unassignTrip'])->middleware('permission:orders,update')->name('orders.unassign-trip');

        Route::post('/orders/{order}/items', [OrderItemController::class, 'store'])->middleware('permission:orders,create')->name('orders.items.store');
        Route::delete('/orders/{order}/items/{item}', [OrderItemController::class, 'destroy'])->middleware('permission:orders,delete')->name('orders.items.destroy');

        Route::get('/orders/{order}/surat-jalan', [SuratJalanController::class, 'show'])->middleware('permission:orders,view')->name('orders.surat-jalan');

        Route::middleware('permission:orders,deliver')->group(function (): void {
            Route::get('/driver/today', [DriverPortalController::class, 'today'])->name('driver.today');
            Route::get('/driver/trips/{trip}', [DriverPortalController::class, 'trip'])->name('driver.trip');
            Route::post('/driver/trips/{trip}/start', [DriverPortalController::class, 'startTrip'])->name('driver.trips.start');
            Route::post('/driver/trips/{trip}/stops/{stop}/arrive', [DriverPortalController::class, 'arriveStop'])->name('driver.stops.arrive');
            Route::get('/driver/orders/{order}/pod', [PodController::class, 'create'])->name('driver.pod.create');
            Route::post('/driver/orders/{order}/pod', [PodController::class, 'store'])->name('driver.pod.store');
        });
    }
}
