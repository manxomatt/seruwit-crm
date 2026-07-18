<?php

namespace Modules\Billing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Billing\Http\Requests\UpdateOrderChargeRequest;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\OrderCharge;
use Modules\Billing\Models\Tariff;
use Modules\Orders\Models\DeliveryOrder;

class OrderChargeController extends Controller
{
    /**
     * The order statuses that can carry a price.
     *
     * @var list<string>
     */
    private const BILLABLE_STATUSES = [
        DeliveryOrder::STATUS_CONFIRMED,
        DeliveryOrder::STATUS_ASSIGNED,
        DeliveryOrder::STATUS_IN_TRANSIT,
        DeliveryOrder::STATUS_DELIVERED,
    ];

    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * List billable orders with their charges. Orders confirmed before Billing
     * was installed have no charge row yet — they render as unpriced and the
     * row is created lazily on the first update.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $orders = DeliveryOrder::query()
            ->with(['customer:id,code,name', 'charge.tariff:id,origin,destination', 'charge.invoice:id,code,status'])
            ->whereIn('status', self::BILLABLE_STATUSES)
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('pickup_address', 'like', "%{$search}%")
                        ->orWhere('delivery_address', 'like', "%{$search}%");
                });
            })
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->when(
                request()->boolean('uninvoiced'),
                fn ($query) => $query->whereDoesntHave('charge', fn ($q) => $q->whereNotNull('invoice_id')),
            )
            ->latest('order_date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Billing/Charges/Index', [
            'orders' => $orders,
            'tariffs' => Tariff::query()->active()->orderBy('origin')->get(['id', 'customer_id', 'origin', 'destination', 'price']),
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
                'uninvoiced' => request()->boolean('uninvoiced'),
            ],
            'can' => [
                'update' => $user->hasPermissionFor('billing', 'update'),
            ],
        ]);
    }

    /**
     * Set or override an order's price, optionally by applying a tariff.
     */
    public function update(UpdateOrderChargeRequest $request, DeliveryOrder $order): RedirectResponse
    {
        if (! in_array($order->status, self::BILLABLE_STATUSES, true)) {
            return back()->with('error', 'Only a confirmed order can be priced.');
        }

        $existing = OrderCharge::query()->firstWhere('delivery_order_id', $order->id);

        if ($existing && $existing->isLocked()) {
            return back()->with('error', 'This charge is on an issued invoice and can no longer be changed.');
        }

        $validated = $request->validated();
        $tariff = isset($validated['tariff_id']) ? Tariff::find($validated['tariff_id']) : null;

        $charge = OrderCharge::updateOrCreate(
            ['delivery_order_id' => $order->id],
            [
                'tariff_id' => $tariff?->id,
                'amount' => $tariff?->price ?? $validated['amount'] ?? 0,
            ],
        );

        if ($charge->invoice && $charge->invoice->status === Invoice::STATUS_DRAFT) {
            $charge->invoice->recalculate();
        }

        return back()->with('success', 'Charge updated.');
    }
}
