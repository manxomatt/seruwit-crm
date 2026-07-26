<?php

namespace Modules\Purchasing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Response;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Purchasing\Http\Requests\StorePurchaseOrderRequest;
use Modules\Purchasing\Http\Requests\UpdatePurchaseOrderRequest;
use Modules\Purchasing\Models\PurchaseOrder;

class PurchaseOrderController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        $query = PurchaseOrder::query()
            ->with(['partner:id,name,code', 'warehouse:id,name', 'createdBy:id,name'])
            ->withSum('items as quantity_ordered_sum', 'quantity_ordered')
            ->withSum('items as quantity_received_sum', 'quantity_received')
            ->latest('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search): void {
                $q->where('po_number', 'like', "%{$search}%")
                    ->orWhereHas('partner', fn ($partner) => $partner->where('name', 'like', "%{$search}%"));
            });
        }

        $orders = $query->paginate(15)->withQueryString();

        $orders->getCollection()->transform(function (PurchaseOrder $po): PurchaseOrder {
            $ordered = (float) ($po->quantity_ordered_sum ?? 0);
            $received = (float) ($po->quantity_received_sum ?? 0);
            $po->setAttribute('progress_percent', $ordered > 0 ? min(100, round(($received / $ordered) * 100)) : 0);
            $po->setAttribute('progress_ordered', $ordered);
            $po->setAttribute('progress_received', $received);

            return $po;
        });

        return inertia('Modules/Purchasing/PurchaseOrders/Index', [
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
        return inertia('Modules/Purchasing/PurchaseOrders/Create', [
            'suppliers' => Partner::query()
                ->where('supplier_rank', '>', 0)
                ->select('id', 'name', 'code')
                ->orderBy('name')
                ->get(),
            'warehouses' => \Modules\Inventory\Support\AccessibleWarehouses::query()
                ->where('status', 'active')
                ->purchaseInbound()
                ->select('id', 'name', 'kind')
                ->orderBy('name')
                ->get(),
            'products' => Product::query()
                ->where('status', 'active')
                ->with(['packagings' => fn ($q) => $q->select('id', 'product_id', 'name', 'qty')->orderBy('sort')])
                ->select('id', 'name', 'code', 'unit', 'stock_unit', 'cost')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(StorePurchaseOrderRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $shouldSubmit = (bool) ($validated['submit'] ?? false);

        $po = DB::transaction(function () use ($validated, $shouldSubmit) {
            $po = PurchaseOrder::create([
                'partner_id' => $validated['partner_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'created_by' => auth()->id(),
                'po_number' => PurchaseOrder::nextNumber(),
                'status' => $shouldSubmit ? PurchaseOrder::STATUS_SUBMITTED : PurchaseOrder::STATUS_DRAFT,
                'ordered_at' => $validated['ordered_at'],
                'expected_at' => $validated['expected_at'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'total_amount' => 0,
            ]);

            foreach ($validated['items'] as $item) {
                $po->items()->create([
                    'product_id' => $item['product_id'],
                    'product_packaging_id' => $item['product_packaging_id'] ?? null,
                    'quantity_ordered' => $item['quantity_ordered'],
                    'quantity_received' => 0,
                    'unit_price' => $item['unit_price'],
                    'unit' => $item['unit'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            $po->recalculateTotal();

            return $po;
        });

        return redirect()->route($this->getRoutePrefix().'.purchasing.purchase-orders.show', $po)
            ->with('success', $shouldSubmit ? __('purchasing.messages.po_submitted_on_create') : __('purchasing.messages.po_draft_saved'));
    }

    public function show(PurchaseOrder $po): Response
    {
        $po->load([
            'partner:id,name,code',
            'warehouse:id,name',
            'createdBy:id,name',
            'items.product:id,name,code,unit',
            'items.packaging:id,name,qty',
            'goodReceiptNotes' => fn ($q) => $q->latest('received_at')->with(['receivedBy:id,name', 'items:id,good_receipt_note_id,quantity_received']),
        ]);

        $progress = $po->receivingProgress();

        return inertia('Modules/Purchasing/PurchaseOrders/Show', [
            'order' => $po,
            'progress' => $progress,
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function edit(PurchaseOrder $po): Response|RedirectResponse
    {
        if ($po->status !== PurchaseOrder::STATUS_DRAFT) {
            return redirect()->route($this->getRoutePrefix().'.purchasing.purchase-orders.show', $po)
                ->with('error', __('purchasing.messages.po_edit_draft_only'));
        }

        $po->load(['items.product:id,name,code,unit', 'items.packaging:id,name,qty']);

        return inertia('Modules/Purchasing/PurchaseOrders/Edit', [
            'order' => $po,
            'suppliers' => Partner::query()
                ->where('supplier_rank', '>', 0)
                ->select('id', 'name', 'code')
                ->orderBy('name')
                ->get(),
            'warehouses' => \Modules\Inventory\Support\AccessibleWarehouses::query()
                ->where('status', 'active')
                ->purchaseInbound()
                ->select('id', 'name', 'kind')
                ->orderBy('name')
                ->get(),
            'products' => Product::query()
                ->where('status', 'active')
                ->with(['packagings' => fn ($q) => $q->select('id', 'product_id', 'name', 'qty')->orderBy('sort')])
                ->select('id', 'name', 'code', 'unit', 'stock_unit', 'cost')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function update(UpdatePurchaseOrderRequest $request, PurchaseOrder $po): RedirectResponse
    {
        if ($po->status !== PurchaseOrder::STATUS_DRAFT) {
            return back()->with('error', __('purchasing.messages.po_update_draft_only'));
        }

        $validated = $request->validated();

        DB::transaction(function () use ($po, $validated): void {
            $po->update([
                'partner_id' => $validated['partner_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'ordered_at' => $validated['ordered_at'],
                'expected_at' => $validated['expected_at'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $po->items()->delete();

            foreach ($validated['items'] as $item) {
                $po->items()->create([
                    'product_id' => $item['product_id'],
                    'product_packaging_id' => $item['product_packaging_id'] ?? null,
                    'quantity_ordered' => $item['quantity_ordered'],
                    'quantity_received' => 0,
                    'unit_price' => $item['unit_price'],
                    'unit' => $item['unit'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            $po->recalculateTotal();
        });

        return redirect()->route($this->getRoutePrefix().'.purchasing.purchase-orders.show', $po)
            ->with('success', __('purchasing.messages.po_updated'));
    }

    public function submit(PurchaseOrder $po): RedirectResponse
    {
        if ($po->status !== PurchaseOrder::STATUS_DRAFT) {
            return back()->with('error', __('purchasing.messages.po_submit_draft_only'));
        }

        if (! $po->items()->exists()) {
            return back()->with('error', __('purchasing.messages.po_submit_need_items'));
        }

        if (class_exists(\Modules\Approvals\Support\ApprovalGate::class)) {
            $gate = \Modules\Approvals\Support\ApprovalGate::authorize(
                \Modules\Approvals\Support\ApprovalTriggers::PO_AMOUNT,
                $po,
                [
                    'amount' => (float) $po->total_amount,
                    'resume' => 'purchasing.po.submit',
                ],
            );

            if (! $gate['allowed']) {
                return back()->with('error', $gate['message'] ?? __('purchasing.messages.po_approval_required'));
            }
        }

        $po->update(['status' => PurchaseOrder::STATUS_SUBMITTED]);

        return back()->with('success', __('purchasing.messages.po_submitted'));
    }

    public function approve(PurchaseOrder $po): RedirectResponse
    {
        if ($po->status !== PurchaseOrder::STATUS_SUBMITTED) {
            return back()->with('error', __('purchasing.messages.po_approve_submitted_only'));
        }

        $po->update(['status' => PurchaseOrder::STATUS_APPROVED]);

        return back()->with('success', __('purchasing.messages.po_approved'));
    }

    public function cancel(PurchaseOrder $po): RedirectResponse
    {
        if (! $po->canBeCancelled()) {
            return back()->with('error', __('purchasing.messages.po_cancel_not_allowed'));
        }

        $po->update(['status' => PurchaseOrder::STATUS_CANCELLED]);

        return back()->with('success', __('purchasing.messages.po_cancelled'));
    }

    public function close(PurchaseOrder $po): RedirectResponse
    {
        if ($po->status !== PurchaseOrder::STATUS_FULLY_RECEIVED) {
            return back()->with('error', __('purchasing.messages.po_close_fully_received_only'));
        }

        $po->update(['status' => PurchaseOrder::STATUS_CLOSED]);

        return back()->with('success', __('purchasing.messages.po_closed'));
    }

    public function destroy(PurchaseOrder $po): RedirectResponse
    {
        if ($po->status !== PurchaseOrder::STATUS_DRAFT) {
            return back()->with('error', __('purchasing.messages.po_delete_draft_only'));
        }

        $po->delete();

        return redirect()->route($this->getRoutePrefix().'.purchasing.purchase-orders.index')
            ->with('success', __('purchasing.messages.po_deleted'));
    }

    /**
     * @return array{create: bool, update: bool, receive: bool}
     */
    private function abilitiesFor(): array
    {
        $user = auth()->user();

        return [
            'create' => $user?->hasPermissionFor('purchasing', 'create') ?? false,
            'update' => $user?->hasPermissionFor('purchasing', 'update') ?? false,
            'receive' => $user?->hasPermissionFor('purchasing', 'receive') ?? false,
        ];
    }
}
