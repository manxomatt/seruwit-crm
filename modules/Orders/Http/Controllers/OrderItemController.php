<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\Orders\Http\Requests\StoreOrderItemRequest;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;

class OrderItemController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Store a newly created item for the given delivery order.
     */
    public function store(StoreOrderItemRequest $request, DeliveryOrder $order): RedirectResponse
    {
        if ($order->status !== DeliveryOrder::STATUS_DRAFT) {
            return back()->with('error', 'Items can only be changed while the order is a draft.');
        }

        $order->items()->create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.orders.show', $order)
            ->with('success', 'Item added.');
    }

    /**
     * Remove the specified item.
     */
    public function destroy(DeliveryOrder $order, DeliveryOrderItem $item): RedirectResponse
    {
        if ($item->delivery_order_id !== $order->id) {
            abort(404);
        }

        if ($order->status !== DeliveryOrder::STATUS_DRAFT) {
            return back()->with('error', 'Items can only be changed while the order is a draft.');
        }

        $item->delete();

        return redirect()->route($this->getRoutePrefix().'.orders.show', $order)
            ->with('success', 'Item removed.');
    }
}
