<?php

namespace Modules\Sales\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Response;
use Modules\Inventory\Models\Warehouse;
use Modules\Sales\Http\Requests\StoreGoodsIssueNoteRequest;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Support\GinConfirmationService;
use RuntimeException;

class GoodsIssueNoteController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function create(SalesOrder $so): Response|RedirectResponse
    {
        if (! $so->canIssue()) {
            return redirect()->route($this->getRoutePrefix().'.sales.sales-orders.show', $so)
                ->with('error', __('sales.messages.gin_cannot_issue'));
        }

        $so->load([
            'partner:id,name,code',
            'warehouse:id,name',
            'items.product:id,name,code,unit,stock_unit',
            'items.packaging:id,name,qty',
        ]);

        $deliverableItems = $so->items
            ->filter(fn ($item) => $item->remainingQuantity() > 0)
            ->values()
            ->map(fn ($item) => [
                'id' => $item->id,
                'product' => $item->product,
                'quantity_ordered' => $item->quantity_ordered,
                'quantity_delivered' => $item->quantity_delivered,
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

        return inertia('Modules/Sales/GoodsIssueNotes/Create', [
            'order' => $so,
            'deliverableItems' => $deliverableItems,
            'warehouses' => $warehouses,
            'defaultStockLocationId' => app(GinConfirmationService::class)->resolveStockLocationId((int) $so->warehouse_id),
            'can' => [
                'issue' => auth()->user()?->hasPermissionFor('sales', 'issue') ?? false,
            ],
        ]);
    }

    public function store(StoreGoodsIssueNoteRequest $request, SalesOrder $so): RedirectResponse
    {
        if (! $so->canIssue()) {
            return back()->with('error', __('sales.messages.gin_cannot_issue'));
        }

        $validated = $request->validated();
        $shouldConfirm = (bool) ($validated['confirm'] ?? false);

        if ($shouldConfirm && ! auth()->user()?->hasPermissionFor('sales', 'issue')) {
            return back()->with('error', __('sales.messages.gin_confirm_forbidden'));
        }

        $gin = DB::transaction(function () use ($validated, $so) {
            $gin = GoodsIssueNote::create([
                'sales_order_id' => $so->id,
                'warehouse_id' => $validated['warehouse_id'],
                'issued_by' => auth()->id(),
                'gin_number' => GoodsIssueNote::nextNumber(),
                'status' => GoodsIssueNote::STATUS_DRAFT,
                'issued_at' => $validated['issued_at'],
                'delivery_note_number' => $validated['delivery_note_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $locationId = $item['location_id']
                    ?? app(GinConfirmationService::class)->resolveStockLocationId((int) $validated['warehouse_id']);

                $gin->items()->create([
                    'so_item_id' => $item['so_item_id'],
                    'location_id' => $locationId,
                    'quantity_issued' => $item['quantity_issued'],
                    'batch_number' => $item['batch_number'] ?? null,
                    'expiry_date' => $item['expiry_date'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            return $gin;
        });

        if ($shouldConfirm) {
            try {
                app(GinConfirmationService::class)->confirm($gin);
            } catch (RuntimeException $e) {
                return redirect()->route($this->getRoutePrefix().'.sales.gin.show', $gin)
                    ->with('error', $e->getMessage());
            }

            return redirect()->route($this->getRoutePrefix().'.sales.sales-orders.show', $so)
                ->with('success', __('sales.messages.gin_confirmed'));
        }

        return redirect()->route($this->getRoutePrefix().'.sales.gin.show', $gin)
            ->with('success', __('sales.messages.gin_draft_saved'));
    }

    public function show(GoodsIssueNote $gin): Response
    {
        $gin->load([
            'salesOrder.partner:id,name,code',
            'warehouse:id,name',
            'issuedBy:id,name',
            'items.salesOrderItem.product:id,name,code,unit',
            'items.location:id,name,code',
        ]);

        return inertia('Modules/Sales/GoodsIssueNotes/Show', [
            'gin' => $gin,
            'can' => [
                'issue' => auth()->user()?->hasPermissionFor('sales', 'issue') ?? false,
                'void' => auth()->user()?->hasPermissionFor('sales', 'issue') ?? false,
            ],
        ]);
    }

    public function confirm(GoodsIssueNote $gin): RedirectResponse
    {
        try {
            app(GinConfirmationService::class)->confirm($gin);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route($this->getRoutePrefix().'.sales.sales-orders.show', $gin->sales_order_id)
            ->with('success', __('sales.messages.gin_confirmed'));
    }

    public function void(GoodsIssueNote $gin): RedirectResponse
    {
        try {
            app(GinConfirmationService::class)->void($gin);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route($this->getRoutePrefix().'.sales.sales-orders.show', $gin->sales_order_id)
            ->with('success', __('sales.messages.gin_voided'));
    }
}
