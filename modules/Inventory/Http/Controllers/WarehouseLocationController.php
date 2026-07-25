<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\Inventory\Http\Requests\StoreWarehouseLocationRequest;
use Modules\Inventory\Http\Requests\UpdateWarehouseLocationRequest;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;

class WarehouseLocationController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function create(Warehouse $warehouse)
    {
        return inertia('Modules/Inventory/Locations/Create', [
            'warehouse' => $warehouse->only('id', 'name'),
            'parentOptions' => $warehouse->locations()
                ->whereNull('parent_id')
                ->select('id', 'name', 'code')
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    public function store(StoreWarehouseLocationRequest $request, Warehouse $warehouse): RedirectResponse
    {
        $warehouse->locations()->create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.inventory.warehouses.show', $warehouse)
            ->with('success', __('inventory.messages.location_created'));
    }

    public function edit(Warehouse $warehouse, WarehouseLocation $location)
    {
        return inertia('Modules/Inventory/Locations/Edit', [
            'warehouse' => $warehouse->only('id', 'name'),
            'location' => $location,
            'parentOptions' => $warehouse->locations()
                ->whereNull('parent_id')
                ->where('id', '!=', $location->id)
                ->select('id', 'name', 'code')
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    public function update(UpdateWarehouseLocationRequest $request, Warehouse $warehouse, WarehouseLocation $location): RedirectResponse
    {
        $location->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.inventory.warehouses.show', $warehouse)
            ->with('success', __('inventory.messages.location_updated'));
    }

    public function destroy(Warehouse $warehouse, WarehouseLocation $location): RedirectResponse
    {
        if ($location->is_default) {
            return back()->with('error', __('inventory.messages.location_default'));
        }

        if ($location->stockLevels()->where('on_hand', '>', 0)->exists()) {
            return back()->with('error', __('inventory.messages.location_has_stock'));
        }

        if ($location->children()->exists()) {
            return back()->with('error', __('inventory.messages.location_has_children'));
        }

        $location->delete();

        return redirect()->route($this->getRoutePrefix().'.inventory.warehouses.show', $warehouse)
            ->with('success', __('inventory.messages.location_deleted'));
    }
}
