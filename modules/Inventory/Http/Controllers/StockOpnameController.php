<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Modules\Inventory\Http\Requests\FinalizeStockOpnameRequest;
use Modules\Inventory\Http\Requests\StoreStockOpnameRequest;
use Modules\Inventory\Http\Requests\UpdateStockOpnameCountsRequest;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\StockOpname;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Support\StockMovementRecorder;
use Modules\Product\Models\Product;

class StockOpnameController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index()
    {
        return inertia('Modules/Inventory/StockOpnames/Index', [
            'opnames' => StockOpname::query()
                ->with(['warehouse:id,name', 'createdBy:id,name'])
                ->select('id', 'warehouse_id', 'opname_date', 'status', 'completed_at', 'created_by', 'created_at')
                ->latest('created_at')
                ->paginate(20),
        ]);
    }

    public function create()
    {
        return inertia('Modules/Inventory/StockOpnames/Create', [
            'warehouses' => Warehouse::query()
                ->where('status', 'active')
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(StoreStockOpnameRequest $request): RedirectResponse
    {
        $opname = DB::transaction(function () use ($request) {
            $opname = StockOpname::create(array_merge(
                $request->validated(),
                ['created_by' => auth()->id()],
            ));

            $levels = StockLevel::query()
                ->where('warehouse_id', $opname->warehouse_id)
                ->pluck('on_hand', 'product_id');

            $products = Product::query()->select('id')->get();

            foreach ($products as $product) {
                $systemQty = $levels[$product->id] ?? 0;

                $opname->items()->create([
                    'product_id' => $product->id,
                    'system_qty' => $systemQty,
                    'actual_qty' => $systemQty,
                ]);
            }

            return $opname;
        });

        return redirect()->route($this->getRoutePrefix().'.inventory.stock-opnames.show', $opname)
            ->with('success', 'Stock opname created. Enter your physical counts.');
    }

    public function show(StockOpname $opname)
    {
        return inertia('Modules/Inventory/StockOpnames/Show', [
            'opname' => $opname->load(['warehouse:id,name', 'createdBy:id,name', 'items.product:id,name,category,unit']),
        ]);
    }

    public function updateCounts(UpdateStockOpnameCountsRequest $request, StockOpname $opname): RedirectResponse
    {
        abort_if($opname->status === 'completed', 403);

        DB::transaction(function () use ($opname, $request) {
            foreach ($request->validated('items') as $item) {
                $opname->items()->whereKey($item['id'])->update([
                    'actual_qty' => $item['actual_qty'],
                ]);
            }

            if ($opname->status === 'draft') {
                $opname->update(['status' => 'in_progress']);
            }
        });

        return back()->with('success', 'Counts saved');
    }

    public function finalize(FinalizeStockOpnameRequest $request, StockOpname $opname): RedirectResponse
    {
        abort_if($opname->status !== 'in_progress', 403);

        DB::transaction(function () use ($opname) {
            foreach ($opname->items as $item) {
                $variance = (float) $item->actual_qty - (float) $item->system_qty;

                if ($variance === 0.0) {
                    continue;
                }

                StockMovementRecorder::record([
                    'product_id' => $item->product_id,
                    'warehouse_id' => $opname->warehouse_id,
                    'type' => $variance > 0 ? 'in' : 'out',
                    'quantity' => abs($variance),
                    'source_type' => 'opname',
                    'source_id' => $opname->id,
                    'notes' => "opname adjustment: system={$item->system_qty}, actual={$item->actual_qty}",
                    'recorded_by' => auth()->id(),
                    'recorded_at' => now(),
                ]);
            }

            $opname->update(['status' => 'completed', 'completed_at' => now()]);
        });

        return redirect()->route($this->getRoutePrefix().'.inventory.stock-opnames.show', $opname)
            ->with('success', 'Stock opname finalized and adjustments recorded');
    }
}
