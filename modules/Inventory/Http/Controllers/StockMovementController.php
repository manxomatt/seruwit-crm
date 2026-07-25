<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\Inventory\Http\Requests\StoreStockMovementRequest;
use Modules\Inventory\Http\Requests\StoreStockTransferRequest;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\WarehouseLocation;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Product\Models\Product;
use RuntimeException;

class StockMovementController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index()
    {
        $movements = StockMovement::query()
            ->with(['product:id,name', 'warehouse:id,name', 'location:id,name,code', 'recordedBy:id,name'])
            ->select('id', 'product_id', 'warehouse_id', 'location_id', 'type', 'quantity', 'source_type', 'source_id', 'reference_code', 'batch_number', 'expiry_date', 'notes', 'recorded_by', 'recorded_at')
            ->latest('recorded_at')
            ->paginate(15)
            ->withQueryString();

        $grnNumbers = $movements->getCollection()
            ->filter(fn (StockMovement $movement): bool => in_array($movement->source_type, ['grn', 'grn_void'], true) && filled($movement->reference_code))
            ->pluck('reference_code')
            ->unique()
            ->values();

        $grnIdsByNumber = [];
        if ($grnNumbers->isNotEmpty() && class_exists(\Modules\Purchasing\Models\GoodReceiptNote::class)) {
            $grnIdsByNumber = \Modules\Purchasing\Models\GoodReceiptNote::query()
                ->whereIn('grn_number', $grnNumbers)
                ->pluck('id', 'grn_number')
                ->all();
        }

        $movements->getCollection()->transform(function (StockMovement $movement) use ($grnIdsByNumber) {
            if (in_array($movement->source_type, ['grn', 'grn_void'], true) && filled($movement->reference_code)) {
                $movement->setAttribute('grn_id', $grnIdsByNumber[$movement->reference_code] ?? null);
            }

            return $movement;
        });

        return inertia('Modules/Inventory/StockMovements/Index', [
            'movements' => $movements,
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
            'batch_number' => $validated['batch_number'] ?? null,
            'expiry_date' => $validated['expiry_date'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'recorded_by' => auth()->id(),
            'recorded_at' => now(),
        ]);

        return redirect()->route($this->getRoutePrefix().'.inventory.stock-movements.index')
            ->with('success', __('inventory.messages.movement_recorded'));
    }

    public function createTransfer()
    {
        return inertia('Modules/Inventory/StockMovements/Transfer', [
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

    public function storeTransfer(StoreStockTransferRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        try {
            $result = StockMovementRecorder::transfer([
                'product_id' => $validated['product_id'],
                'from_warehouse_id' => $validated['from_warehouse_id'],
                'to_warehouse_id' => $validated['to_warehouse_id'],
                'from_location_id' => $validated['from_location_id'] ?? null,
                'to_location_id' => $validated['to_location_id'] ?? null,
                'quantity' => $validated['quantity'],
                'batch_number' => $validated['batch_number'] ?? null,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'reference_code' => $validated['reference_code'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'recorded_by' => auth()->id(),
                'recorded_at' => now(),
            ]);
        } catch (RuntimeException $e) {
            return back()->withInput()->with('error', $e->getMessage());
        }

        return redirect()->route($this->getRoutePrefix().'.inventory.stock-movements.index')
            ->with('success', __('inventory.messages.transfer_recorded', ['code' => $result['reference_code']]));
    }
}
