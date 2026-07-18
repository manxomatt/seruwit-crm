<?php

namespace Modules\Billing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Billing\Http\Requests\AttachInvoiceChargeRequest;
use Modules\Billing\Http\Requests\StoreInvoiceRequest;
use Modules\Billing\Http\Requests\UpdateInvoiceRequest;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\OrderCharge;
use Modules\Billing\Models\Tariff;
use Modules\Customer\Models\Customer;
use Modules\Orders\Models\DeliveryOrder;

class InvoiceController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the invoices, with the outstanding/paid summary
     * cards that serve as this phase's lightweight reporting.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $invoices = Invoice::query()
            ->with('customer:id,code,name')
            ->when(request('search'), fn ($query, $search) => $query->where('code', 'like', "%{$search}%"))
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest('issue_date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Billing/Invoices/Index', [
            'invoices' => $invoices,
            'summary' => [
                'outstanding' => (float) Invoice::query()->where('status', Invoice::STATUS_ISSUED)->sum('total'),
                'paid_this_month' => (float) Invoice::query()
                    ->where('status', Invoice::STATUS_PAID)
                    ->whereBetween('paid_at', [now()->startOfMonth(), now()->endOfMonth()])
                    ->sum('total'),
                'draft_count' => Invoice::query()->where('status', Invoice::STATUS_DRAFT)->count(),
            ],
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('billing', 'create'),
                'update' => $user->hasPermissionFor('billing', 'update'),
                'delete' => $user->hasPermissionFor('billing', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new invoice. When a customer is chosen the
     * page reloads with that customer's invoiceable orders.
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
     * Store a newly created draft invoice bundling the selected orders.
     */
    public function store(StoreInvoiceRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $orders = DeliveryOrder::query()
            ->with('charge')
            ->whereIn('id', $validated['order_ids'])
            ->get();

        foreach ($orders as $order) {
            if ($order->customer_id !== (int) $validated['customer_id']) {
                return back()->with('error', "Order {$order->code} belongs to another customer.");
            }

            if ($order->status !== DeliveryOrder::STATUS_DELIVERED) {
                return back()->with('error', "Order {$order->code} has not been delivered yet.");
            }

            if ($order->charge && $order->charge->invoice_id !== null) {
                return back()->with('error', "Order {$order->code} is already invoiced.");
            }
        }

        $invoice = DB::transaction(function () use ($validated, $orders) {
            $invoice = Invoice::create([
                'code' => Invoice::nextCode(),
                'customer_id' => $validated['customer_id'],
                'status' => Invoice::STATUS_DRAFT,
                'issue_date' => $validated['issue_date'] ?? now()->toDateString(),
                'due_date' => $validated['due_date'] ?? null,
                'tax_enabled' => Setting::getValue('ecommerce.tax_enabled', '1') === '1',
                'tax_rate' => (float) Setting::getValue('ecommerce.tax_rate', '11'),
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($orders as $order) {
                $tariff = Tariff::findFor($order->customer_id, $order->pickup_address, $order->delivery_address);

                $charge = OrderCharge::firstOrCreate(
                    ['delivery_order_id' => $order->id],
                    ['tariff_id' => $tariff?->id, 'amount' => $tariff?->price ?? 0],
                );

                $charge->update(['invoice_id' => $invoice->id]);
            }

            $invoice->recalculate();

            return $invoice;
        });

        return redirect()->route($this->getRoutePrefix().'.billing.invoices.show', $invoice)
            ->with('success', 'Draft invoice created.');
    }

    /**
     * Display the specified invoice.
     */
    public function show(Invoice $invoice): Response
    {
        $user = Auth::user();

        $invoice->load([
            'customer:id,code,name',
            'charges.deliveryOrder:id,code,pickup_address,delivery_address,delivered_at',
        ]);

        return Inertia::render('Modules/Billing/Invoices/Show', [
            'invoice' => $invoice,
            'attachableOrders' => $invoice->status === Invoice::STATUS_DRAFT
                ? $this->invoiceableOrdersFor($invoice->customer_id)
                : [],
            'can' => [
                'create' => $user->hasPermissionFor('billing', 'create'),
                'update' => $user->hasPermissionFor('billing', 'update'),
                'delete' => $user->hasPermissionFor('billing', 'delete'),
            ],
        ]);
    }

    /**
     * Update the specified draft invoice's metadata.
     */
    public function update(UpdateInvoiceRequest $request, Invoice $invoice): RedirectResponse
    {
        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return back()->with('error', 'Only a draft invoice can be edited.');
        }

        $invoice->update($request->validated());
        $invoice->recalculate();

        return back()->with('success', 'Invoice updated.');
    }

    /**
     * Remove the specified draft invoice. Its charges are released for
     * re-invoicing.
     */
    public function destroy(Invoice $invoice): RedirectResponse
    {
        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return back()->with('error', 'Only a draft invoice can be deleted.');
        }

        DB::transaction(function () use ($invoice) {
            $invoice->charges()->update(['invoice_id' => null]);
            $invoice->delete();
        });

        return redirect()->route($this->getRoutePrefix().'.billing.invoices.index')
            ->with('success', 'Invoice deleted.');
    }

    /**
     * Attach another delivered, uninvoiced order of the same customer to the
     * draft invoice.
     */
    public function attachCharge(AttachInvoiceChargeRequest $request, Invoice $invoice): RedirectResponse
    {
        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return back()->with('error', 'Charges can only be changed on a draft invoice.');
        }

        $order = DeliveryOrder::query()->with('charge')->findOrFail($request->validated()['order_id']);

        if ($order->customer_id !== $invoice->customer_id) {
            return back()->with('error', 'This order belongs to another customer.');
        }

        if ($order->status !== DeliveryOrder::STATUS_DELIVERED) {
            return back()->with('error', 'Only a delivered order can be invoiced.');
        }

        if ($order->charge && $order->charge->invoice_id !== null) {
            return back()->with('error', 'This order is already invoiced.');
        }

        DB::transaction(function () use ($invoice, $order) {
            $tariff = Tariff::findFor($order->customer_id, $order->pickup_address, $order->delivery_address);

            $charge = OrderCharge::firstOrCreate(
                ['delivery_order_id' => $order->id],
                ['tariff_id' => $tariff?->id, 'amount' => $tariff?->price ?? 0],
            );

            $charge->update(['invoice_id' => $invoice->id]);
            $invoice->recalculate();
        });

        return back()->with('success', 'Order added to the invoice.');
    }

    /**
     * Detach a charge from the draft invoice.
     */
    public function detachCharge(Invoice $invoice, OrderCharge $charge): RedirectResponse
    {
        if ($charge->invoice_id !== $invoice->id) {
            abort(404);
        }

        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return back()->with('error', 'Charges can only be changed on a draft invoice.');
        }

        DB::transaction(function () use ($invoice, $charge) {
            $charge->update(['invoice_id' => null]);
            $invoice->recalculate();
        });

        return back()->with('success', 'Order removed from the invoice.');
    }

    /**
     * Issue the draft invoice, freezing its totals.
     */
    public function issue(Invoice $invoice): RedirectResponse
    {
        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return back()->with('error', 'Only a draft invoice can be issued.');
        }

        if (! $invoice->charges()->exists()) {
            return back()->with('error', 'Add at least one order before issuing.');
        }

        $invoice->update(['status' => Invoice::STATUS_ISSUED]);

        return back()->with('success', 'Invoice issued.');
    }

    /**
     * Mark the issued invoice as paid.
     */
    public function pay(Invoice $invoice): RedirectResponse
    {
        if ($invoice->status !== Invoice::STATUS_ISSUED) {
            return back()->with('error', 'Only an issued invoice can be marked as paid.');
        }

        $invoice->update([
            'status' => Invoice::STATUS_PAID,
            'paid_at' => now(),
        ]);

        return back()->with('success', 'Invoice marked as paid.');
    }

    /**
     * Void a draft or issued invoice, releasing its charges for re-invoicing.
     * The totals stay on the row for audit; the code is never reused.
     */
    public function void(Invoice $invoice): RedirectResponse
    {
        if (! in_array($invoice->status, [Invoice::STATUS_DRAFT, Invoice::STATUS_ISSUED], true)) {
            return back()->with('error', 'A paid invoice cannot be voided.');
        }

        DB::transaction(function () use ($invoice) {
            $invoice->charges()->update(['invoice_id' => null]);
            $invoice->update(['status' => Invoice::STATUS_VOID]);
        });

        return back()->with('success', 'Invoice voided.');
    }

    /**
     * The customer's delivered orders that are not yet on any invoice, with
     * their current charge amounts.
     *
     * @return \Illuminate\Support\Collection<int, DeliveryOrder>
     */
    protected function invoiceableOrdersFor(int $customerId): \Illuminate\Support\Collection
    {
        return DeliveryOrder::query()
            ->with('charge:id,delivery_order_id,amount,invoice_id')
            ->where('customer_id', $customerId)
            ->where('status', DeliveryOrder::STATUS_DELIVERED)
            ->whereDoesntHave('charge', fn ($query) => $query->whereNotNull('invoice_id'))
            ->orderBy('delivered_at')
            ->get(['id', 'code', 'pickup_address', 'delivery_address', 'delivered_at']);
    }
}
