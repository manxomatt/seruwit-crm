<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;
use Modules\Inventory\Http\Requests\StorePutawayRequest;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Inventory\Support\PutawayService;
use RuntimeException;

class PutawayController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        $warehouseId = $request->integer('warehouse_id') ?: null;

        $warehouses = Warehouse::query()
            ->where('status', 'active')
            ->with(['locations' => fn ($q) => $q->select('id', 'warehouse_id', 'name', 'code', 'type')->orderBy('sort_order')])
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $holdingTypes = ['input', 'quality_control'];

        $levels = StockLevel::query()
            ->with([
                'product:id,name,code,unit',
                'location:id,name,code,type',
                'warehouse:id,name',
            ])
            ->where('on_hand', '>', 0)
            ->whereHas('location', fn ($q) => $q->whereIn('type', $holdingTypes))
            ->when($warehouseId, fn ($q) => $q->where('warehouse_id', $warehouseId))
            ->orderBy('warehouse_id')
            ->orderBy('product_id')
            ->get()
            ->map(fn (StockLevel $level) => [
                'id' => $level->id,
                'product_id' => $level->product_id,
                'warehouse_id' => $level->warehouse_id,
                'location_id' => $level->location_id,
                'batch_number' => $level->batch_number !== '' ? $level->batch_number : null,
                'expiry_date' => $level->expiry_date?->toDateString(),
                'on_hand' => $level->on_hand,
                'reserved' => $level->reserved,
                'available' => round((float) $level->on_hand - (float) $level->reserved, 2),
                'product' => $level->product,
                'location' => $level->location,
                'warehouse' => $level->warehouse,
            ]);

        return inertia('Modules/Inventory/Putaway/Index', [
            'warehouses' => $warehouses,
            'levels' => $levels,
            'filters' => [
                'warehouse_id' => $warehouseId,
            ],
        ]);
    }

    public function store(StorePutawayRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $stockLocationId = WarehouseLocation::query()
            ->where('warehouse_id', $validated['warehouse_id'])
            ->where('code', 'STOCK')
            ->value('id');

        if (! $stockLocationId) {
            $warehouse = Warehouse::query()->find($validated['warehouse_id']);
            $warehouse?->createDefaultLocations();
            $stockLocationId = WarehouseLocation::query()
                ->where('warehouse_id', $validated['warehouse_id'])
                ->where('code', 'STOCK')
                ->value('id');
        }

        try {
            PutawayService::relocate([
                'product_id' => $validated['product_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'from_location_id' => $validated['from_location_id'],
                'to_location_id' => $validated['to_location_id'] ?? $stockLocationId,
                'quantity' => $validated['quantity'],
                'batch_number' => $validated['batch_number'] ?? null,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', __('inventory.messages.putaway_done'));
    }
}
