<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Support\AccessibleWarehouses;
use Modules\Inventory\Support\StockMovementRecorder;
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

        $favorites = [];

        if ($openShift !== null) {
            $favorites = $this->productPayload(
                Product::query()
                    ->where('status', 'active')
                    ->where(function ($q): void {
                        $q->where('is_favorite', true)
                            ->orWhereNotNull('barcode');
                    })
                    ->orderByDesc('is_favorite')
                    ->orderBy('name')
                    ->limit(48)
                    ->get(),
                (int) $openShift->warehouse_id,
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
            'favorites' => $favorites,
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
     * @param  \Illuminate\Support\Collection<int, Product>  $products
     * @return list<array<string, mixed>>
     */
    protected function productPayload($products, int $warehouseId): array
    {
        return $products->map(function (Product $product) use ($warehouseId): array {
            $available = $product->isService()
                ? null
                : (float) StockMovementRecorder::availableOnHand($product->id, $warehouseId);

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
