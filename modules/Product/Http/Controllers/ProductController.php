<?php

namespace Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Product\Http\Requests\StoreProductRequest;
use Modules\Product\Http\Requests\UpdateProductRequest;
use Modules\Product\Models\Brand;
use Modules\Product\Models\Product;
use Modules\Product\Models\ProductType;

class ProductController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the products.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $products = Product::query()
            ->with(['brand.principal:id,name', 'productType:id,name'])
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            })
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->when(request('brand_id'), fn ($q, $id) => $q->where('brand_id', $id))
            ->when(request('product_type_id'), fn ($q, $id) => $q->where('product_type_id', $id))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $brands = Brand::query()
            ->with('principal:id,name')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'principal_id']);

        $productTypes = ProductType::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id']);

        return Inertia::render('Modules/Product/Index', [
            'products' => $products,
            'brands' => $brands,
            'productTypes' => $productTypes,
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
                'brand_id' => request('brand_id'),
                'product_type_id' => request('product_type_id'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('products', 'create'),
                'update' => $user->hasPermissionFor('products', 'update'),
                'delete' => $user->hasPermissionFor('products', 'delete'),
            ],
        ]);
    }

    /**
     * The selectable options for the Unit field, sourced from the "units"
     * settings group so the list is centrally managed and consistent across
     * every product — see Settings.
     *
     * @return array<int, array{value: string, label: string}>
     */
    private function unitOptions(): array
    {
        return Setting::query()
            ->where('group', 'units')
            ->orderBy('sort_order')
            ->get(['value', 'label'])
            ->map(fn (Setting $setting) => ['value' => $setting->value, 'label' => $setting->label])
            ->all();
    }

    /** @return \Illuminate\Support\Collection<int, array<string, mixed>> */
    private function brandOptions(): \Illuminate\Support\Collection
    {
        return Brand::query()
            ->with('principal:id,name')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'principal_id']);
    }

    /** @return \Illuminate\Support\Collection<int, array<string, mixed>> */
    private function productTypeOptions(): \Illuminate\Support\Collection
    {
        return ProductType::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id']);
    }

    /**
     * Show the form for creating a new product.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Product/Create', [
            'units' => $this->unitOptions(),
            'brands' => $this->brandOptions(),
            'productTypes' => $this->productTypeOptions(),
        ]);
    }

    /**
     * Store a newly created product in storage.
     */
    public function store(StoreProductRequest $request): RedirectResponse
    {
        $product = Product::create([
            ...$request->validated(),
            'code' => Product::nextCode(),
        ]);

        return redirect()->route($this->getRoutePrefix().'.products.show', $product)
            ->with('success', 'Product created successfully.');
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product): Response
    {
        $user = Auth::user();
        $product->load(['brand.principal', 'productType']);

        return Inertia::render('Modules/Product/Show', [
            'product' => $product,
            'can' => [
                'update' => $user->hasPermissionFor('products', 'update'),
                'delete' => $user->hasPermissionFor('products', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(Product $product): Response
    {
        $product->load(['brand.principal', 'productType']);

        return Inertia::render('Modules/Product/Edit', [
            'product' => $product,
            'units' => $this->unitOptions(),
            'brands' => $this->brandOptions(),
            'productTypes' => $this->productTypeOptions(),
        ]);
    }

    /**
     * Update the specified product in storage.
     */
    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.products.show', $product)
            ->with('success', 'Product updated successfully.');
    }

    /**
     * Remove the specified product from storage.
     *
     * Product has no knowledge of Trip or any other module that might
     * reference it, so it cannot check "is this product referenced" itself —
     * the database's own foreign key constraint is what stops the delete, and
     * this just turns that into a readable message instead of a 500. The
     * delete is wrapped in its own transaction so a constraint violation only
     * rolls back this statement (via a savepoint) instead of poisoning an
     * outer one.
     */
    public function destroy(Product $product): RedirectResponse
    {
        try {
            DB::transaction(fn () => $product->delete());
        } catch (QueryException) {
            return back()->with('error', 'This product is still referenced by other records and cannot be deleted.');
        }

        return redirect()->route($this->getRoutePrefix().'.products.index')
            ->with('success', 'Product deleted successfully.');
    }
}
