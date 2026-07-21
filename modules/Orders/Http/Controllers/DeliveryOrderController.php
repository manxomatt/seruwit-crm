<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Customer\Models\Customer;
use Modules\Orders\Http\Requests\AssignTripRequest;
use Modules\Orders\Http\Requests\StoreDeliveryOrderRequest;
use Modules\Orders\Http\Requests\UpdateDeliveryOrderRequest;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Product\Models\Product;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;

class DeliveryOrderController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the delivery orders.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $orders = DeliveryOrder::query()
            ->with(['customer', 'trip'])
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('pickup_address', 'like', "%{$search}%")
                        ->orWhere('delivery_address', 'like', "%{$search}%");
                });
            })
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest('order_date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Orders/Index', [
            'orders' => $orders,
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('orders', 'create'),
                'update' => $user->hasPermissionFor('orders', 'update'),
                'delete' => $user->hasPermissionFor('orders', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new delivery order.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Orders/Create', [
            'customers' => Customer::query()->orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    /**
     * Store a newly created delivery order in storage.
     */
    public function store(StoreDeliveryOrderRequest $request): RedirectResponse
    {
        $order = DeliveryOrder::create([
            ...$request->validated(),
            'code' => DeliveryOrder::nextCode(),
        ]);

        return redirect()->route($this->getRoutePrefix().'.orders.show', $order)
            ->with('success', 'Delivery order created. Add its items below.');
    }

    /**
     * Display the specified delivery order.
     */
    public function show(DeliveryOrder $order): Response
    {
        $user = Auth::user();

        $order->load([
            'customer',
            'trip.vehicle',
            'trip.driver',
            'items.product',
            'pod.photos',
            'pod.items.deliveryOrderItem.product',
            'pod.submitter:id,name',
        ]);

        return Inertia::render('Modules/Orders/Show', [
            'order' => $order,
            'products' => Product::query()->where('status', 'active')->orderBy('name')->get(['id', 'code', 'name', 'unit']),
            'assignableTrips' => $order->status === DeliveryOrder::STATUS_CONFIRMED
                ? Trip::query()
                    ->where('status', Trip::STATUS_SCHEDULED)
                    ->with(['vehicle:id,name,plate_number', 'driver:id,name'])
                    ->orderBy('scheduled_at')
                    ->get(['id', 'code', 'vehicle_id', 'driver_id', 'origin', 'destination', 'scheduled_at'])
                : [],
            'can' => [
                'create' => $user->hasPermissionFor('orders', 'create'),
                'update' => $user->hasPermissionFor('orders', 'update'),
                'delete' => $user->hasPermissionFor('orders', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified delivery order.
     */
    public function edit(DeliveryOrder $order): Response|RedirectResponse
    {
        if ($order->status !== DeliveryOrder::STATUS_DRAFT) {
            return redirect()->route($this->getRoutePrefix().'.orders.show', $order)
                ->with('error', 'Only a draft order can be edited.');
        }

        return Inertia::render('Modules/Orders/Edit', [
            'order' => $order,
            'customers' => Customer::query()->orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    /**
     * Update the specified delivery order in storage.
     */
    public function update(UpdateDeliveryOrderRequest $request, DeliveryOrder $order): RedirectResponse
    {
        if ($order->status !== DeliveryOrder::STATUS_DRAFT) {
            return back()->with('error', 'Only a draft order can be edited.');
        }

        $order->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.orders.show', $order)
            ->with('success', 'Delivery order updated.');
    }

    /**
     * Remove the specified delivery order from storage.
     */
    public function destroy(DeliveryOrder $order): RedirectResponse
    {
        if ($order->status !== DeliveryOrder::STATUS_DRAFT) {
            return back()->with('error', 'Only a draft order can be deleted.');
        }

        $order->delete();

        return redirect()->route($this->getRoutePrefix().'.orders.index')
            ->with('success', 'Delivery order deleted.');
    }

    /**
     * Confirm a draft order, making it ready for trip assignment.
     */
    public function confirm(DeliveryOrder $order): RedirectResponse
    {
        if ($order->status !== DeliveryOrder::STATUS_DRAFT) {
            return back()->with('error', 'Only a draft order can be confirmed.');
        }

        if (! $order->items()->exists()) {
            return back()->with('error', 'Add at least one item before confirming.');
        }

        $order->update([
            'status' => DeliveryOrder::STATUS_CONFIRMED,
            'confirmed_at' => now(),
        ]);

        return back()->with('success', 'Delivery order confirmed.');
    }

    /**
     * Cancel an order that has not been assigned to a trip yet.
     */
    public function cancel(Request $request, DeliveryOrder $order): RedirectResponse
    {
        if (! in_array($order->status, [DeliveryOrder::STATUS_DRAFT, DeliveryOrder::STATUS_CONFIRMED], true)) {
            return back()->with('error', 'This order can no longer be cancelled.');
        }

        $request->validate([
            'cancelled_reason' => ['required', 'string', 'max:255'],
        ]);

        $order->update([
            'status' => DeliveryOrder::STATUS_CANCELLED,
            'cancelled_reason' => $request->input('cancelled_reason'),
        ]);

        return back()->with('success', 'Delivery order cancelled.');
    }

    /**
     * Consolidate a confirmed order onto a scheduled trip, creating its
     * dropoff stop on the trip's route.
     */
    public function assignTrip(AssignTripRequest $request, DeliveryOrder $order): RedirectResponse
    {
        if ($order->status !== DeliveryOrder::STATUS_CONFIRMED) {
            return back()->with('error', 'Only a confirmed order can be assigned to a trip.');
        }

        $trip = Trip::findOrFail($request->validated()['trip_id']);

        DB::transaction(function () use ($order, $trip) {
            $order->update([
                'trip_id' => $trip->id,
                'status' => DeliveryOrder::STATUS_ASSIGNED,
            ]);

            $trip->stops()->create([
                'sequence' => ((int) $trip->stops()->max('sequence')) + 1,
                'type' => TripStop::TYPE_DROPOFF,
                'address' => $order->delivery_address,
                'delivery_order_id' => $order->id,
                'status' => TripStop::STATUS_PENDING,
            ]);
        });

        return back()->with('success', "Order assigned to trip {$trip->code}.");
    }

    /**
     * Detach an assigned order from its trip while the trip has not left yet,
     * releasing the order for re-planning.
     */
    public function unassignTrip(DeliveryOrder $order): RedirectResponse
    {
        if ($order->status !== DeliveryOrder::STATUS_ASSIGNED) {
            return back()->with('error', 'Only an assigned order can be detached from its trip.');
        }

        if ($order->trip && $order->trip->status !== Trip::STATUS_SCHEDULED) {
            return back()->with('error', 'Cannot detach from a trip that has already started.');
        }

        DB::transaction(function () use ($order) {
            TripStop::query()
                ->where('delivery_order_id', $order->id)
                ->where('status', TripStop::STATUS_PENDING)
                ->delete();

            $order->update([
                'trip_id' => null,
                'status' => DeliveryOrder::STATUS_CONFIRMED,
            ]);
        });

        return back()->with('success', 'Order detached from its trip.');
    }
}
