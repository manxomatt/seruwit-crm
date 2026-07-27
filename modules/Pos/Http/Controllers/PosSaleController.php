<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Support\AccessibleWarehouses;
use Modules\Inventory\Support\WarehouseKind;
use Modules\Pos\Http\Requests\StorePosSaleRequest;
use Modules\Pos\Http\Requests\VoidPosSaleRequest;
use Modules\Pos\Models\PosSale;
use Modules\Pos\Models\PosShift;
use Modules\Pos\Support\PosSaleService;
use RuntimeException;

class PosSaleController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        $accessibleIds = AccessibleWarehouses::ids();

        $sales = PosSale::query()
            ->with([
                'warehouse:id,name',
                'cashier:id,name',
                'payments',
            ])
            ->when($accessibleIds !== null, fn ($q) => $q->whereIn('warehouse_id', $accessibleIds ?: [0]))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('warehouse_id'), fn ($q) => $q->where('warehouse_id', $request->integer('warehouse_id')))
            ->when($request->filled('search'), function ($q) use ($request): void {
                $search = $request->string('search')->toString();
                $q->where('code', 'like', "%{$search}%");
            })
            ->when($request->filled('date'), fn ($q) => $q->whereDate('sold_at', $request->string('date')))
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        $stores = AccessibleWarehouses::query()
            ->ofKind(WarehouseKind::Store)
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Modules/Pos/Sales/Index', [
            'sales' => $sales,
            'stores' => $stores,
            'filters' => [
                'status' => $request->string('status')->toString() ?: null,
                'warehouse_id' => $request->integer('warehouse_id') ?: null,
                'search' => $request->string('search')->toString() ?: null,
                'date' => $request->string('date')->toString() ?: null,
            ],
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function store(StorePosSaleRequest $request, PosSaleService $service): RedirectResponse
    {
        $shift = PosShift::query()->findOrFail($request->integer('pos_shift_id'));

        if (! AccessibleWarehouses::allows(Auth::user(), (int) $shift->warehouse_id)) {
            abort(403);
        }

        try {
            $sale = $service->complete($shift, Auth::user(), $request->validated());
        } catch (RuntimeException $e) {
            return back()->withErrors(['cart' => $e->getMessage()]);
        }

        return redirect()
            ->route($this->getRoutePrefix().'.pos.terminal', ['sold' => $sale->id])
            ->with('success', __('pos.messages.sale_completed', ['code' => $sale->code]))
            ->with('last_sale_id', $sale->id);
    }

    public function show(PosSale $sale): Response
    {
        if (! AccessibleWarehouses::allows(Auth::user(), (int) $sale->warehouse_id)) {
            abort(403);
        }

        $sale->load([
            'warehouse:id,name',
            'cashier:id,name',
            'voider:id,name',
            'items.product:id,name,sku,unit',
            'payments',
            'shift:id,opened_at,status',
        ]);

        return Inertia::render('Modules/Pos/Sales/Show', [
            'sale' => $sale,
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function voidSale(VoidPosSaleRequest $request, PosSale $sale, PosSaleService $service): RedirectResponse
    {
        if (! AccessibleWarehouses::allows(Auth::user(), (int) $sale->warehouse_id)) {
            abort(403);
        }

        try {
            $service->void($sale, Auth::user(), $request->input('void_reason'));
        } catch (RuntimeException $e) {
            return back()->withErrors(['void' => $e->getMessage()]);
        }

        return redirect()
            ->route($this->getRoutePrefix().'.pos.sales.show', $sale)
            ->with('success', __('pos.messages.sale_voided'));
    }

    /**
     * @return array<string, bool>
     */
    protected function abilitiesFor(): array
    {
        $user = Auth::user();

        return [
            'void' => $user?->hasPermissionFor('pos', 'void') ?? false,
            'sell' => $user?->hasPermissionFor('pos', 'sell') ?? false,
        ];
    }
}
