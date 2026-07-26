<?php

namespace Modules\Outbound\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Outbound\Http\Requests\ConfirmPickItemRequest;
use Modules\Outbound\Http\Requests\StorePickListRequest;
use Modules\Outbound\Models\PickList;
use Modules\Outbound\Models\PickListItem;
use Modules\Outbound\Support\PickListGenerator;
use Modules\Outbound\Support\PickPackWorkflow;

class PickListController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $lists = PickList::query()
            ->with([
                'deliveryOrder:id,code,status,partner_id',
                'deliveryOrder.partner:id,name,code',
                'warehouse:id,name',
            ])
            ->withCount('items')
            ->when(request('status'), fn ($q, $status) => $q->where('status', $status))
            ->when(request('search'), fn ($q, $search) => $q->where('code', 'like', "%{$search}%")
                ->orWhereHas('deliveryOrder', fn ($dq) => $dq->where('code', 'like', "%{$search}%")))
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Modules/Outbound/PickLists/Index', [
            'pickLists' => $lists,
            'filters' => [
                'status' => request('status'),
                'search' => request('search'),
            ],
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function create(): Response
    {
        $eligibleStatuses = [
            DeliveryOrder::STATUS_CONFIRMED,
            DeliveryOrder::STATUS_ASSIGNED,
            DeliveryOrder::STATUS_IN_TRANSIT,
        ];

        $activeOrderIds = PickList::query()
            ->whereNotIn('status', [PickList::STATUS_CANCELLED])
            ->pluck('delivery_order_id');

        return Inertia::render('Modules/Outbound/PickLists/Create', [
            'orders' => DeliveryOrder::query()
                ->with('partner:id,name,code')
                ->whereIn('status', $eligibleStatuses)
                ->whereNull('goods_issue_note_id')
                ->whereNotIn('id', $activeOrderIds)
                ->withCount('items')
                ->latest('id')
                ->limit(50)
                ->get(['id', 'code', 'status', 'partner_id', 'order_date']),
            'warehouses' => Warehouse::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
            'selectedOrderId' => request()->integer('delivery_order_id') ?: null,
        ]);
    }

    public function store(StorePickListRequest $request): RedirectResponse
    {
        $order = DeliveryOrder::query()->findOrFail($request->integer('delivery_order_id'));
        $warehouse = Warehouse::query()->findOrFail($request->integer('warehouse_id'));

        $pickList = PickListGenerator::generate($order, $warehouse, $request->input('notes'));

        return redirect()
            ->route($this->getRoutePrefix().'.outbound.pick-lists.show', $pickList)
            ->with('success', __('outbound.messages.pick_list_generated'));
    }

    public function show(PickList $pickList): Response
    {
        $pickList->load([
            'deliveryOrder.partner:id,code,name',
            'deliveryOrder.items',
            'warehouse:id,name',
            'items.product:id,name,sku,unit',
            'items.suggestedLocation:id,name,code',
            'items.location:id,name,code',
            'packs.items',
            'generator:id,name',
        ]);

        $locations = WarehouseLocation::query()
            ->where('warehouse_id', $pickList->warehouse_id)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'code', 'type']);

        return Inertia::render('Modules/Outbound/PickLists/Show', [
            'pickList' => $pickList,
            'locations' => $locations,
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function confirmItem(ConfirmPickItemRequest $request, PickList $pickList, PickListItem $item): RedirectResponse
    {
        if ((int) $item->pick_list_id !== (int) $pickList->id) {
            abort(404);
        }

        PickPackWorkflow::confirmItem($item, $request->validated());

        return back()->with('success', __('outbound.messages.pick_line_confirmed'));
    }

    public function completePicking(PickList $pickList): RedirectResponse
    {
        PickPackWorkflow::completePicking($pickList);

        return back()->with('success', __('outbound.messages.picking_completed'));
    }

    public function dispatch(PickList $pickList): RedirectResponse
    {
        PickPackWorkflow::dispatch($pickList);

        return back()->with('success', __('outbound.messages.dispatched'));
    }

    public function cancel(PickList $pickList): RedirectResponse
    {
        PickPackWorkflow::cancel($pickList);

        return redirect()
            ->route($this->getRoutePrefix().'.outbound.pick-lists.index')
            ->with('success', __('outbound.messages.pick_list_cancelled'));
    }

    /**
     * @return array<string, bool>
     */
    private function abilitiesFor(): array
    {
        $user = Auth::user();

        return [
            'create' => $user->hasPermissionFor('outbound', 'create'),
            'update' => $user->hasPermissionFor('outbound', 'update'),
            'delete' => $user->hasPermissionFor('outbound', 'delete'),
            'pick' => $user->hasPermissionFor('outbound', 'pick'),
            'pack' => $user->hasPermissionFor('outbound', 'pack'),
            'dispatch' => $user->hasPermissionFor('outbound', 'dispatch'),
        ];
    }
}
