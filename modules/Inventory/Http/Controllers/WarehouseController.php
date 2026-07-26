<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Modules\Inventory\Http\Requests\StoreWarehouseRequest;
use Modules\Inventory\Http\Requests\UpdateWarehouseRequest;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Support\AccessibleWarehouses;
use Modules\Inventory\Support\WarehouseKind;
use Symfony\Component\HttpKernel\Exception\HttpException;

class WarehouseController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index()
    {
        $kind = request('kind');

        return inertia('Modules/Inventory/Warehouses/Index', [
            'warehouses' => AccessibleWarehouses::query()
                ->select('id', 'name', 'location', 'kind', 'status', 'created_at')
                ->when($kind, fn ($query) => $query->ofKind($kind))
                ->withCount('locations')
                ->orderBy('name')
                ->get(),
            'filters' => [
                'kind' => $kind,
            ],
            'kinds' => WarehouseKind::values(),
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        if (
            $user
            && $user->hasRole(AccessibleWarehouses::ROLE_HEAD)
            && ! $user->hasRole(AccessibleWarehouses::ROLE_MANAGER)
        ) {
            abort(403, __('inventory.messages.warehouse_create_forbidden_for_head'));
        }

        return inertia('Modules/Inventory/Warehouses/Create', [
            'kinds' => WarehouseKind::values(),
        ]);
    }

    public function store(StoreWarehouseRequest $request): RedirectResponse
    {
        $user = auth()->user();
        if (
            $user
            && $user->hasRole(AccessibleWarehouses::ROLE_HEAD)
            && ! $user->hasRole(AccessibleWarehouses::ROLE_MANAGER)
        ) {
            abort(403, __('inventory.messages.warehouse_create_forbidden_for_head'));
        }

        $warehouse = Warehouse::create($request->validated());
        $warehouse->createDefaultLocations();

        if ($user !== null && AccessibleWarehouses::isScoped($user) && Schema::hasTable('user_warehouse')) {
            $user->warehouses()->syncWithoutDetaching([$warehouse->id]);
        }

        return redirect()->route($this->getRoutePrefix().'.inventory.warehouses.index')
            ->with('success', __('inventory.messages.warehouse_created'));
    }

    public function show(Warehouse $warehouse)
    {
        $this->authorizeWarehouse($warehouse);

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
        $this->authorizeWarehouse($warehouse);
        $warehouse->update($request->validated());

        return back()->with('success', __('inventory.messages.warehouse_updated'));
    }

    public function destroy(Warehouse $warehouse): RedirectResponse
    {
        $this->authorizeWarehouse($warehouse);
        $warehouse->delete();

        return redirect()->route($this->getRoutePrefix().'.inventory.warehouses.index')
            ->with('success', __('inventory.messages.warehouse_deleted'));
    }

    protected function authorizeWarehouse(Warehouse $warehouse): void
    {
        if (! AccessibleWarehouses::allows(auth()->user(), (int) $warehouse->id)) {
            throw new HttpException(403, __('inventory.validation.warehouse_access_denied'));
        }
    }
}
