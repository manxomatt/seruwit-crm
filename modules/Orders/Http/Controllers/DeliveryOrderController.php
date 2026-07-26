<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Orders\Http\Requests\AssignTripRequest;
use Modules\Orders\Http\Requests\BatchAssignTripRequest;
use Modules\Orders\Http\Requests\StoreDeliveryOrderRequest;
use Modules\Orders\Http\Requests\UpdateDeliveryOrderRequest;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Support\DeliveryOrderStock;
use Modules\Orders\Support\DeliveryOrderTripAssignment;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\TransportationManagement\Models\Trip;

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

        $queue = request('queue');

        $orders = DeliveryOrder::query()
            ->with(['partner', 'trip', 'goodsIssueNote:id,gin_number'])
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('pickup_address', 'like', "%{$search}%")
                        ->orWhere('delivery_address', 'like', "%{$search}%");
                });
            })
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->when($queue === 'ready_from_gin', function ($query) {
                $query->where('status', DeliveryOrder::STATUS_CONFIRMED)
                    ->whereNotNull('goods_issue_note_id')
                    ->whereNull('trip_id');
            })
            ->latest('order_date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Orders/Index', [
            'orders' => $orders,
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
                'queue' => $queue,
            ],
            'can' => [
                'create' => $user->hasPermissionFor('orders', 'create'),
                'update' => $user->hasPermissionFor('orders', 'update'),
                'delete' => $user->hasPermissionFor('orders', 'delete'),
            ],
            'assignableTrips' => $user->hasPermissionFor('orders', 'update')
                ? Trip::query()
                    ->where('status', Trip::STATUS_SCHEDULED)
                    ->with(['vehicle:id,name,plate_number', 'driver:id,name'])
                    ->orderBy('scheduled_at')
                    ->get(['id', 'code', 'vehicle_id', 'driver_id', 'origin', 'destination', 'scheduled_at'])
                : [],
        ]);
    }

    /**
     * Show the form for creating a new delivery order.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Orders/Create', [
            'partners' => Partner::query()->orderBy('name')->get(['id', 'code', 'name']),
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
            ->with('success', __('orders.messages.created'));
    }

    /**
     * Display the specified delivery order.
     */
    public function show(DeliveryOrder $order): Response
    {
        $user = Auth::user();

        $order->load([
            'partner',
            'trip.vehicle',
            'trip.driver',
            'goodsIssueNote:id,gin_number,status',
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
                ->with('error', __('orders.messages.edit_draft_only'));
        }

        return Inertia::render('Modules/Orders/Edit', [
            'order' => $order,
            'partners' => Partner::query()->orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    /**
     * Update the specified delivery order in storage.
     */
    public function update(UpdateDeliveryOrderRequest $request, DeliveryOrder $order): RedirectResponse
    {
        if ($order->status !== DeliveryOrder::STATUS_DRAFT) {
            return back()->with('error', __('orders.messages.edit_draft_only'));
        }

        $order->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.orders.show', $order)
            ->with('success', __('orders.messages.updated'));
    }

    /**
     * Remove the specified delivery order from storage.
     */
    public function destroy(DeliveryOrder $order): RedirectResponse
    {
        if ($order->status !== DeliveryOrder::STATUS_DRAFT) {
            return back()->with('error', __('orders.messages.delete_draft_only'));
        }

        $order->delete();

        return redirect()->route($this->getRoutePrefix().'.orders.index')
            ->with('success', __('orders.messages.deleted'));
    }

    /**
     * Confirm a draft order, making it ready for trip assignment.
     */
    public function confirm(DeliveryOrder $order): RedirectResponse
    {
        if ($order->status !== DeliveryOrder::STATUS_DRAFT) {
            return back()->with('error', __('orders.messages.confirm_draft_only'));
        }

        if (! $order->items()->exists()) {
            return back()->with('error', __('orders.messages.need_items'));
        }

        if (class_exists(\Modules\Approvals\Support\ApprovalGate::class)) {
            $messages = [];

            $discount = (float) ($order->discount_percent ?? 0);
            if ($discount > 0) {
                $gate = \Modules\Approvals\Support\ApprovalGate::authorize(
                    \Modules\Approvals\Support\ApprovalTriggers::ORDER_DISCOUNT,
                    $order,
                    [
                        'discount_percent' => $discount,
                        'resume' => 'orders.delivery_order.confirm',
                    ],
                );

                if (! $gate['allowed']) {
                    $messages[] = $gate['message'] ?? __('orders.messages.discount_approval');
                }
            }

            if ($order->promised_at) {
                $leadHours = $order->promised_at->greaterThan(now())
                    ? (float) now()->diffInHours($order->promised_at)
                    : 0.0;

                $gate = \Modules\Approvals\Support\ApprovalGate::authorize(
                    \Modules\Approvals\Support\ApprovalTriggers::ORDER_SLA,
                    $order,
                    [
                        'lead_hours' => $leadHours,
                        'promised_at' => $order->promised_at->toDateTimeString(),
                        'resume' => 'orders.delivery_order.confirm',
                    ],
                );

                if (! $gate['allowed']) {
                    $messages[] = $gate['message'] ?? __('orders.messages.sla_approval');
                }
            }

            if ($messages !== []) {
                return back()->with('error', implode(' ', $messages));
            }
        }

        DB::transaction(function () use ($order): void {
            DeliveryOrderStock::reserve($order);

            $order->update([
                'status' => DeliveryOrder::STATUS_CONFIRMED,
                'confirmed_at' => now(),
            ]);
        });

        return back()->with('success', __('orders.messages.confirmed'));
    }

    /**
     * Cancel an order that has not been assigned to a trip yet.
     */
    public function cancel(Request $request, DeliveryOrder $order): RedirectResponse
    {
        if (! in_array($order->status, [DeliveryOrder::STATUS_DRAFT, DeliveryOrder::STATUS_CONFIRMED], true)) {
            return back()->with('error', __('orders.messages.cannot_cancel'));
        }

        $request->validate([
            'cancelled_reason' => ['required', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($order, $request): void {
            if ($order->status === DeliveryOrder::STATUS_CONFIRMED) {
                DeliveryOrderStock::release($order);
            }

            $order->update([
                'status' => DeliveryOrder::STATUS_CANCELLED,
                'cancelled_reason' => $request->input('cancelled_reason'),
            ]);
        });

        return back()->with('success', __('orders.messages.cancelled'));
    }

    /**
     * Consolidate a confirmed order onto a scheduled trip, creating its
     * dropoff stop on the trip's route.
     */
    public function assignTrip(AssignTripRequest $request, DeliveryOrder $order): RedirectResponse
    {
        if ($order->status !== DeliveryOrder::STATUS_CONFIRMED) {
            return back()->with('error', __('orders.messages.assign_confirmed_only'));
        }

        $trip = Trip::findOrFail($request->validated()['trip_id']);

        DB::transaction(function () use ($order, $trip) {
            app(DeliveryOrderTripAssignment::class)->assign($order, $trip);
        });

        return back()->with('success', __('orders.messages.assigned', ['code' => $trip->code]));
    }

    /**
     * Consolidate multiple confirmed orders onto one scheduled trip.
     */
    public function batchAssignTrip(BatchAssignTripRequest $request): RedirectResponse
    {
        $trip = Trip::query()->findOrFail($request->validated()['trip_id']);
        $ids = collect($request->validated()['delivery_order_ids'])->unique()->values();

        DB::transaction(function () use ($ids, $trip): void {
            $orders = DeliveryOrder::query()
                ->whereIn('id', $ids)
                ->lockForUpdate()
                ->get();

            $assignment = app(DeliveryOrderTripAssignment::class);

            foreach ($orders as $order) {
                $assignment->assign($order, $trip);
            }
        });

        return back()->with('success', __('orders.messages.batch_assigned', [
            'count' => $ids->count(),
            'code' => $trip->code,
        ]));
    }

    /**
     * Detach an assigned order from its trip while the trip has not left yet,
     * releasing the order for re-planning.
     */
    public function unassignTrip(DeliveryOrder $order): RedirectResponse
    {
        if ($order->status !== DeliveryOrder::STATUS_ASSIGNED) {
            return back()->with('error', __('orders.messages.unassign_assigned_only'));
        }

        if ($order->trip && $order->trip->status !== Trip::STATUS_SCHEDULED) {
            return back()->with('error', __('orders.messages.unassign_trip_started'));
        }

        DB::transaction(function () use ($order) {
            app(DeliveryOrderTripAssignment::class)->unassign($order);
        });

        return back()->with('success', __('orders.messages.unassigned'));
    }
}
