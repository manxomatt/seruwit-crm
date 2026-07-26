<?php

namespace Modules\Sales\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Response;
use Modules\Sales\Http\Requests\StoreSalesReturnRequest;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\SalesReturn;
use Modules\Sales\Support\GinConfirmationService;
use Modules\Sales\Support\SalesReturnConfirmationService;
use Modules\Sales\Support\SalesReturnQuantity;
use RuntimeException;

class SalesReturnController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function create(GoodsIssueNote $gin): Response|RedirectResponse
    {
        if ($gin->status !== GoodsIssueNote::STATUS_CONFIRMED) {
            return redirect()->route($this->getRoutePrefix().'.sales.gin.show', $gin)
                ->with('error', __('sales.messages.return_gin_confirmed_only'));
        }

        $gin->load([
            'salesOrder.partner:id,name,code',
            'warehouse:id,name',
            'items.salesOrderItem.product:id,name,code,unit',
            'items.location:id,name,code',
        ]);

        $returnableItems = $gin->items
            ->map(function ($item) {
                $lineRemaining = SalesReturnQuantity::remainingForGinItem(
                    (float) $item->quantity_issued,
                    (int) $item->id
                );

                return [
                    'gin_item_id' => $item->id,
                    'so_item_id' => $item->so_item_id,
                    'product' => $item->salesOrderItem?->product,
                    'quantity_issued' => (float) $item->quantity_issued,
                    'quantity_delivered' => (float) ($item->salesOrderItem?->quantity_delivered ?? 0),
                    'remaining' => min(
                        $lineRemaining,
                        (float) ($item->salesOrderItem?->quantity_delivered ?? 0)
                    ),
                    'unit' => $item->salesOrderItem?->unit ?? $item->salesOrderItem?->product?->unit,
                    'location_id' => $item->location_id,
                    'batch_number' => $item->batch_number,
                    'expiry_date' => $item->expiry_date?->toDateString(),
                ];
            })
            ->filter(fn (array $item) => $item['remaining'] > 0)
            ->values();

        if ($returnableItems->isEmpty()) {
            return redirect()->route($this->getRoutePrefix().'.sales.gin.show', $gin)
                ->with('error', __('sales.messages.return_nothing_returnable'));
        }

        return inertia('Modules/Sales/SalesReturns/Create', [
            'gin' => $gin,
            'returnableItems' => $returnableItems,
            'defaultStockLocationId' => app(GinConfirmationService::class)->resolveStockLocationId((int) $gin->warehouse_id),
            'can' => [
                'create' => auth()->user()?->hasPermissionFor('sales', 'create') ?? false,
                'issue' => auth()->user()?->hasPermissionFor('sales', 'issue') ?? false,
            ],
        ]);
    }

    public function store(StoreSalesReturnRequest $request, GoodsIssueNote $gin): RedirectResponse
    {
        if ($gin->status !== GoodsIssueNote::STATUS_CONFIRMED) {
            return back()->with('error', __('sales.messages.return_gin_confirmed_only'));
        }

        $validated = $request->validated();
        $shouldConfirm = (bool) ($validated['confirm'] ?? false);

        if ($shouldConfirm && ! auth()->user()?->hasPermissionFor('sales', 'issue')) {
            return back()->with('error', __('sales.messages.return_confirm_forbidden'));
        }

        $salesReturn = DB::transaction(function () use ($validated, $gin) {
            $salesReturn = SalesReturn::query()->create([
                'return_number' => SalesReturn::nextNumber(),
                'sales_order_id' => $gin->sales_order_id,
                'goods_issue_note_id' => $gin->id,
                'warehouse_id' => $gin->warehouse_id,
                'created_by' => auth()->id(),
                'status' => SalesReturn::STATUS_DRAFT,
                'returned_at' => $validated['returned_at'],
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $salesReturn->items()->create([
                    'so_item_id' => $item['so_item_id'],
                    'gin_item_id' => $item['gin_item_id'],
                    'location_id' => $item['location_id']
                        ?? app(GinConfirmationService::class)->resolveStockLocationId((int) $gin->warehouse_id),
                    'quantity_returned' => $item['quantity_returned'],
                    'batch_number' => $item['batch_number'] ?? null,
                    'expiry_date' => $item['expiry_date'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            return $salesReturn;
        });

        if ($shouldConfirm) {
            try {
                app(SalesReturnConfirmationService::class)->confirm($salesReturn);
            } catch (RuntimeException $e) {
                return redirect()->route($this->getRoutePrefix().'.sales.returns.show', $salesReturn)
                    ->with('error', $e->getMessage());
            }

            return redirect()->route($this->getRoutePrefix().'.sales.sales-orders.show', $gin->sales_order_id)
                ->with('success', __('sales.messages.return_confirmed'));
        }

        return redirect()->route($this->getRoutePrefix().'.sales.returns.show', $salesReturn)
            ->with('success', __('sales.messages.return_draft_saved'));
    }

    public function show(SalesReturn $salesReturn): Response
    {
        $salesReturn->load([
            'salesOrder.partner:id,name,code',
            'goodsIssueNote:id,gin_number',
            'warehouse:id,name',
            'createdBy:id,name',
            'items.salesOrderItem.product:id,name,code,unit',
            'items.location:id,name,code',
        ]);

        return inertia('Modules/Sales/SalesReturns/Show', [
            'salesReturn' => $salesReturn,
            'can' => [
                'issue' => auth()->user()?->hasPermissionFor('sales', 'issue') ?? false,
                'void' => auth()->user()?->hasPermissionFor('sales', 'issue') ?? false,
            ],
        ]);
    }

    public function confirm(SalesReturn $salesReturn): RedirectResponse
    {
        try {
            app(SalesReturnConfirmationService::class)->confirm($salesReturn);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route($this->getRoutePrefix().'.sales.sales-orders.show', $salesReturn->sales_order_id)
            ->with('success', __('sales.messages.return_confirmed'));
    }

    public function void(SalesReturn $salesReturn): RedirectResponse
    {
        try {
            app(SalesReturnConfirmationService::class)->void($salesReturn);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route($this->getRoutePrefix().'.sales.sales-orders.show', $salesReturn->sales_order_id)
            ->with('success', __('sales.messages.return_voided'));
    }
}
