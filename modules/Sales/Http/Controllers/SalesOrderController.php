<?php

namespace Modules\Sales\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Response;
use Modules\Inventory\Support\StockReservationService;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Sales\Http\Requests\StoreSalesOrderRequest;
use Modules\Sales\Http\Requests\UpdateSalesOrderRequest;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Support\PriceListResolver;
use Modules\Sales\Support\SalesInvoiceService;
use Modules\Sales\Support\SalesOrderConfirmationService;
use Modules\Sales\Support\SalesOrderPromotionApplier;
use RuntimeException;

class SalesOrderController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        $query = SalesOrder::query()
            ->with(['partner:id,name,code', 'warehouse:id,name', 'createdBy:id,name'])
            ->withSum('items as quantity_ordered_sum', 'quantity_ordered')
            ->withSum('items as quantity_delivered_sum', 'quantity_delivered')
            ->latest('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search): void {
                $q->where('so_number', 'like', "%{$search}%")
                    ->orWhereHas('partner', fn ($partner) => $partner->where('name', 'like', "%{$search}%"));
            });
        }

        $orders = $query->paginate(10)->withQueryString();

        $orders->getCollection()->transform(function (SalesOrder $so): SalesOrder {
            $ordered = (float) ($so->quantity_ordered_sum ?? 0);
            $delivered = (float) ($so->quantity_delivered_sum ?? 0);
            $so->setAttribute('progress_percent', $ordered > 0 ? min(100, round(($delivered / $ordered) * 100)) : 0);
            $so->setAttribute('progress_ordered', $ordered);
            $so->setAttribute('progress_delivered', $delivered);

            return $so;
        });

        return inertia('Modules/Sales/SalesOrders/Index', [
            'orders' => $orders,
            'filters' => [
                'status' => $request->string('status')->toString(),
                'search' => $request->string('search')->toString(),
            ],
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function create(): Response
    {
        $customerQuery = Partner::query()
            ->where('customer_rank', '>', 0)
            ->orderBy('name');

        if (PriceListResolver::tablesReady()) {
            $customerQuery->select('id', 'name', 'code', 'price_list_id');
        } else {
            $customerQuery->select('id', 'name', 'code');
        }

        return inertia('Modules/Sales/SalesOrders/Create', [
            'customers' => $customerQuery->get(),
            'warehouses' => \Modules\Inventory\Support\AccessibleWarehouses::query()
                ->where('status', 'active')
                ->salesOutbound()
                ->select('id', 'name', 'kind')
                ->orderBy('name')
                ->get(),
            'products' => Product::query()
                ->where('status', 'active')
                ->with(['packagings' => fn ($q) => $q->select('id', 'product_id', 'name', 'qty')->orderBy('sort')])
                ->select('id', 'name', 'code', 'unit', 'stock_unit', 'price', 'cost')
                ->orderBy('name')
                ->get(),
            'priceMaps' => PriceListResolver::activePriceMaps(),
        ]);
    }

    public function store(StoreSalesOrderRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $so = DB::transaction(function () use ($validated) {
            $priced = app(SalesOrderPromotionApplier::class)->apply(
                (int) $validated['warehouse_id'],
                isset($validated['partner_id']) ? (int) $validated['partner_id'] : null,
                $validated['items'],
            );

            $so = SalesOrder::create([
                'partner_id' => $validated['partner_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'created_by' => auth()->id(),
                'so_number' => SalesOrder::nextNumber(),
                'status' => SalesOrder::STATUS_DRAFT,
                'ordered_at' => $validated['ordered_at'],
                'promised_at' => $validated['promised_at'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'total_amount' => 0,
                'discount_total' => $priced['discount_total'],
            ]);

            foreach ($priced['items'] as $item) {
                $so->items()->create([
                    'product_id' => $item['product_id'],
                    'product_packaging_id' => $item['product_packaging_id'] ?? null,
                    'quantity_ordered' => $item['quantity_ordered'],
                    'quantity_delivered' => 0,
                    'unit_price' => $item['unit_price'],
                    'line_discount' => $item['line_discount'] ?? 0,
                    'unit' => $item['unit'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            $so->recalculateTotal();
            app(SalesOrderPromotionApplier::class)->record($so, $priced['items']);

            return $so;
        });

        return redirect()->route($this->getRoutePrefix().'.sales.sales-orders.show', $so)
            ->with('success', __('sales.messages.so_draft_saved'));
    }

    public function show(SalesOrder $so): Response
    {
        $so->load([
            'partner:id,name,code',
            'warehouse:id,name',
            'createdBy:id,name',
            'items.product:id,name,code,unit',
            'items.packaging:id,name,qty',
            'goodsIssueNotes' => fn ($q) => $q->latest('issued_at')->with(['issuedBy:id,name', 'items:id,goods_issue_note_id,quantity_issued']),
        ]);

        $progress = $so->deliveringProgress();
        $invoiceService = app(SalesInvoiceService::class);

        return inertia('Modules/Sales/SalesOrders/Show', [
            'order' => $so,
            'progress' => $progress,
            'can' => array_merge($this->abilitiesFor(), [
                'invoice' => $invoiceService->isAvailable()
                    && (auth()->user()?->hasPermissionFor('sales', 'create') ?? false)
                    && $invoiceService->hasBillableDelivery($so),
            ]),
        ]);
    }

    public function edit(SalesOrder $so): Response|RedirectResponse
    {
        if ($so->status !== SalesOrder::STATUS_DRAFT) {
            return redirect()->route($this->getRoutePrefix().'.sales.sales-orders.show', $so)
                ->with('error', __('sales.messages.so_edit_draft_only'));
        }

        $so->load(['items.product:id,name,code,unit', 'items.packaging:id,name,qty']);

        $customerQuery = Partner::query()
            ->where('customer_rank', '>', 0)
            ->orderBy('name');

        if (PriceListResolver::tablesReady()) {
            $customerQuery->select('id', 'name', 'code', 'price_list_id');
        } else {
            $customerQuery->select('id', 'name', 'code');
        }

        return inertia('Modules/Sales/SalesOrders/Edit', [
            'order' => $so,
            'customers' => $customerQuery->get(),
            'warehouses' => \Modules\Inventory\Support\AccessibleWarehouses::query()
                ->where('status', 'active')
                ->salesOutbound()
                ->select('id', 'name', 'kind')
                ->orderBy('name')
                ->get(),
            'products' => Product::query()
                ->where('status', 'active')
                ->with(['packagings' => fn ($q) => $q->select('id', 'product_id', 'name', 'qty')->orderBy('sort')])
                ->select('id', 'name', 'code', 'unit', 'stock_unit', 'price', 'cost')
                ->orderBy('name')
                ->get(),
            'priceMaps' => PriceListResolver::activePriceMaps(),
        ]);
    }

    public function update(UpdateSalesOrderRequest $request, SalesOrder $so): RedirectResponse
    {
        if ($so->status !== SalesOrder::STATUS_DRAFT) {
            return back()->with('error', __('sales.messages.so_update_draft_only'));
        }

        $validated = $request->validated();

        DB::transaction(function () use ($so, $validated): void {
            $priced = app(SalesOrderPromotionApplier::class)->apply(
                (int) $validated['warehouse_id'],
                isset($validated['partner_id']) ? (int) $validated['partner_id'] : null,
                $validated['items'],
            );

            $so->update([
                'partner_id' => $validated['partner_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'ordered_at' => $validated['ordered_at'],
                'promised_at' => $validated['promised_at'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'discount_total' => $priced['discount_total'],
            ]);

            $so->items()->delete();

            foreach ($priced['items'] as $item) {
                $so->items()->create([
                    'product_id' => $item['product_id'],
                    'product_packaging_id' => $item['product_packaging_id'] ?? null,
                    'quantity_ordered' => $item['quantity_ordered'],
                    'quantity_delivered' => 0,
                    'unit_price' => $item['unit_price'],
                    'line_discount' => $item['line_discount'] ?? 0,
                    'unit' => $item['unit'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            $so->recalculateTotal();
            app(SalesOrderPromotionApplier::class)->record($so, $priced['items']);
        });

        return redirect()->route($this->getRoutePrefix().'.sales.sales-orders.show', $so)
            ->with('success', __('sales.messages.so_updated'));
    }

    public function confirm(SalesOrder $so): RedirectResponse
    {
        try {
            app(SalesOrderConfirmationService::class)->confirm($so);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', __('sales.messages.so_confirmed'));
    }

    public function cancel(SalesOrder $so): RedirectResponse
    {
        if (! $so->canBeCancelled()) {
            return back()->with('error', __('sales.messages.so_cancel_not_allowed'));
        }

        DB::transaction(function () use ($so): void {
            if ($so->status === SalesOrder::STATUS_CONFIRMED) {
                StockReservationService::releaseSalesOrder($so);
            }

            $so->update(['status' => SalesOrder::STATUS_CANCELLED]);
        });

        return back()->with('success', __('sales.messages.so_cancelled'));
    }

    public function close(SalesOrder $so): RedirectResponse
    {
        if ($so->status !== SalesOrder::STATUS_FULLY_DELIVERED) {
            return back()->with('error', __('sales.messages.so_close_fully_delivered_only'));
        }

        $so->update(['status' => SalesOrder::STATUS_CLOSED]);

        return back()->with('success', __('sales.messages.so_closed'));
    }

    public function invoice(SalesOrder $so): RedirectResponse
    {
        try {
            $invoice = app(SalesInvoiceService::class)->createFromSalesOrder($so);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route($this->getRoutePrefix().'.invoicing.invoices.show', $invoice)
            ->with('success', __('sales.messages.invoice_created'));
    }

    public function destroy(SalesOrder $so): RedirectResponse
    {
        if ($so->status !== SalesOrder::STATUS_DRAFT) {
            return back()->with('error', __('sales.messages.so_delete_draft_only'));
        }

        $so->delete();

        return redirect()->route($this->getRoutePrefix().'.sales.sales-orders.index')
            ->with('success', __('sales.messages.so_deleted'));
    }

    /**
     * @return array{create: bool, update: bool, issue: bool}
     */
    private function abilitiesFor(): array
    {
        $user = auth()->user();

        return [
            'create' => $user?->hasPermissionFor('sales', 'create') ?? false,
            'update' => $user?->hasPermissionFor('sales', 'update') ?? false,
            'issue' => $user?->hasPermissionFor('sales', 'issue') ?? false,
        ];
    }
}
