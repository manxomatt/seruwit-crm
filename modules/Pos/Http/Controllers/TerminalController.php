<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Support\AccessibleWarehouses;
use Modules\Inventory\Support\SellableStock;
use Modules\Inventory\Support\WarehouseKind;
use Modules\Pos\Models\PosSale;
use Modules\Pos\Models\PosShift;
use Modules\Product\Models\Product;

class TerminalController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function show(Request $request): Response|RedirectResponse
    {
        $openShift = $this->currentOpenShift();

        if ($openShift === null && ! $request->boolean('setup')) {
            return redirect()->route($this->getRoutePrefix().'.pos.shifts.index', [
                'open' => 1,
            ]);
        }

        $stores = AccessibleWarehouses::query()
            ->ofKind(WarehouseKind::Store)
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'kind']);

        $catalog = [];

        if ($openShift !== null) {
            $warehouseId = (int) $openShift->warehouse_id;
            $catalog = $this->productPayload(
                $this->catalogProductsForStore($warehouseId),
                $warehouseId,
            );
        }

        $lastSale = null;
        $soldId = $request->integer('sold');

        if ($soldId > 0) {
            $lastSale = PosSale::query()
                ->with(['payments', 'items.product:id,name,sku'])
                ->whereKey($soldId)
                ->first();
        }

        return Inertia::render('Modules/Pos/Terminal/Show', [
            'shift' => $openShift?->load(['warehouse:id,name', 'opener:id,name']),
            'stores' => $stores,
            'favorites' => $catalog,
            'customers' => $this->customerPayload(),
            'priceMaps' => $this->priceMapsPayload(),
            'lastSale' => $lastSale,
            'tax' => [
                'enabled' => Setting::getValue('ecommerce.tax_enabled', '1') === '1',
                'rate' => (float) Setting::getValue('ecommerce.tax_rate', '11'),
                'inclusive' => true,
            ],
            'can' => $this->abilitiesFor(),
            'cashier' => Auth::user()?->only(['id', 'name']),
        ]);
    }

    public function searchProducts(Request $request): JsonResponse
    {
        $q = trim((string) $request->string('q'));
        $warehouseId = $request->integer('warehouse_id');

        if ($warehouseId <= 0) {
            return response()->json(['products' => []]);
        }

        if (! AccessibleWarehouses::allows(Auth::user(), $warehouseId)) {
            abort(403);
        }

        $products = Product::query()
            ->where('status', 'active')
            ->when($q !== '', function ($query) use ($q): void {
                $query->where(function ($inner) use ($q): void {
                    $inner->where('name', 'like', "%{$q}%")
                        ->orWhere('sku', 'like', "%{$q}%")
                        ->orWhere('barcode', 'like', "%{$q}%")
                        ->orWhere('code', 'like', "%{$q}%");
                });
            })
            ->orderBy('name')
            ->limit(40)
            ->get();

        return response()->json([
            'products' => $this->productPayload($products, $warehouseId),
        ]);
    }

    /**
     * Active sellable catalog for a store: merchandise with on-hand at this
     * warehouse, plus services. Favorites float to the top.
     *
     * @return Collection<int, Product>
     */
    protected function catalogProductsForStore(int $warehouseId): Collection
    {
        $stockedIds = SellableStock::query()
            ->where('warehouse_id', $warehouseId)
            ->select('product_id')
            ->groupBy('product_id')
            ->havingRaw('SUM(on_hand - reserved) > 0')
            ->pluck('product_id');

        return Product::query()
            ->where('status', 'active')
            ->where(function ($query) use ($stockedIds): void {
                $query->whereIn('id', $stockedIds)
                    ->orWhere('category', 'service');
            })
            ->orderByDesc('is_favorite')
            ->orderBy('name')
            ->limit(96)
            ->get();
    }

    /**
     * @param  Collection<int, Product>  $products
     * @return list<array<string, mixed>>
     */
    protected function productPayload(Collection $products, int $warehouseId): array
    {
        $merchandiseIds = $products
            ->reject(fn (Product $product): bool => $product->isService())
            ->pluck('id')
            ->all();

        $availability = $merchandiseIds === []
            ? collect()
            : SellableStock::query()
                ->where('warehouse_id', $warehouseId)
                ->whereIn('product_id', $merchandiseIds)
                ->get(['product_id', 'on_hand', 'reserved'])
                ->groupBy(fn ($level): int => (int) $level->product_id)
                ->map(function ($levels): float {
                    return max(0, (float) $levels->sum(
                        fn ($level): float => (float) $level->on_hand - (float) $level->reserved
                    ));
                });

        return $products->map(function (Product $product) use ($availability): array {
            $available = $product->isService()
                ? null
                : (float) ($availability->get($product->id) ?? 0);

            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'unit' => $product->unit,
                'price' => (float) ($product->price ?? 0),
                'image' => $product->primaryImage(),
                'is_service' => $product->isService(),
                'is_favorite' => (bool) $product->is_favorite,
                'available' => $available,
            ];
        })->values()->all();
    }

    /**
     * @return list<array{id: int, name: string, code: string|null, price_list_id: int|null}>
     */
    protected function customerPayload(): array
    {
        if (! class_exists(\Modules\Partners\Models\Partner::class)) {
            return [];
        }

        $query = \Modules\Partners\Models\Partner::query()
            ->where('customer_rank', '>', 0)
            ->orderBy('name')
            ->limit(200);

        if (\Illuminate\Support\Facades\Schema::hasColumn('partners', 'price_list_id')) {
            $query->select(['id', 'name', 'code', 'price_list_id']);
        } else {
            $query->select(['id', 'name', 'code']);
        }

        return $query->get()->map(fn ($partner): array => [
            'id' => (int) $partner->id,
            'name' => (string) $partner->name,
            'code' => $partner->code,
            'price_list_id' => isset($partner->price_list_id) && $partner->price_list_id
                ? (int) $partner->price_list_id
                : null,
        ])->all();
    }

    /**
     * @return array<int, array<int, float>>
     */
    protected function priceMapsPayload(): array
    {
        if (! class_exists(\Modules\Sales\Support\PriceListResolver::class)) {
            return [];
        }

        return \Modules\Sales\Support\PriceListResolver::activePriceMaps();
    }

    protected function currentOpenShift(): ?PosShift
    {
        $accessibleIds = AccessibleWarehouses::ids();

        return PosShift::query()
            ->where('status', PosShift::STATUS_OPEN)
            ->when($accessibleIds !== null, fn ($q) => $q->whereIn('warehouse_id', $accessibleIds ?: [0]))
            ->latest('opened_at')
            ->first();
    }

    /**
     * @return array<string, bool>
     */
    protected function abilitiesFor(): array
    {
        $user = Auth::user();

        return [
            'sell' => $user?->hasPermissionFor('pos', 'sell') ?? false,
            'open_shift' => $user?->hasPermissionFor('pos', 'open_shift') ?? false,
            'close_shift' => $user?->hasPermissionFor('pos', 'close_shift') ?? false,
            'void' => $user?->hasPermissionFor('pos', 'void') ?? false,
        ];
    }
}
