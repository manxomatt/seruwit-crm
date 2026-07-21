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
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(StoreWarehouseRequest $request): RedirectResponse
    {
        Warehouse::create($request->validated());

        return redirect()->route('inventory.warehouses.index')
            ->with('success', 'Warehouse created successfully');
    }

    public function show(Warehouse $warehouse)
    {
        return inertia('Modules/Inventory/Warehouses/Show', [
            'warehouse' => $warehouse->load(['stockLevels.product:id,name,category', 'stockMovements' => fn ($q) => $q->latest()->limit(50)]),
        ]);
    }

    public function update(UpdateWarehouseRequest $request, Warehouse $warehouse): RedirectResponse
    {
        $warehouse->update($request->validated());

        return back()->with('success', 'Warehouse updated successfully');
    }

    public function destroy(Warehouse $warehouse): RedirectResponse
    {
        $warehouse->delete();

        return redirect()->route('inventory.warehouses.index')
            ->with('success', 'Warehouse deleted successfully');
    }
}
