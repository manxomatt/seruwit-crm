<?php

namespace Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Product\Http\Requests\StoreProductTypeRequest;
use Modules\Product\Http\Requests\UpdateProductTypeRequest;
use Modules\Product\Models\ProductType;

class ProductTypeController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $user = Auth::user();

        $productTypes = ProductType::query()
            ->with('parent:id,name')
            ->withCount(['products', 'children'])
            ->when(request('search'), fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Product/ProductTypes/Index', [
            'productTypes' => $productTypes,
            'filters' => [
                'search' => request('search'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('products', 'create'),
                'update' => $user->hasPermissionFor('products', 'update'),
                'delete' => $user->hasPermissionFor('products', 'delete'),
            ],
        ]);
    }

    public function create(): Response
    {
        $parentOptions = ProductType::query()
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Modules/Product/ProductTypes/Create', [
            'parentOptions' => $parentOptions,
        ]);
    }

    public function store(StoreProductTypeRequest $request): RedirectResponse
    {
        ProductType::create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.products.product-types.index')
            ->with('success', 'Tipe produk berhasil dibuat.');
    }

    public function edit(ProductType $productType): Response
    {
        $parentOptions = ProductType::query()
            ->whereNull('parent_id')
            ->where('id', '!=', $productType->id)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Modules/Product/ProductTypes/Edit', [
            'productType' => $productType,
            'parentOptions' => $parentOptions,
        ]);
    }

    public function update(UpdateProductTypeRequest $request, ProductType $productType): RedirectResponse
    {
        $productType->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.products.product-types.index')
            ->with('success', 'Tipe produk berhasil diperbarui.');
    }

    public function destroy(ProductType $productType): RedirectResponse
    {
        if ($productType->products()->exists()) {
            return back()->with('error', 'Tipe produk masih digunakan oleh produk dan tidak bisa dihapus.');
        }

        if ($productType->children()->exists()) {
            return back()->with('error', 'Tipe produk masih memiliki sub-tipe dan tidak bisa dihapus.');
        }

        $productType->delete();

        return redirect()->route($this->getRoutePrefix().'.products.product-types.index')
            ->with('success', 'Tipe produk berhasil dihapus.');
    }
}
