<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\Inventory\Http\Requests\StoreStockMovementRequest;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Product\Models\Product;

class StockMovementController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index()
    {
        return inertia('Modules/Inventory/StockMovements/Index', [
            'movements' => StockMovement::query()
                ->with(['product:id,name', 'warehouse:id,name', 'location:id,name,code', 'recordedBy:id,name'])
                ->select('id', 'product_id', 'warehouse_id', 'location_id', 'type', 'quantity', 'source_type', 'reference_code', 'notes', 'recorded_by', 'recorded_at')
                ->latest('recorded_at')
                ->paginate(50),
        ]);
    }

    public function create()
    {
        return inertia('Modules/Inventory/StockMovements/Create', [
            'products' => Product::query()
                ->select('id', 'name', 'category', 'unit')
                ->orderBy('name')
                ->get(),
            'warehouses' => Warehouse::query()
                ->where('status', 'active')
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'locations' => WarehouseLocation::query()
                ->select('id', 'warehouse_id', 'name', 'code', 'type')
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    public function store(StoreStockMovementRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        StockMovementRecorder::record([
            'product_id' => $validated['product_id'],
            'warehouse_id' => $validated['warehouse_id'],
            'location_id' => $validated['location_id'] ?? null,
            'type' => $validated['type'],
            'quantity' => $validated['quantity'],
            'source_type' => 'manual',
            'source_id' => null,
            'reference_code' => $validated['reference_code'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'recorded_by' => auth()->id(),
            'recorded_at' => now(),
        ]);

        return redirect()->route($this->getRoutePrefix().'.inventory.stock-movements.index')
            ->with('success', 'Stock movement recorded');
    }
}
