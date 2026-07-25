<?php

namespace Modules\Outbound\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Outbound\Http\Requests\StorePackRequest;
use Modules\Outbound\Models\Pack;
use Modules\Outbound\Models\PackItem;
use Modules\Outbound\Models\PickList;
use Modules\Outbound\Support\PickPackWorkflow;

class PackController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function create(PickList $pickList): Response
    {
        $pickList->load([
            'deliveryOrder:id,code',
            'items.product:id,name,sku',
            'packs.items',
        ]);

        $lines = $pickList->items
            ->filter(fn ($item) => (float) $item->quantity_picked > 0)
            ->map(function ($item) {
                $packed = (float) PackItem::query()->where('pick_list_item_id', $item->id)->sum('quantity');

                return [
                    'id' => $item->id,
                    'product' => $item->product,
                    'quantity_picked' => (float) $item->quantity_picked,
                    'quantity_remaining' => max(0, round((float) $item->quantity_picked - $packed, 2)),
                    'batch_number' => $item->batch_number,
                    'location' => $item->location,
                ];
            })
            ->values();

        return Inertia::render('Modules/Outbound/Packs/Create', [
            'pickList' => $pickList->only(['id', 'code', 'status']),
            'deliveryOrder' => $pickList->deliveryOrder,
            'lines' => $lines,
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function store(StorePackRequest $request, PickList $pickList): RedirectResponse
    {
        $pack = PickPackWorkflow::createPack($pickList, $request->validated());

        return redirect()
            ->route($this->getRoutePrefix().'.outbound.packs.show', $pack)
            ->with('success', __('outbound.messages.pack_created'));
    }

    public function show(Pack $pack): Response
    {
        $pack->load([
            'pickList.deliveryOrder:id,code',
            'pickList.warehouse:id,name',
            'items.pickListItem.product:id,name,sku',
            'packer:id,name',
        ]);

        return Inertia::render('Modules/Outbound/Packs/Show', [
            'pack' => $pack,
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function label(Pack $pack): Response
    {
        $pack->load([
            'pickList.deliveryOrder:id,code,delivery_address',
            'pickList.deliveryOrder.partner:id,name',
            'items.pickListItem.product:id,name,sku',
        ]);

        return Inertia::render('Modules/Outbound/Packs/Label', [
            'pack' => $pack,
        ]);
    }

    public function seal(Pack $pack): RedirectResponse
    {
        PickPackWorkflow::sealPack($pack);

        return back()->with('success', __('outbound.messages.pack_sealed'));
    }

    /**
     * @return array<string, bool>
     */
    private function abilitiesFor(): array
    {
        $user = Auth::user();

        return [
            'pack' => $user->hasPermissionFor('outbound', 'pack'),
            'dispatch' => $user->hasPermissionFor('outbound', 'dispatch'),
        ];
    }
}
