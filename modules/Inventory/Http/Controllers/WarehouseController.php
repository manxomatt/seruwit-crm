<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\Inventory\Http\Requests\StoreWarehouseRequest;
use Modules\Inventory\Http\Requests\UpdateWarehouseRequest;
use Modules\Inventory\Models\Warehouse;

class WarehouseController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index()
    {
        return inertia('Modules/Inventory/Warehouses/Index', [
            'warehouses' => Warehouse::query()
                ->select('id', 'name', 'location', 'status', 'created_at')
                ->withCount('locations')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function create()
    {
        return inertia('Modules/Inventory/Warehouses/Create');
    }

    public function store(StoreWarehouseRequest $request): RedirectResponse
    {
        $warehouse = Warehouse::create($request->validated());
        $warehouse->createDefaultLocations();

        return redirect()->route($this->getRoutePrefix().'.inventory.warehouses.index')
            ->with('success', __('inventory.messages.warehouse_created'));
    }

    public function show(Warehouse $warehouse)
    {
        $stockLevels = $warehouse->stockLevels()
            ->with(['product:id,name,category', 'location:id,name,code'])
            ->orderBy('id')
            ->paginate(15, ['*'], 'stock_page')
            ->withQueryString();

        $stockMovements = $warehouse->stockMovements()
            ->with('location:id,name,code')
            ->latest('recorded_at')
            ->paginate(15, ['*'], 'movement_page')
            ->withQueryString();

        return inertia('Modules/Inventory/Warehouses/Show', [
            'warehouse' => $warehouse->load([
                'locations' => fn ($q) => $q->with('parent:id,name,code')->withCount(['stockLevels', 'children'])->orderBy('sort_order'),
            ]),
            'stockLevels' => $stockLevels,
            'stockMovements' => $stockMovements,
        ]);
    }

    public function update(UpdateWarehouseRequest $request, Warehouse $warehouse): RedirectResponse
    {
        $warehouse->update($request->validated());

        return back()->with('success', __('inventory.messages.warehouse_updated'));
    }

    public function destroy(Warehouse $warehouse): RedirectResponse
    {
        $warehouse->delete();

        return redirect()->route($this->getRoutePrefix().'.inventory.warehouses.index')
            ->with('success', __('inventory.messages.warehouse_deleted'));
    }
}
