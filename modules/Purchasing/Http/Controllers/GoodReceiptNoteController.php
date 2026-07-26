<?php

namespace Modules\Purchasing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Response;
use Modules\Inventory\Models\Warehouse;
use Modules\Payables\Support\PurchaseBillService;
use Modules\Purchasing\Http\Requests\StoreGoodReceiptNoteRequest;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Support\GrnConfirmationService;
use RuntimeException;

class GoodReceiptNoteController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function create(PurchaseOrder $po): Response|RedirectResponse
    {
        if (! $po->canReceive()) {
            return redirect()->route($this->getRoutePrefix().'.purchasing.purchase-orders.show', $po)
                ->with('error', __('purchasing.messages.grn_cannot_receive'));
        }

        $po->load([
            'partner:id,name,code',
            'warehouse:id,name',
            'items.product:id,name,code,unit,stock_unit',
            'items.packaging:id,name,qty',
        ]);

        $receivableItems = $po->items
            ->filter(fn ($item) => $item->remainingQuantity() > 0)
            ->values()
            ->map(fn ($item) => [
                'id' => $item->id,
                'product' => $item->product,
                'quantity_ordered' => $item->quantity_ordered,
                'quantity_received' => $item->quantity_received,
                'remaining' => $item->remainingQuantity(),
                'unit' => $item->unit,
                'packaging' => $item->packaging,
            ]);

        $warehouses = Warehouse::query()
            ->where('status', 'active')
            ->with(['locations' => fn ($q) => $q->select('id', 'warehouse_id', 'name', 'code')->orderBy('sort_order')])
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return inertia('Modules/Purchasing/GoodReceiptNotes/Create', [
            'order' => $po,
            'receivableItems' => $receivableItems,
            'warehouses' => $warehouses,
            'defaultStockLocationId' => app(GrnConfirmationService::class)->resolveInputLocationId((int) $po->warehouse_id),
            'can' => [
                'receive' => auth()->user()?->hasPermissionFor('purchasing', 'receive') ?? false,
            ],
        ]);
    }

    public function store(StoreGoodReceiptNoteRequest $request, PurchaseOrder $po): RedirectResponse
    {
        if (! $po->canReceive()) {
            return back()->with('error', __('purchasing.messages.grn_cannot_receive'));
        }

        $validated = $request->validated();
        $shouldConfirm = (bool) ($validated['confirm'] ?? false);

        if ($shouldConfirm && ! auth()->user()?->hasPermissionFor('purchasing', 'receive')) {
            return back()->with('error', __('purchasing.messages.grn_confirm_forbidden'));
        }

        $grn = DB::transaction(function () use ($validated, $po) {
            $grn = GoodReceiptNote::create([
                'purchase_order_id' => $po->id,
                'warehouse_id' => $validated['warehouse_id'],
                'received_by' => auth()->id(),
                'grn_number' => GoodReceiptNote::nextNumber(),
                'status' => GoodReceiptNote::STATUS_DRAFT,
                'received_at' => $validated['received_at'],
                'supplier_do_number' => $validated['supplier_do_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $locationId = $item['location_id']
                    ?? app(GrnConfirmationService::class)->resolveInputLocationId((int) $validated['warehouse_id']);

                $grn->items()->create([
                    'po_item_id' => $item['po_item_id'],
                    'location_id' => $locationId,
                    'quantity_received' => $item['quantity_received'],
                    'batch_number' => $item['batch_number'] ?? null,
                    'expiry_date' => $item['expiry_date'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            return $grn;
        });

        if ($shouldConfirm) {
            try {
                app(GrnConfirmationService::class)->confirm($grn);
            } catch (RuntimeException $e) {
                return redirect()->route($this->getRoutePrefix().'.purchasing.grn.show', $grn)
                    ->with('error', $e->getMessage());
            }

            return redirect()->route($this->getRoutePrefix().'.purchasing.purchase-orders.show', $po)
                ->with('success', __('purchasing.messages.grn_confirmed'));
        }

        return redirect()->route($this->getRoutePrefix().'.purchasing.grn.show', $grn)
            ->with('success', __('purchasing.messages.grn_draft_saved'));
    }

    public function show(GoodReceiptNote $grn): Response
    {
        $grn->load([
            'purchaseOrder.partner:id,name,code',
            'warehouse:id,name',
            'receivedBy:id,name',
            'items.purchaseOrderItem.product:id,name,code,unit',
            'items.location:id,name,code',
        ]);

        $billService = app(PurchaseBillService::class);
        $canBill = $billService->isAvailable()
            && (auth()->user()?->hasPermissionFor('payables', 'create') ?? false)
            && $billService->hasBillableReceipt($grn);

        $canReturn = $grn->status === GoodReceiptNote::STATUS_CONFIRMED
            && (auth()->user()?->hasPermissionFor('purchasing', 'create') ?? false);

        return inertia('Modules/Purchasing/GoodReceiptNotes/Show', [
            'grn' => $grn,
            'can' => [
                'receive' => auth()->user()?->hasPermissionFor('purchasing', 'receive') ?? false,
                'void' => auth()->user()?->hasPermissionFor('purchasing', 'receive') ?? false,
                'bill' => $canBill,
                'return' => $canReturn,
            ],
        ]);
    }

    public function confirm(GoodReceiptNote $grn): RedirectResponse
    {
        try {
            app(GrnConfirmationService::class)->confirm($grn);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route($this->getRoutePrefix().'.purchasing.purchase-orders.show', $grn->purchase_order_id)
            ->with('success', __('purchasing.messages.grn_confirmed'));
    }

    public function void(GoodReceiptNote $grn): RedirectResponse
    {
        try {
            app(GrnConfirmationService::class)->void($grn);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route($this->getRoutePrefix().'.purchasing.purchase-orders.show', $grn->purchase_order_id)
            ->with('success', __('purchasing.messages.grn_voided'));
    }
}
