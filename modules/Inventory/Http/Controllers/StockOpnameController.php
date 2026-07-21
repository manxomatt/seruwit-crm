<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Modules\Inventory\Http\Requests\FinalizeStockOpnameRequest;
use Modules\Inventory\Http\Requests\StoreStockOpnameRequest;
use Modules\Inventory\Http\Requests\UpdateStockOpnameRequest;
use Modules\Inventory\Models\StockOpname;
use Modules\Inventory\Support\StockMovementRecorder;

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

    public function store(StoreStockOpnameRequest $request): RedirectResponse
    {
        $opname = StockOpname::create(array_merge(
            $request->validated(),
            ['created_by' => auth()->id()],
        ));

        return redirect()->route('inventory.stock-opnames.show', $opname)
            ->with('success', 'Stock opname created');
    }

    public function show(StockOpname $opname)
    {
        return inertia('Modules/Inventory/StockOpnames/Show', [
            'opname' => $opname->load(['warehouse:id,name', 'createdBy:id,name', 'items.product:id,name,category']),
        ]);
    }

    public function update(UpdateStockOpnameRequest $request, StockOpname $opname): RedirectResponse
    {
        abort_if($opname->status !== 'draft', 403);

        $opname->update($request->validated());

        return back()->with('success', 'Stock opname updated');
    }

    public function finalize(FinalizeStockOpnameRequest $request, StockOpname $opname): RedirectResponse
    {
        abort_if($opname->status !== 'in_progress', 403);

        DB::transaction(function () use ($opname, $request) {
            $items = $request->validated('items');

            foreach ($items as $item) {
                $opnameItem = $opname->items()->where('product_id', $item['product_id'])->first();
                if (! $opnameItem) {
                    continue;
                }

                $variance = $opnameItem->actual_qty - $opnameItem->system_qty;
                if ($variance === 0) {
                    continue;
                }

                // Record adjustment movement
                StockMovementRecorder::record([
                    'product_id' => $opnameItem->product_id,
                    'warehouse_id' => $opname->warehouse_id,
                    'type' => $variance > 0 ? 'in' : 'out',
                    'quantity' => abs($variance),
                    'source_type' => 'opname',
                    'source_id' => $opname->id,
                    'notes' => "opname adjustment: system={$opnameItem->system_qty}, actual={$opnameItem->actual_qty}",
                    'recorded_by' => auth()->id(),
                    'recorded_at' => now(),
                ]);
            }

            $opname->update(['status' => 'completed', 'completed_at' => now()]);
        });

        return redirect()->route('inventory.stock-opnames.show', $opname)
            ->with('success', 'Stock opname finalized and adjustments recorded');
    }
}
