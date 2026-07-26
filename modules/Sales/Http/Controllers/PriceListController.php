<?php

namespace Modules\Sales\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;
use Modules\Product\Models\Product;
use Modules\Sales\Http\Requests\StorePriceListItemRequest;
use Modules\Sales\Http\Requests\StorePriceListRequest;
use Modules\Sales\Http\Requests\UpdatePriceListRequest;
use Modules\Sales\Models\PriceList;
use Modules\Sales\Models\PriceListItem;

class PriceListController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $lists = PriceList::query()
            ->withCount('items')
            ->orderBy('name')
            ->paginate(20);

        return inertia('Modules/Sales/PriceLists/Index', [
            'priceLists' => $lists,
            'can' => [
                'create' => auth()->user()?->hasPermissionFor('sales', 'create') ?? false,
                'update' => auth()->user()?->hasPermissionFor('sales', 'update') ?? false,
            ],
        ]);
    }

    public function create(): Response
    {
        return inertia('Modules/Sales/PriceLists/Create', [
            'can' => [
                'create' => auth()->user()?->hasPermissionFor('sales', 'create') ?? false,
            ],
        ]);
    }

    public function store(StorePriceListRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $list = PriceList::query()->create([
            'name' => $validated['name'],
            'code' => $validated['code'] ?: PriceList::nextCode(),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route($this->getRoutePrefix().'.sales.price-lists.show', $list)
            ->with('success', __('sales.messages.price_list_created'));
    }

    public function show(PriceList $priceList): Response
    {
        $priceList->load(['items.product:id,name,code,unit']);

        return inertia('Modules/Sales/PriceLists/Show', [
            'priceList' => $priceList,
            'products' => Product::query()
                ->where('status', 'active')
                ->select('id', 'name', 'code', 'price')
                ->orderBy('name')
                ->get(),
            'can' => [
                'update' => auth()->user()?->hasPermissionFor('sales', 'update') ?? false,
            ],
        ]);
    }

    public function update(UpdatePriceListRequest $request, PriceList $priceList): RedirectResponse
    {
        $validated = $request->validated();

        $priceList->update([
            'name' => $validated['name'],
            'code' => $validated['code'] ?: $priceList->code,
            'is_active' => (bool) ($validated['is_active'] ?? $priceList->is_active),
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', __('sales.messages.price_list_updated'));
    }

    public function storeItem(StorePriceListItemRequest $request, PriceList $priceList): RedirectResponse
    {
        $validated = $request->validated();

        PriceListItem::query()->updateOrCreate(
            [
                'price_list_id' => $priceList->id,
                'product_id' => $validated['product_id'],
            ],
            ['unit_price' => $validated['unit_price']],
        );

        return back()->with('success', __('sales.messages.price_list_item_saved'));
    }

    public function destroyItem(PriceList $priceList, PriceListItem $item): RedirectResponse
    {
        if ((int) $item->price_list_id !== (int) $priceList->id) {
            abort(404);
        }

        $item->delete();

        return back()->with('success', __('sales.messages.price_list_item_deleted'));
    }
}
