<?php

namespace Modules\Billing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Billing\Http\Requests\AttachOrdersRequest;
use Modules\Billing\Http\Requests\StoreOrderInvoiceRequest;
use Modules\Billing\Models\OrderCharge;
use Modules\Billing\Models\Tariff;
use Modules\Customer\Models\Customer;
use Modules\Invoicing\Models\Invoice;
use Modules\Orders\Models\DeliveryOrder;

/**
 * Turns delivered orders into invoice lines.
 *
 * This is the logistics half of billing, and the reason it lives here rather
 * than in Invoicing: everything below — delivered status, tariffs, pickup and
 * delivery addresses — is vocabulary that only this business line has. Invoicing
 * is handed a description and an amount and stays ignorant of all of it, which
 * is what leaves it free to serve travel or field sales next.
 */
class OrderInvoiceController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Show the form for invoicing a customer's delivered orders. Choosing a
     * customer reloads the page with that customer's invoiceable orders.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Billing/Invoices/Create', [
            'customers' => Customer::query()->orderBy('name')->get(['id', 'code', 'name']),
            'selectedCustomerId' => request('customer_id'),
            'invoiceableOrders' => request('customer_id')
                ? $this->invoiceableOrdersFor((int) request('customer_id'))
                : [],
        ]);
    }

    /**
     * Raise a draft invoice for the selected delivered orders.
     */
    public function store(StoreOrderInvoiceRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $customerId = (int) $validated['customer_id'];

        $orders = DeliveryOrder::query()
            ->with('charge.invoiceLine')
            ->whereIn('id', $validated['order_ids'])
            ->get();

        if ($rejection = $this->rejectionFor($orders, $customerId)) {
            return back()->with('error', $rejection);
        }

        $invoice = DB::transaction(function () use ($customerId, $orders): Invoice {
            $invoice = Invoice::create([
                'code' => Invoice::nextCode(),
                'customer_id' => $customerId,
                'status' => Invoice::STATUS_DRAFT,
                'issue_date' => now()->toDateString(),
                'tax_enabled' => Setting::getValue('ecommerce.tax_enabled', '1') === '1',
                'tax_rate' => (float) Setting::getValue('ecommerce.tax_rate', '11'),
            ]);

            $this->addLinesFor($invoice, $orders);

            return $invoice;
        });

        return redirect()->route($this->getRoutePrefix().'.invoicing.invoices.show', $invoice)
            ->with('success', 'Draft invoice created.');
    }

    /**
     * Add more of the same customer's delivered orders to a draft invoice.
     */
    public function attach(AttachOrdersRequest $request, Invoice $invoice): RedirectResponse
    {
        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return back()->with('error', 'Orders can only be added to a draft invoice.');
        }

        $orders = DeliveryOrder::query()
            ->with('charge.invoiceLine')
            ->whereIn('id', $request->validated()['order_ids'])
            ->get();

        if ($rejection = $this->rejectionFor($orders, $invoice->customer_id)) {
            return back()->with('error', $rejection);
        }

        DB::transaction(fn () => $this->addLinesFor($invoice, $orders));

        return back()->with('success', 'Orders added to the invoice.');
    }

    /**
     * Why these orders cannot be invoiced for this customer, or null if they can.
     *
     * @param  Collection<int, DeliveryOrder>  $orders
     */
    private function rejectionFor(Collection $orders, int $customerId): ?string
    {
        foreach ($orders as $order) {
            if ($order->customer_id !== $customerId) {
                return "Order {$order->code} belongs to another customer.";
            }

            if ($order->status !== DeliveryOrder::STATUS_DELIVERED) {
                return "Order {$order->code} has not been delivered yet.";
            }

            if ($order->charge?->invoiceLine !== null) {
                return "Order {$order->code} is already invoiced.";
            }
        }

        return null;
    }

    /**
     * Price each order and write it onto the invoice as a line.
     *
     * The charge row is created here when missing: an order confirmed before
     * Billing was installed never got one, and it should still be invoiceable.
     *
     * @param  Collection<int, DeliveryOrder>  $orders
     */
    private function addLinesFor(Invoice $invoice, Collection $orders): void
    {
        foreach ($orders as $order) {
            $tariff = Tariff::findFor($order->customer_id, $order->pickup_address, $order->delivery_address);

            $charge = OrderCharge::firstOrCreate(
                ['delivery_order_id' => $order->id],
                ['tariff_id' => $tariff?->id, 'amount' => $tariff?->price ?? 0],
            );

            $invoice->lines()->create([
                'description' => "{$order->code} · {$order->pickup_address} → {$order->delivery_address}",
                'amount' => $charge->amount,
                'source_type' => $charge->getMorphClass(),
                'source_id' => $charge->getKey(),
            ]);
        }

        $invoice->recalculate();
    }

    /**
     * The customer's delivered orders that are not yet on any invoice.
     *
     * "Not yet invoiced" is the absence of an invoice line pointing at the
     * charge — Invoicing owns that fact, and this module never keeps a second
     * copy of it.
     *
     * @return \Illuminate\Support\Collection<int, DeliveryOrder>
     */
    private function invoiceableOrdersFor(int $customerId): \Illuminate\Support\Collection
    {
        return DeliveryOrder::query()
            ->with('charge:id,delivery_order_id,amount')
            ->where('customer_id', $customerId)
            ->where('status', DeliveryOrder::STATUS_DELIVERED)
            ->whereDoesntHave('charge.invoiceLine')
            ->orderBy('delivered_at')
            ->get(['id', 'code', 'pickup_address', 'delivery_address', 'delivered_at']);
    }
}
