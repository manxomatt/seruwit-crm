<?php

namespace Modules\Purchasing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Response;
use Modules\Purchasing\Http\Requests\StorePurchaseReturnRequest;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\PurchaseReturn;
use Modules\Purchasing\Support\GrnConfirmationService;
use Modules\Purchasing\Support\PurchaseReturnConfirmationService;
use Modules\Purchasing\Support\PurchaseReturnQuantity;
use RuntimeException;

class PurchaseReturnController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function create(GoodReceiptNote $grn): Response|RedirectResponse
    {
        if ($grn->status !== GoodReceiptNote::STATUS_CONFIRMED) {
            return redirect()->route($this->getRoutePrefix().'.purchasing.grn.show', $grn)
                ->with('error', __('purchasing.messages.return_grn_confirmed_only'));
        }

        $grn->load([
            'purchaseOrder.partner:id,name,code',
            'warehouse:id,name',
            'items.purchaseOrderItem.product:id,name,code,unit',
            'items.location:id,name,code',
        ]);

        $returnableItems = $grn->items
            ->map(function ($item) {
                $lineRemaining = PurchaseReturnQuantity::remainingForGrnItem(
                    (float) $item->quantity_received,
                    (int) $item->id
                );

                return [
                    'grn_item_id' => $item->id,
                    'po_item_id' => $item->po_item_id,
                    'product' => $item->purchaseOrderItem?->product,
                    'quantity_received' => (float) $item->quantity_received,
                    'remaining' => min(
                        $lineRemaining,
                        (float) ($item->purchaseOrderItem?->quantity_received ?? 0)
                    ),
                    'unit' => $item->purchaseOrderItem?->unit ?? $item->purchaseOrderItem?->product?->unit,
                    'location_id' => $item->location_id,
                    'batch_number' => $item->batch_number,
                    'expiry_date' => $item->expiry_date?->toDateString(),
                ];
            })
            ->filter(fn (array $item) => $item['remaining'] > 0)
            ->values();

        if ($returnableItems->isEmpty()) {
            return redirect()->route($this->getRoutePrefix().'.purchasing.grn.show', $grn)
                ->with('error', __('purchasing.messages.return_nothing_returnable'));
        }

        return inertia('Modules/Purchasing/PurchaseReturns/Create', [
            'grn' => $grn,
            'returnableItems' => $returnableItems,
            'defaultStockLocationId' => app(GrnConfirmationService::class)->resolveStockLocationId((int) $grn->warehouse_id),
            'can' => [
                'create' => auth()->user()?->hasPermissionFor('purchasing', 'create') ?? false,
                'receive' => auth()->user()?->hasPermissionFor('purchasing', 'receive') ?? false,
            ],
        ]);
    }

    public function store(StorePurchaseReturnRequest $request, GoodReceiptNote $grn): RedirectResponse
    {
        if ($grn->status !== GoodReceiptNote::STATUS_CONFIRMED) {
            return back()->with('error', __('purchasing.messages.return_grn_confirmed_only'));
        }

        $validated = $request->validated();
        $shouldConfirm = (bool) ($validated['confirm'] ?? false);

        if ($shouldConfirm && ! auth()->user()?->hasPermissionFor('purchasing', 'receive')) {
            return back()->with('error', __('purchasing.messages.return_confirm_forbidden'));
        }

        $purchaseReturn = DB::transaction(function () use ($validated, $grn) {
            $purchaseReturn = PurchaseReturn::query()->create([
                'return_number' => PurchaseReturn::nextNumber(),
                'purchase_order_id' => $grn->purchase_order_id,
                'good_receipt_note_id' => $grn->id,
                'warehouse_id' => $grn->warehouse_id,
                'created_by' => auth()->id(),
                'status' => PurchaseReturn::STATUS_DRAFT,
                'returned_at' => $validated['returned_at'],
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $purchaseReturn->items()->create([
                    'po_item_id' => $item['po_item_id'],
                    'grn_item_id' => $item['grn_item_id'],
                    'location_id' => $item['location_id']
                        ?? app(GrnConfirmationService::class)->resolveStockLocationId((int) $grn->warehouse_id),
                    'quantity_returned' => $item['quantity_returned'],
                    'batch_number' => $item['batch_number'] ?? null,
                    'expiry_date' => $item['expiry_date'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            return $purchaseReturn;
        });

        if ($shouldConfirm) {
            try {
                app(PurchaseReturnConfirmationService::class)->confirm($purchaseReturn);
            } catch (RuntimeException $e) {
                return redirect()->route($this->getRoutePrefix().'.purchasing.returns.show', $purchaseReturn)
                    ->with('error', $e->getMessage());
            }

            return redirect()->route($this->getRoutePrefix().'.purchasing.purchase-orders.show', $grn->purchase_order_id)
                ->with('success', __('purchasing.messages.return_confirmed'));
        }

        return redirect()->route($this->getRoutePrefix().'.purchasing.returns.show', $purchaseReturn)
            ->with('success', __('purchasing.messages.return_draft_saved'));
    }

    public function show(PurchaseReturn $purchaseReturn): Response
    {
        $purchaseReturn->load([
            'purchaseOrder.partner:id,name,code',
            'goodReceiptNote:id,grn_number',
            'warehouse:id,name',
            'createdBy:id,name',
            'items.purchaseOrderItem.product:id,name,code,unit',
            'items.location:id,name,code',
        ]);

        return inertia('Modules/Purchasing/PurchaseReturns/Show', [
            'purchaseReturn' => $purchaseReturn,
            'can' => [
                'receive' => auth()->user()?->hasPermissionFor('purchasing', 'receive') ?? false,
                'void' => auth()->user()?->hasPermissionFor('purchasing', 'receive') ?? false,
            ],
        ]);
    }

    public function confirm(PurchaseReturn $purchaseReturn): RedirectResponse
    {
        try {
            app(PurchaseReturnConfirmationService::class)->confirm($purchaseReturn);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route($this->getRoutePrefix().'.purchasing.purchase-orders.show', $purchaseReturn->purchase_order_id)
            ->with('success', __('purchasing.messages.return_confirmed'));
    }

    public function void(PurchaseReturn $purchaseReturn): RedirectResponse
    {
        try {
            app(PurchaseReturnConfirmationService::class)->void($purchaseReturn);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route($this->getRoutePrefix().'.purchasing.purchase-orders.show', $purchaseReturn->purchase_order_id)
            ->with('success', __('purchasing.messages.return_voided'));
    }
}
